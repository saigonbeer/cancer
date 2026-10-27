import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getDoctorPatients } from '@/services/doctor.service';

export async function GET() {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  try {
    const patients = await getDoctorPatients(auth.session.userId, auth.session.role);
    return NextResponse.json({ patients });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
