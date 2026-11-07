import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';

const schema = z.object({
  order: z.number().int().optional().nullable(),
  termVi: z.string().min(1).optional(),
  socVi: z.string().min(1).optional(),
  grade1Vi: z.string().optional().nullable(),
  grade2Vi: z.string().optional().nullable(),
  grade3Vi: z.string().optional().nullable(),
  grade4Vi: z.string().optional().nullable(),
  grade5Vi: z.string().optional().nullable(),
  definitionVi: z.string().optional().nullable(),
  navigationalNoteVi: z.string().optional().nullable(),
  changeNoteVi: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN');
  if ('response' in auth) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  try {
    const item = await prisma.ctcaeTerm.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy mục CTCAE.' }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN');
  if ('response' in auth) return auth.response;

  const { id } = await params;
  try {
    await prisma.ctcaeTerm.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy mục CTCAE.' }, { status: 404 });
  }
}
