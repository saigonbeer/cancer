import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getAppointments, updateAppointmentStatus } from '@/services/appointment.service';

export async function GET() {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  try {
    const appointments = await getAppointments(auth.session.userId, auth.session.role);
    return NextResponse.json({ appointments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || !body.appointmentId || !body.status) {
    return NextResponse.json({ error: 'Thiếu dữ liệu trạng thái' }, { status: 400 });
  }

  try {
    const updated = await updateAppointmentStatus(body.appointmentId, body.status, auth.session.role);
    return NextResponse.json({ appointment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
