import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';
import { createAppointment, getAppointments, updateAppointmentStatus } from '@/services/appointment.service';

export async function GET() {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  try {
    const appointments = await getAppointments(auth.session.userId, auth.session.role);
    return NextResponse.json({ appointments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || !body.type || !body.datetime) {
    return NextResponse.json({ error: 'Vui lòng chọn loại khám và ngày giờ.' }, { status: 400 });
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: auth.session.userId },
    include: { doctor: { select: { userId: true } } }
  });

  const doctorUserId = profile?.doctor?.userId;
  if (!doctorUserId) {
    return NextResponse.json({ error: 'Chưa có bác sĩ điều trị được chỉ định.' }, { status: 400 });
  }

  try {
    const appointment = await createAppointment(
      {
        patientId: auth.session.userId,
        doctorId: doctorUserId,
        type: body.type,
        datetime: new Date(body.datetime),
        reason: body.reason
      },
      auth.session.role
    );
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

const cancelSchema = z.object({ appointmentId: z.string().min(1) });

export async function DELETE(req: NextRequest) {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Thiếu mã lịch hẹn.' }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({ where: { id: parsed.data.appointmentId } });
  if (!appointment || appointment.patientId !== auth.session.userId) {
    return NextResponse.json({ error: 'Không tìm thấy lịch hẹn.' }, { status: 404 });
  }
  if (appointment.status !== 'PENDING' && appointment.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Lịch hẹn này không thể hủy.' }, { status: 400 });
  }
  if (appointment.datetime && appointment.datetime.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Không thể hủy lịch hẹn đã qua.' }, { status: 400 });
  }

  const updated = await updateAppointmentStatus(parsed.data.appointmentId, 'CANCELLED', auth.session.role, auth.session.userId);
  return NextResponse.json({ ok: true, appointment: updated });
}
