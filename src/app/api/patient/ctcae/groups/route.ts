import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';

export async function GET() {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  const groups = await prisma.ctcaeTerm.findMany({
    where: { socVi: { not: null } },
    distinct: ['socVi'],
    select: { socVi: true },
    orderBy: { socVi: 'asc' },
  });
  return NextResponse.json({ groups: groups.map((g) => g.socVi).filter(Boolean) });
}
