import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getDoctorProfile } from '@/services/doctorProfile.service';

export async function GET() {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  const profile = await getDoctorProfile(auth.session.userId);
  return NextResponse.json({ profile });
}
