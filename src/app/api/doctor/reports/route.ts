import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';

export async function GET() {
  const auth = await requireRole('DOCTOR', 'ADMIN');
  if ('response' in auth) return auth.response;

  try {
    await assertPermission('reports', auth.session.role);

    const totalPatients = await prisma.patientProfile.count();
    const totalVisits = await prisma.visit.count();
    const totalPrescriptions = await prisma.prescription.count();
    const totalSideEffects = await prisma.sideEffectReport.count();

    const stageStats = await prisma.catalogCancerType.findMany({
      select: { name: true, stage: true }
    });

    return NextResponse.json({
      stats: {
        totalPatients,
        totalVisits,
        totalPrescriptions,
        totalSideEffects,
        stages: stageStats
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
