import { prisma } from '@/lib/db';
import { getUnreadMessageCount } from './message.service';

/**
 * Số liệu tóm tắt để hiện badge trên sidebar. Đọc trực tiếp các bản ghi PENDING
 * đã có (không gọi lại syncPatientAlerts) để tránh N+1 mỗi lần tải trang —
 * số liệu có thể hơi trễ vài phút so với lần đồng bộ gần nhất, chấp nhận được cho mục đích hiển thị badge.
 */
export async function getDoctorNotificationSummary(doctorUserId: string) {
  const doctor = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId }, select: { id: true } });
  if (!doctor) return { unreadMessages: 0, pendingAlerts: 0, pendingAppointments: 0 };

  const [unreadMessages, pendingAlerts, pendingAppointments] = await Promise.all([
    getUnreadMessageCount(doctorUserId),
    prisma.clinicalAlert.count({ where: { status: 'PENDING', patient: { doctorId: doctor.id } } }),
    prisma.appointment.count({ where: { doctorId: doctorUserId, status: 'PENDING' } }),
  ]);

  return { unreadMessages, pendingAlerts, pendingAppointments };
}

export async function getPatientNotificationSummary(patientUserId: string) {
  const patient = await prisma.patientProfile.findUnique({ where: { userId: patientUserId }, select: { id: true } });
  if (!patient) return { unreadMessages: 0, activeAlerts: 0 };

  const [unreadMessages, activeAlerts] = await Promise.all([
    getUnreadMessageCount(patientUserId),
    prisma.clinicalAlert.count({ where: { status: 'PENDING', patientId: patient.id } }),
  ]);

  return { unreadMessages, activeAlerts };
}
