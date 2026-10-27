import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import type { Role } from '@/lib/auth';

export async function checkDrugInteractions(drugNames: string[]) {
  if (!drugNames || drugNames.length < 2) return [];

  const drugs = await prisma.catalogDrug.findMany({
    where: {
      name: { in: drugNames }
    }
  });

  const drugIds = drugs.map((d) => d.id);
  const interactions = await prisma.drugInteraction.findMany({
    where: {
      OR: [
        { drugAId: { in: drugIds }, drugBId: { in: drugIds } }
      ]
    },
    include: {
      drugA: true,
      drugB: true
    }
  });

  return interactions;
}

export async function createPrescription(
  visitId: string,
  prescribedBy: string,
  items: Array<{
    drugName: string;
    dose?: string;
    unit?: string;
    frequency?: string;
    duration?: string;
    quantity?: string;
    reminderTimes?: string;
  }>,
  role: Role
) {
  await assertPermission('medications', role);

  const drugNames = items.map((i) => i.drugName);
  const interactions = await checkDrugInteractions(drugNames);

  const prescription = await prisma.prescription.create({
    data: {
      visitId,
      prescribedBy,
      items: {
        create: items.map((item) => ({
          drugName: item.drugName,
          dose: item.dose,
          unit: item.unit,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          reminderTimes: item.reminderTimes
        }))
      }
    },
    include: { items: true }
  });

  return { prescription, interactions };
}

export async function getPrescriptionsByPatient(patientId: string) {
  return prisma.prescription.findMany({
    where: {
      visit: { patientId }
    },
    include: {
      items: true,
      visit: {
        select: { visitDate: true, type: true }
      }
    },
    orderBy: { prescribedAt: 'desc' }
  });
}
