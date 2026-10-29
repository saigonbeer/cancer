import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import type { Role } from '@/lib/auth';

export const REGIMEN_DECISIONS = ['NO_CHANGE', 'HOLD', 'REDUCE'] as const;
export type RegimenDecision = (typeof REGIMEN_DECISIONS)[number];

export type ManagementSheet = {
  managementNote?: string | null;
  outcome?: string | null;
  regimenDecision: RegimenDecision;
  decisionReason?: string | null;
};

/** Bác sĩ chỉ được thao tác trên báo cáo của bệnh nhân mình phụ trách (admin xem được tất cả). */
async function assertReportAccess(reportId: string, userId: string, role: Role) {
  const report = await prisma.sideEffectReport.findUnique({
    where: { id: reportId },
    select: { id: true, patient: { select: { doctorId: true } } },
  });
  if (!report) throw new Error('Không tìm thấy báo cáo');
  if (role === 'ADMIN') return report;

  const doctor = await prisma.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!doctor || report.patient.doctorId !== doctor.id) {
    throw new Error('Bạn không phụ trách bệnh nhân này');
  }
  return report;
}

/** Lưu phiếu xử trí tác dụng phụ và đánh dấu báo cáo là đã xử trí. */
export async function saveManagementSheet(reportId: string, userId: string, role: Role, sheet: ManagementSheet) {
  await assertPermission('sideeffects', role);
  await assertReportAccess(reportId, userId, role);

  if (sheet.regimenDecision !== 'NO_CHANGE' && !sheet.decisionReason?.trim()) {
    throw new Error('Vui lòng nhập lý do khi hoãn chu kỳ hoặc giảm liều');
  }

  return prisma.sideEffectReport.update({
    where: { id: reportId },
    data: {
      managementNote: sheet.managementNote?.trim() || null,
      outcome: sheet.outcome?.trim() || null,
      regimenDecision: sheet.regimenDecision,
      decisionReason: sheet.regimenDecision === 'NO_CHANGE' ? null : sheet.decisionReason?.trim() || null,
      doseReduced: sheet.regimenDecision === 'REDUCE',
      status: 'RESOLVED',
      managedAt: new Date(),
    },
  });
}

/** Bật / tắt đánh dấu "Theo dõi thêm" (đã biết có tương tác với bệnh nhân). */
export async function setMonitorMore(reportId: string, userId: string, role: Role, monitorMore: boolean) {
  await assertPermission('sideeffects', role);
  await assertReportAccess(reportId, userId, role);
  return prisma.sideEffectReport.update({ where: { id: reportId }, data: { monitorMore } });
}
