import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import type { Role } from '@/lib/auth';

export async function getDoctorDashboardStats(userId: string) {
  const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
  if (!doctor) {
    return { activePatients: 0, urgentAlerts: 0, todayAppointments: 0, weeklyChemo: 0 };
  }

  const activePatients = await prisma.patientProfile.count({
    where: { doctorId: doctor.id },
  });

  const urgentAlerts = await prisma.sideEffectReport.count({
    where: {
      patient: { doctorId: doctor.id },
      status: 'PENDING',
      OR: [
        { ctcaeGrade: { gte: 3 } },
        { severity: 'Nặng' }
      ]
    }
  });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayAppointments = await prisma.appointment.count({
    where: {
      doctorId: userId,
      datetime: { gte: startOfDay, lte: endOfDay }
    }
  });

  const weeklyChemo = await prisma.visit.count({
    where: {
      patient: { doctorId: doctor.id },
      treatmentPlans: {
        some: { chemoOn: true }
      }
    }
  });

  return { activePatients, urgentAlerts, todayAppointments, weeklyChemo };
}

export async function getDoctorPatients(userId: string, role: Role) {
  await assertPermission('record', role);
  const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
  if (!doctor) return [];

  return prisma.patientProfile.findMany({
    where: { doctorId: doctor.id },
    include: {
      user: {
        select: { id: true, name: true, dob: true, phone: true, email: true }
      },
      visits: {
        orderBy: { visitDate: 'desc' },
        take: 1,
        include: {
          treatmentPlans: true,
          prescriptions: { include: { items: true } }
        }
      }
    },
    orderBy: { user: { name: 'asc' } }
  });
}
