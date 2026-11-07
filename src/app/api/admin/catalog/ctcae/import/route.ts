import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';

const rowSchema = z.object({
  order: z.number().int().optional().nullable(),
  socVi: z.string().min(1),
  termVi: z.string().min(1),
  grade1Vi: z.string().optional().nullable(),
  grade2Vi: z.string().optional().nullable(),
  grade3Vi: z.string().optional().nullable(),
  grade4Vi: z.string().optional().nullable(),
  grade5Vi: z.string().optional().nullable(),
  definitionVi: z.string().optional().nullable(),
  navigationalNoteVi: z.string().optional().nullable(),
});

const importSchema = z.object({
  rows: z.array(rowSchema).min(1, 'Không có dòng dữ liệu hợp lệ nào để import.'),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dữ liệu import không hợp lệ.' }, { status: 400 });
  }

  const result = await prisma.ctcaeTerm.createMany({ data: parsed.data.rows });
  return NextResponse.json({ ok: true, imported: result.count });
}
