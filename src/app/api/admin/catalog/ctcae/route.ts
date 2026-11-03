import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';

const PAGE_SIZE = 30;

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
    where.soc = soc;
  }

  const [items, total, socList] = await Promise.all([
    prisma.ctcaeTerm.findMany({
      where,
      orderBy: { termVi: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ctcaeTerm.count({ where }),
    prisma.ctcaeTerm.findMany({ distinct: ['soc'], select: { soc: true, socVi: true }, orderBy: { soc: 'asc' } }),
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
