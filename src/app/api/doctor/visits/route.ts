import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { createVisit, getPatientVisits } from '@/services/visit.service';

export async function GET(req: NextRequest) {
  const auth = await requireRole('DOCTOR', 'ADMIN');
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  if (!patientId) {
    return NextResponse.json({ error: 'Thiếu patientId' }, { status: 400 });
  }

  const visits = await getPatientVisits(patientId);
  return NextResponse.json({ visits });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || !body.patientId || !body.type) {
    return NextResponse.json({ error: 'Thiếu dữ liệu lượt khám bắt buộc.' }, { status: 400 });
  }

  try {
    const visit = await createVisit(body, auth.session.role);
    return NextResponse.json({ visit }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
