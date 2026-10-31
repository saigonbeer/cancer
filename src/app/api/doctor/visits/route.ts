import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { createVisit, getPatientVisits } from '@/services/visit.service';
import { createAppointment } from '@/services/appointment.service';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireRole('DOCTOR', 'ADMIN');
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  if (!patientId) {
    return NextResponse.json({ error: 'Thiếu patientId' }, { status: 400 });
  }

  const visits = await getPatientVisits(patientId);
  return NextResponse.json({ visits });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || !body.patientId || !body.type) {
    return NextResponse.json({ error: 'Thiếu dữ liệu lượt khám bắt buộc.' }, { status: 400 });
  }

  try {
    const { appointment, ...visitData } = body;
    const docProfile = await prisma.doctorProfile.findUnique({ where: { userId: auth.session.userId }, select: { id: true } });
    const visit = await createVisit({ ...visitData, doctorId: docProfile?.id }, auth.session.role);

    // Đặt lịch tái khám: lịch được tạo cho cả bác sĩ và bệnh nhân (bệnh nhân xem ở mục Lịch hẹn).
    let scheduled = null;
    if (appointment?.datetime) {
      const when = new Date(appointment.datetime);
      if (Number.isNaN(when.getTime())) {
        return NextResponse.json({ error: 'Thời gian tái khám không hợp lệ.' }, { status: 400 });
      }
      const patient = await prisma.patientProfile.findUnique({ where: { id: body.patientId }, select: { userId: true } });
      if (patient) {
        scheduled = await createAppointment(
          {
            patientId: patient.userId,
            doctorId: auth.session.userId,
            type: 'Tái khám',
            datetime: when,
            location: typeof appointment.location === 'string' ? appointment.location.trim() : undefined,
            reason: 'Tái khám theo kế hoạch điều trị',
          },
          auth.session.role
        );
      }
    }
    return NextResponse.json({ visit, appointment: scheduled }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
