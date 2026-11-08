import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { assertOwnsPatient } from '@/lib/ownership';
import { getPatientAdherenceSummary } from '@/services/patientMedication.service';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('DOCTOR', 'ADMIN');
  if ('response' in auth) return auth.response;

  const { id } = await params;
  try {
    await assertOwnsPatient(id, auth.session.userId, auth.session.role);
    const summary = await getPatientAdherenceSummary(id);
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
