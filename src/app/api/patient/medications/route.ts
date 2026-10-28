import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { assertPermission } from '@/lib/rbac';
import { getPatientMedicationView } from '@/services/patientMedication.service';

export async function GET() {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  try {
    await assertPermission('medications', auth.session.role);
    const view = await getPatientMedicationView(auth.session.userId);
    return NextResponse.json(view);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
