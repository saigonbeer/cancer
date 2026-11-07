import { prisma } from '@/lib/db';
import type { Role } from '@/lib/auth';

/**
 * Chặn truy cập chéo bệnh nhân (IDOR): bác sĩ chỉ được đọc/ghi dữ liệu của
 * bệnh nhân mình đang phụ trách. ADMIN luôn được phép (toàn quyền giám sát).
 */
export async function assertOwnsPatient(patientId: string, doctorUserId: string, role: Role) {
  if (role === 'ADMIN') return;

  const doctor = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId }, select: { id: true } });
  if (!doctor) throw new Error('Không có quyền truy cập.');

  const patient = await prisma.patientProfile.findUnique({ where: { id: patientId }, select: { doctorId: true } });
  if (!patient || patient.doctorId !== doctor.id) {
    throw new Error('Bạn không phụ trách bệnh nhân này.');
  }
}

/**
 * Chặn truy cập chéo lịch hẹn: bác sĩ chỉ được thao tác trên lịch hẹn của
 * chính mình. ADMIN luôn được phép.
 */
export async function assertOwnsAppointment(appointmentId: string, doctorUserId: string, role: Role) {
  if (role === 'ADMIN') return;

  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId }, select: { doctorId: true } });
  if (!appointment) throw new Error('Không tìm thấy lịch hẹn.');
  if (appointment.doctorId !== doctorUserId) {
    throw new Error('Bạn không phụ trách lịch hẹn này.');
  }
}
