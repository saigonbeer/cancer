import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';
import { getPatientAlerts } from '@/services/clinicalAlert.service';

export async function GET() {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  const profile = await prisma.patientProfile.findUnique({ where: { userId: auth.session.userId } });
  if (!profile) return NextResponse.json({ alerts: [] });

  const alerts = await getPatientAlerts(profile.id);
  return NextResponse.json({ alerts });
}
