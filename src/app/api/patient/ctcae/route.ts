import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';
import { searchCtcaeTerms } from '@/services/ctcae.service';

export async function GET(req: NextRequest) {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const soc = searchParams.get('soc') || undefined;

  if (soc) {
    const terms = await prisma.ctcaeTerm.findMany({
      where: { socVi: soc },
      orderBy: [{ order: 'asc' }, { termVi: 'asc' }],
      select: { id: true, termVi: true, socVi: true },
    });
    return NextResponse.json({ items: terms });
  }

  const q = searchParams.get('q') || undefined;
  const terms = await searchCtcaeTerms(q, 20);
  // Bệnh nhân chỉ cần tên + nhóm để chọn, không cần chi tiết phân độ lâm sàng.
  const items = terms.map((t) => ({ id: t.id, termVi: t.termVi || t.term, socVi: t.socVi || t.soc }));
  return NextResponse.json({ items });
}
