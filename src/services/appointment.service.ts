import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import { assertOwnsAppointment } from '@/lib/ownership';
import type { Role } from '@/lib/auth';
import type { AppointmentStatus } from '@prisma/client';

export async function createAppointment(
  data: {
    patientId: string;
    doctorId: string;
    type: string;
    datetime: Date;
    location?: string;
    reason?: string;
  },
  role: Role
) {
  await assertPermission('appointments', role);

  return prisma.appointment.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      type: data.type,
      datetime: data.datetime,
      location: data.location || 'Phòng ..., Khoa Xạ trị & Xạ phẫu/Tầng Hầm B2',
      reason: data.reason,
      status: 'PENDING'
    },
    include: {
      patient: { select: { name: true, phone: true } },
      doctor: { select: { name: true } }
    }
  });
}

export async function getAppointments(userId: string, role: Role) {
  await assertPermission('appointments', role);

  if (role === 'DOCTOR') {
    return prisma.appointment.findMany({
      where: { doctorId: userId },
      include: {
        patient: { select: { id: true, name: true, phone: true, dob: true } }
      },
      orderBy: { datetime: 'asc' }
    });
  }

  if (role === 'PATIENT') {
    return prisma.appointment.findMany({
      where: { patientId: userId },
      include: {
        doctor: { select: { id: true, name: true } }
      },
      orderBy: { datetime: 'asc' }
    });
  }

  return prisma.appointment.findMany({
    include: {
      patient: { select: { name: true } },
      doctor: { select: { name: true } }
    },
    orderBy: { datetime: 'desc' }
  });
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  role: Role,
  userId: string
) {
  await assertPermission('appointments', role);

  if (role === 'DOCTOR') {
    await assertOwnsAppointment(appointmentId, userId, role);
  } else if (role === 'PATIENT') {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId }, select: { patientId: true } });
    if (!appointment || appointment.patientId !== userId) {
      throw new Error('Bạn không có quyền với lịch hẹn này.');
    }
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status }
  });
}
