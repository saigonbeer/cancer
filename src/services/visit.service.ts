import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import type { Role } from '@/lib/auth';

export async function createVisit(
  data: {
    patientId: string;
    type: 'FIRST' | 'FOLLOWUP';
    history?: string;
    illness?: string;
    examination?: string;
    labResults?: string;
    diagnosis?: string;
    progress?: string;
    nextPlan?: string;
    note?: string;
    treatmentPlan?: {
      surgeryOn: boolean;
      surgeryData?: any;
      radioOn: boolean;
      radioData?: any;
      chemoOn: boolean;
      chemoData?: any;
      immunoOn: boolean;
      immunoData?: any;
      targetedOn: boolean;
      targetedData?: any;
      hormoneOn: boolean;
      hormoneData?: any;
    };
  },
  role: Role
) {
  await assertPermission('record', role);

  const visit = await prisma.visit.create({
    data: {
      patientId: data.patientId,
      type: data.type,
      history: data.history,
      illness: data.illness,
      examination: data.examination,
      labResults: data.labResults,
      diagnosis: data.diagnosis,
      progress: data.progress,
      nextPlan: data.nextPlan,
      note: data.note,
      ...(data.treatmentPlan
        ? {
            treatmentPlans: {
              create: data.treatmentPlan
            }
          }
        : {})
    },
    include: {
      treatmentPlans: true,
      prescriptions: { include: { items: true } }
    }
  });

  return visit;
}

export async function getPatientVisits(patientId: string) {
  return prisma.visit.findMany({
    where: { patientId },
    include: {
      treatmentPlans: true,
      prescriptions: { include: { items: true } }
    },
    orderBy: { visitDate: 'desc' }
  });
}
