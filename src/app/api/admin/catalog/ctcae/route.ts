import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';

const PAGE_SIZE = 30;

const createSchema = z.object({
  order: z.number().int().optional().nullable(),
  socVi: z.string().min(1, 'Nhóm SOC không được để trống.'),
  termVi: z.string().min(1, 'Thuật ngữ không được để trống.'),
  grade1Vi: z.string().optional().nullable(),
  grade2Vi: z.string().optional().nullable(),
  grade3Vi: z.string().optional().nullable(),
  grade4Vi: z.string().optional().nullable(),
  grade5Vi: z.string().optional().nullable(),
  definitionVi: z.string().optional().nullable(),
  navigationalNoteVi: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const auth = await requireRole('ADMIN');
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const soc = searchParams.get('soc')?.trim();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { term: { contains: q, mode: 'insensitive' } },
      { termVi: { contains: q, mode: 'insensitive' } },
      { lltCode: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (soc) {
    where.socVi = soc;
  }

  const [items, total, socList] = await Promise.all([
    prisma.ctcaeTerm.findMany({
      where,
      orderBy: [{ order: 'asc' }, { termVi: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ctcaeTerm.count({ where }),
    prisma.ctcaeTerm.findMany({ distinct: ['socVi'], select: { soc: true, socVi: true }, orderBy: { socVi: 'asc' } }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    socOptions: socList,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  const item = await prisma.ctcaeTerm.create({ data: parsed.data });
  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE() {
  const auth = await requireRole('ADMIN');
  if ('response' in auth) return auth.response;

  const result = await prisma.ctcaeTerm.deleteMany({});
  return NextResponse.json({ ok: true, deleted: result.count });
}
