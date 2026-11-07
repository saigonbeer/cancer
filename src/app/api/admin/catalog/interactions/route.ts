import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireModule } from '@/lib/requireRole';
import { listDrugInteractions, createDrugInteraction } from '@/services/drugInteraction.service';

export async function GET(req: NextRequest) {
  const auth = await requireModule('catalog', 'ADMIN');
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || undefined;
  const page = Number(searchParams.get('page')) || 1;

  const result = await listDrugInteractions({ q, page });
  return NextResponse.json(result);
}

const createSchema = z.object({
  drugAId: z.string().min(1),
  drugBId: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  description: z.string().trim().min(1, 'Vui lòng nhập mô tả tương tác.'),
});

export async function POST(req: NextRequest) {
  const auth = await requireModule('catalog', 'ADMIN');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  try {
    const item = await createDrugInteraction(parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
