import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';

export async function GET() {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  try {
    await assertPermission('record', auth.session.role);

    const profile = await prisma.patientProfile.findUnique({
      where: { userId: auth.session.userId },
      include: {
        user: { select: { id: true, name: true, dob: true, phone: true, email: true } },
        doctor: {
          include: {
            user: { select: { name: true, phone: true } }
          }
        },
        visits: {
          include: {
            treatmentPlans: true,
            prescriptions: { include: { items: true } }
          },
          orderBy: { visitDate: 'desc' }
        }
      }
    });

    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
