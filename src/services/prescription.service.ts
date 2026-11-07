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
  role: Role,
  ack?: { confirmed: boolean; note?: string }
) {
  await assertPermission('medications', role);

  const drugNames = items.map((i) => i.drugName);
  const interactions = await checkDrugInteractions(drugNames);

  // Có tương tác nhưng bác sĩ chưa xác nhận: không lưu đơn, trả cảnh báo để bác sĩ xác nhận trước.
  if (interactions.length > 0 && !ack?.confirmed) {
    return { needsAck: true as const, interactions };
  }

  const prescription = await prisma.prescription.create({
    data: {
      visitId,
      prescribedBy,
      interactionAckAt: interactions.length > 0 ? new Date() : undefined,
      interactionAckNote: interactions.length > 0 ? ack?.note || undefined : undefined,
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

  return { needsAck: false as const, prescription, interactions };
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

/** Các đơn thuốc do chính bác sĩ này kê (tra theo Visit.doctorId), không giới hạn theo bệnh nhân. */
export async function getPrescriptionsByDoctor(doctorUserId: string, take = 50) {
  const profile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId }, select: { id: true } });
  if (!profile) return [];

  return prisma.prescription.findMany({
    where: { visit: { doctorId: profile.id } },
    include: {
      items: true,
      visit: {
        select: {
          visitDate: true,
          type: true,
          patient: { select: { id: true, patientCode: true, user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { prescribedAt: 'desc' },
    take,
  });
}
