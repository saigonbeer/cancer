import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { searchCtcaeTerms } from '@/services/ctcae.service';

export async function GET(req: NextRequest) {
  const auth = await requireRole('DOCTOR', 'ADMIN');
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || undefined;
  const terms = await searchCtcaeTerms(q, 30);
  return NextResponse.json({ terms });
}
