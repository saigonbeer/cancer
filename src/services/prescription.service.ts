import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import { assertOwnsPatient } from '@/lib/ownership';
import { startOfDay, isActiveOn } from '@/lib/medicationSchedule';
import type { Role } from '@/lib/auth';

/** Tên các thuốc đang trong thời gian sử dụng hiện hành của bệnh nhân (gộp mọi đơn, không trùng lặp). */
export async function getActiveDrugNames(patientId: string): Promise<string[]> {
  const today = startOfDay(new Date());
  const prescriptions = await prisma.prescription.findMany({
    where: { visit: { patientId } },
    include: { items: true },
  });

  const names = new Set<string>();
  for (const pr of prescriptions) {
    for (const item of pr.items) {
      if (isActiveOn(pr.prescribedAt, item.duration, today)) names.add(item.drugName);
    }
  }
  return Array.from(names);
}

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
  doctorUserId: string,
  ack?: { confirmed: boolean; note?: string }
) {
  await assertPermission('medications', role);

  const visit = await prisma.visit.findUnique({ where: { id: visitId }, select: { patientId: true } });
  if (!visit) throw new Error('Không tìm thấy lượt khám.');
  await assertOwnsPatient(visit.patientId, doctorUserId, role);

  const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId }, select: { id: true } });

  // Đối chiếu tương tác với TOÀN BỘ thuốc bệnh nhân đang dùng (mọi đơn còn hiệu lực),
  // không chỉ các thuốc vừa nhập trong đơn này — khớp với cách bệnh nhân đang được cảnh báo.
  const activeDrugNames = await getActiveDrugNames(visit.patientId);
  const newDrugNames = items.map((i) => i.drugName);
  const drugNames = Array.from(new Set([...activeDrugNames, ...newDrugNames]));
  const interactions = await checkDrugInteractions(drugNames);

  // Có tương tác nhưng bác sĩ chưa xác nhận: không lưu đơn, trả cảnh báo để bác sĩ xác nhận trước.
  if (interactions.length > 0 && !ack?.confirmed) {
    return { needsAck: true as const, interactions };
  }

  const prescription = await prisma.prescription.create({
    data: {
      visitId,
      prescribedById: doctorProfile?.id,
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
    include: { items: true, prescribedByDoctor: { select: { user: { select: { name: true } } } } }
  });

  return { needsAck: false as const, prescription, interactions };
}

export async function getPrescriptionsByPatient(patientId: string, doctorUserId: string, role: Role) {
  await assertOwnsPatient(patientId, doctorUserId, role);
  return prisma.prescription.findMany({
    where: {
      visit: { patientId }
    },
    include: {
      items: true,
      prescribedByDoctor: { select: { user: { select: { name: true } } } },
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
      prescribedByDoctor: { select: { user: { select: { name: true } } } },
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
