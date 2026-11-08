import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import type { Role } from '@/lib/auth';

export async function getDoctorDashboardStats(userId: string) {
  const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
  if (!doctor) {
    return { activePatients: 0, urgentAlerts: 0, todayAppointments: 0, weeklyChemo: 0 };
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // 4 truy vấn độc lập — chạy song song thay vì tuần tự để giảm tổng thời gian chờ round-trip tới DB.
  const [activePatients, urgentAlerts, todayAppointments, weeklyChemo] = await Promise.all([
    prisma.patientProfile.count({
      where: { doctorId: doctor.id },
    }),
    prisma.sideEffectReport.count({
      where: {
        patient: { doctorId: doctor.id },
        status: 'PENDING',
        OR: [
          { ctcaeGrade: { gte: 3 } },
          { severity: 'Nặng' }
        ]
      }
    }),
    prisma.appointment.count({
      where: {
        doctorId: userId,
        datetime: { gte: startOfDay, lte: endOfDay }
      }
    }),
    prisma.visit.count({
      where: {
        patient: { doctorId: doctor.id },
        treatmentPlans: {
          some: { chemoOn: true }
        }
      }
    }),
  ]);

  return { activePatients, urgentAlerts, todayAppointments, weeklyChemo };
}

export async function getDoctorPatients(userId: string, role: Role) {
  await assertPermission('record', role);
  const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
  if (!doctor) return [];

  // Danh sách này chỉ dùng để tìm/chọn bệnh nhân (sidebar, ô tìm kiếm) — hồ sơ khám đầy đủ
  // được tải riêng qua /api/doctor/visits khi bác sĩ chọn một bệnh nhân cụ thể, nên không
  // cần kéo kèm visits/treatmentPlans/prescriptions ở đây (trước đây tải về rồi bỏ không dùng).
  return prisma.patientProfile.findMany({
    where: { doctorId: doctor.id },
    include: {
      user: {
        select: { id: true, name: true, username: true, dob: true, phone: true, email: true }
      }
    },
    orderBy: { user: { name: 'asc' } }
  });
}
