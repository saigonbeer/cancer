import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';
import { reportSideEffect, getSideEffectReports } from '@/services/sideeffect.service';

export async function GET() {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: auth.session.userId }
  });
  if (!profile) return NextResponse.json({ reports: [] });

  const reports = await getSideEffectReports({ patientId: profile.id });
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: auth.session.userId }
  });
  if (!profile) {
    return NextResponse.json({ error: 'Không tìm thấy hồ sơ bệnh nhân' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.symptom) {
    return NextResponse.json({ error: 'Vui lòng cung cấp triệu chứng' }, { status: 400 });
  }

  try {
    const report = await reportSideEffect(
      {
        patientId: profile.id,
        symptom: body.symptom,
        severity: body.severity,
        site: body.site,
        cycle: body.cycle,
        note: body.note
      },
      auth.session.role
    );
    return NextResponse.json({ report }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
