import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getDoctorNotificationSummary } from '@/services/notificationSummary.service';

export async function GET() {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  const summary = await getDoctorNotificationSummary(auth.session.userId);
  return NextResponse.json(summary);
}
