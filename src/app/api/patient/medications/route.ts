import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';

export async function GET() {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  try {
    await assertPermission('medications', auth.session.role);

    const profile = await prisma.patientProfile.findUnique({
      where: { userId: auth.session.userId }
    });
    if (!profile) return NextResponse.json({ prescriptions: [] });

    const prescriptions = await prisma.prescription.findMany({
      where: {
        visit: { patientId: profile.id }
      },
      include: {
        items: true,
        visit: { select: { visitDate: true } }
      },
      orderBy: { prescribedAt: 'desc' }
    });

    return NextResponse.json({ prescriptions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
