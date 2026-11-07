import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireModule } from '@/lib/requireRole';
import { updateDrugInteraction, deleteDrugInteraction } from '@/services/drugInteraction.service';

const updateSchema = z.object({
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  description: z.string().trim().min(1).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireModule('catalog', 'ADMIN');
  if ('response' in auth) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  try {
    const item = await updateDrugInteraction(id, parsed.data);
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy mục.' }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireModule('catalog', 'ADMIN');
  if ('response' in auth) return auth.response;

  const { id } = await params;
  try {
    await deleteDrugInteraction(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy mục.' }, { status: 404 });
  }
}
