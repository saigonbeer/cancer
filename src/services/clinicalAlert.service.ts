import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import type { Role } from '@/lib/auth';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type AlertCandidate = {
  type: string;
  severity: AlertSeverity;
  message: string;
};

type ReportLike = {
  severity: string | null;
  ctcaeGrade: number | null;
  status: string;
  createdAt: Date;
};

const SEVERITY_RANK: Record<string, number> = { 'Nhẹ': 1, 'Trung bình': 2, 'Nặng': 3 };

/** Luật 1: tần suất báo cáo tăng đột biến (≥3 báo cáo trong 48 giờ gần nhất). */
export function ruleReportSpike(reports: ReportLike[], now = Date.now()): AlertCandidate | null {
  const windowMs = 48 * 3600 * 1000;
  const recent = reports.filter((r) => now - r.createdAt.getTime() <= windowMs);
  if (recent.length >= 3) {
    return {
      type: 'REPORT_SPIKE',
      severity: 'MEDIUM',
      message: `Bệnh nhân gửi ${recent.length} báo cáo tác dụng phụ trong 48 giờ qua — tần suất tăng bất thường.`,
    };
  }
  return null;
}

/** Luật 2: mức độ leo thang liên tiếp qua 3 lần báo cáo gần nhất (Nhẹ → Trung bình → Nặng). */
export function ruleSeverityEscalation(reports: ReportLike[]): AlertCandidate | null {
  // reports đã sắp xếp mới nhất trước (desc); lấy 3 gần nhất rồi đảo lại theo thời gian tăng dần
  const last3 = reports.slice(0, 3);
  if (last3.length < 3) return null;
  const chrono = [...last3].reverse();
  const ranks = chrono.map((r) => SEVERITY_RANK[r.severity || ''] ?? 0);
  const strictlyIncreasing = ranks.every((r) => r > 0) && ranks[0] < ranks[1] && ranks[1] < ranks[2];
  if (strictlyIncreasing) {
    return {
      type: 'SEVERITY_ESCALATION',
      severity: 'HIGH',
      message: 'Mức độ tác dụng phụ tăng dần liên tiếp qua 3 lần báo cáo gần nhất.',
    };
  }
  return null;
}

/** Luật 3: có báo cáo CTCAE độ ≥3 còn ở trạng thái Chờ xử trí quá 24 giờ. */
export function ruleUnhandledSevereGrade(reports: ReportLike[], now = Date.now()): AlertCandidate | null {
  const dayMs = 24 * 3600 * 1000;
  const found = reports.some(
    (r) => (r.ctcaeGrade ?? 0) >= 3 && r.status === 'PENDING' && now - r.createdAt.getTime() > dayMs
  );
  if (found) {
    return {
      type: 'GRADE3_UNHANDLED',
      severity: 'HIGH',
      message: 'Có báo cáo CTCAE độ ≥3 chưa được xử trí sau hơn 24 giờ.',
    };
  }
  return null;
}

const ALERT_RULES = [ruleReportSpike, ruleSeverityEscalation, ruleUnhandledSevereGrade];

export function evaluateAlerts(reports: ReportLike[], now = Date.now()): AlertCandidate[] {
  const sorted = [...reports].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return ALERT_RULES.map((rule) => rule(sorted, now)).filter((a): a is AlertCandidate => a !== null);
}

/** Tính lại cảnh báo cho 1 bệnh nhân: tạo/cập nhật cảnh báo đang khớp luật, xoá cảnh báo không còn khớp. */
export async function syncPatientAlerts(patientId: string) {
  const reports = await prisma.sideEffectReport.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { severity: true, ctcaeGrade: true, status: true, createdAt: true },
  });

  const candidates = evaluateAlerts(reports);
  const candidateTypes = candidates.map((c) => c.type);

  await prisma.clinicalAlert.deleteMany({
    where: { patientId, type: { notIn: candidateTypes.length ? candidateTypes : ['__none__'] } },
  });

  for (const c of candidates) {
    await prisma.clinicalAlert.upsert({
      where: { patientId_type: { patientId, type: c.type } },
      create: { patientId, type: c.type, severity: c.severity, message: c.message },
      update: { message: c.message, severity: c.severity },
    });
  }
}

export async function getPatientAlerts(patientId: string) {
  await syncPatientAlerts(patientId);
  return prisma.clinicalAlert.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } });
}

/** Cảnh báo cho tất cả bệnh nhân đang được 1 bác sĩ theo dõi (có báo cáo tác dụng phụ). */
export async function getActiveAlertsForDoctor(doctorId: string) {
  const patients = await prisma.sideEffectReport.findMany({
    where: { patient: { doctorId } },
    distinct: ['patientId'],
    select: { patientId: true },
  });

  for (const p of patients) await syncPatientAlerts(p.patientId);

  return prisma.clinicalAlert.findMany({
    where: { patient: { doctorId } },
    include: { patient: { select: { id: true, patientCode: true, user: { select: { name: true } } } } },
    orderBy: [{ createdAt: 'desc' }],
  });
}

export async function decideAlert(alertId: string, status: 'CONFIRMED' | 'DISMISSED', note: string | undefined, role: Role) {
  await assertPermission('sideeffects', role);
  return prisma.clinicalAlert.update({
    where: { id: alertId },
    data: { status, note, decidedAt: new Date() },
  });
}
