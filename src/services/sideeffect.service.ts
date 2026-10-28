import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import type { Role } from '@/lib/auth';

export async function reportSideEffect(
  data: {
    patientId: string;
    symptom: string;
    severity?: string;
    site?: string;
    photoUrl?: string;
    cycle?: number;
    note?: string;
  },
  role: Role
) {
  await assertPermission('sideeffects', role);

  let grade = 1;
  if (data.severity === 'Trung bình') grade = 2;
  if (data.severity === 'Nặng') grade = 3;

  const report = await prisma.sideEffectReport.create({
    data: {
      patientId: data.patientId,
      symptom: data.symptom,
      severity: data.severity,
      ctcaeGrade: grade,
      site: data.site,
      photoUrl: data.photoUrl,
      cycle: data.cycle,
      note: data.note,
      status: 'PENDING'
    }
  });

  return report;
}

export async function getSideEffectReports(options?: {
  doctorId?: string;
  patientId?: string;
  status?: 'PENDING' | 'RESOLVED';
}) {
  const where: any = {};
  if (options?.status) where.status = options.status;
  if (options?.patientId) where.patientId = options.patientId;
  if (options?.doctorId) {
    where.patient = { doctorId: options.doctorId };
  }

  return prisma.sideEffectReport.findMany({
    where,
    include: {
      patient: {
        include: {
          user: { select: { id: true, name: true, phone: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateSideEffectStatus(
  reportId: string,
  status: 'PENDING' | 'RESOLVED',
  ctcaeGrade?: number,
  role?: Role,
  doseReduced?: boolean
) {
  if (role) await assertPermission('sideeffects', role);

  return prisma.sideEffectReport.update({
    where: { id: reportId },
    data: {
      status,
      ...(ctcaeGrade ? { ctcaeGrade } : {}),
      ...(typeof doseReduced === 'boolean' ? { doseReduced } : {})
    }
  });
}
