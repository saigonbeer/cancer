import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';
import { createAppointment, getAppointments } from '@/services/appointment.service';

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
