import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getPatientNotificationSummary } from '@/services/notificationSummary.service';

export async function GET() {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  const summary = await getPatientNotificationSummary(auth.session.userId);
  return NextResponse.json(summary);
}
