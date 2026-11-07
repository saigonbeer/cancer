import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { createPrescription, getPrescriptionsByPatient, getPrescriptionsByDoctor, checkDrugInteractions } from '@/services/prescription.service';

export async function GET(req: NextRequest) {
  const auth = await requireRole('DOCTOR', 'ADMIN');
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');

  try {
    if (!patientId) {
      const prescriptions = await getPrescriptionsByDoctor(auth.session.userId);
      return NextResponse.json({ prescriptions });
    }

    const prescriptions = await getPrescriptionsByPatient(patientId, auth.session.userId, auth.session.role);
    return NextResponse.json({ prescriptions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || !body.visitId || !body.items) {
    return NextResponse.json({ error: 'Thiếu dữ liệu đơn thuốc.' }, { status: 400 });
  }

  try {
    const ack = body.ackInteractions ? { confirmed: true, note: typeof body.ackNote === 'string' ? body.ackNote : undefined } : undefined;
    const result = await createPrescription(
      body.visitId,
      body.items,
      auth.session.role,
      auth.session.userId,
      ack
    );
    return NextResponse.json(result, { status: result.needsAck ? 200 : 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
