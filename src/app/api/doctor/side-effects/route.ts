import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/requireRole';
import { getSideEffectReports, updateSideEffectStatus } from '@/services/sideeffect.service';
import { prisma } from '@/lib/db';
import { withPhotoUrls } from '@/lib/storage';
import { REGIMEN_DECISIONS, saveManagementSheet, setMonitorMore } from '@/services/sideEffectManagement.service';

const sheetSchema = z.object({
  managementNote: z.string().max(2000).optional().nullable(),
  outcome: z.string().max(2000).optional().nullable(),
  regimenDecision: z.enum(REGIMEN_DECISIONS),
  decisionReason: z.string().max(500).optional().nullable(),
});

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
  if (!body || !body.reportId) {
    return NextResponse.json({ error: 'Thiếu thông tin cập nhật' }, { status: 400 });
  }

  try {
    if (typeof body.monitorMore === 'boolean') {
      const updated = await setMonitorMore(body.reportId, auth.session.userId, auth.session.role, body.monitorMore);
      return NextResponse.json({ report: updated });
    }

    if (body.sheet) {
      const parsed = sheetSchema.safeParse(body.sheet);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Dữ liệu phiếu xử trí không hợp lệ' }, { status: 400 });
      }
      const updated = await saveManagementSheet(body.reportId, auth.session.userId, auth.session.role, parsed.data);
      return NextResponse.json({ report: updated });
    }

    if (!body.status) {
      return NextResponse.json({ error: 'Thiếu thông tin cập nhật' }, { status: 400 });
    }
    const updated = await updateSideEffectStatus(body.reportId, body.status, body.ctcaeGrade, auth.session.role, body.doseReduced);
    return NextResponse.json({ report: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
