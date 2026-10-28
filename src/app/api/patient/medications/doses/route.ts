import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/requireRole';
import { assertPermission } from '@/lib/rbac';
import { recordDose } from '@/services/patientMedication.service';

const doseSchema = z.object({
  itemId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  status: z.enum(['TAKEN', 'MISSED']),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  const parsed = doseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu ghi nhận liều không hợp lệ.' }, { status: 400 });
  }

  try {
    await assertPermission('medications', auth.session.role);
    const { itemId, scheduledAt, status } = parsed.data;
    const dose = await recordDose(auth.session.userId, itemId, new Date(scheduledAt), status);
    return NextResponse.json({ dose }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
