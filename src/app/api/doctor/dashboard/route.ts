import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getDoctorDashboardStats } from '@/services/doctor.service';

export async function GET() {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  const stats = await getDoctorDashboardStats(auth.session.userId);
  return NextResponse.json({ stats });
}
