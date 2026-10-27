import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { createPrescription, getPrescriptionsByPatient, checkDrugInteractions } from '@/services/prescription.service';

export async function GET(req: NextRequest) {
  const auth = await requireRole('DOCTOR', 'ADMIN');
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  if (!patientId) {
    return NextResponse.json({ error: 'Thiếu patientId' }, { status: 400 });
  }

  const prescriptions = await getPrescriptionsByPatient(patientId);
  return NextResponse.json({ prescriptions });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || !body.visitId || !body.items) {
    return NextResponse.json({ error: 'Thiếu dữ liệu đơn thuốc.' }, { status: 400 });
  }

  try {
    const result = await createPrescription(
      body.visitId,
      auth.session.name || 'Bác sĩ điều trị',
      body.items,
      auth.session.role
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
