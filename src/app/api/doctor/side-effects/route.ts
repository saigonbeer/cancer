import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { getSideEffectReports, updateSideEffectStatus } from '@/services/sideeffect.service';
import { prisma } from '@/lib/db';
import { withPhotoUrls } from '@/lib/storage';

export async function GET() {
  const auth = await requireRole('DOCTOR', 'ADMIN');
  if ('response' in auth) return auth.response;

  const doctor = await prisma.doctorProfile.findUnique({ where: { userId: auth.session.userId } });
  const reports = await getSideEffectReports({ doctorId: doctor?.id });
  return NextResponse.json({ reports: await withPhotoUrls(reports) });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || !body.reportId || !body.status) {
    return NextResponse.json({ error: 'Thiếu thông tin cập nhật' }, { status: 400 });
  }

  try {
    const updated = await updateSideEffectStatus(
      body.reportId,
      body.status,
      body.ctcaeGrade,
      auth.session.role,
      body.doseReduced
    );
    return NextResponse.json({ report: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
