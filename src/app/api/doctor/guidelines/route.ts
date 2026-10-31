import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireRole('DOCTOR', 'ADMIN');
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const symptom = searchParams.get('symptom');
  const grade = searchParams.get('grade');
  const modality = searchParams.get('modality');

  if (symptom) {
    const terms = await prisma.ctcaeTerm.findMany({
      where: { term: { contains: symptom, mode: 'insensitive' } },
      include: {
        guidelines: {
          where: {
            ...(grade ? { grade: parseInt(grade) } : {}),
            ...(modality ? { modality: { in: [modality, 'ALL'] } } : {}),
          },
          orderBy: [{ grade: 'asc' }, { modality: 'asc' }],
        },
      },
      take: 10,
    });
    return NextResponse.json({ terms });
  }

  const ctcaeTermId = searchParams.get('ctcaeTermId');
  if (ctcaeTermId) {
    const guidelines = await prisma.managementGuideline.findMany({
      where: {
        ctcaeTermId,
        ...(grade ? { grade: parseInt(grade) } : {}),
        ...(modality ? { modality: { in: [modality, 'ALL'] } } : {}),
      },
      include: { ctcaeTerm: { select: { term: true, soc: true, lltCode: true } } },
      orderBy: [{ grade: 'asc' }, { modality: 'asc' }],
    });
    return NextResponse.json({ guidelines });
  }

  const modalities = await prisma.managementGuideline.groupBy({
    by: ['modality'],
    _count: true,
  });
  const termCount = await prisma.managementGuideline.groupBy({
    by: ['ctcaeTermId'],
    _count: true,
  });
  return NextResponse.json({
    totalGuidelines: modalities.reduce((s, m) => s + m._count, 0),
    totalTerms: termCount.length,
    byModality: modalities,
  });
}
