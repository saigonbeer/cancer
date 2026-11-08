import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireRole('DOCTOR', 'ADMIN');
  if ('response' in auth) return auth.response;

  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  if (q.length < 2) {
    return NextResponse.json({ regimens: [] });
  }

  const regimens = await prisma.catalogRegimen.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { alternateNames: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, primarySite: true },
    orderBy: { name: 'asc' },
    take: 15,
  });

  return NextResponse.json({ regimens });
}
