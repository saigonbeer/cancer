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

    // Thống kê số bệnh nhân theo từng Loại ung thư (tính theo lượt khám lần đầu — mỗi bệnh nhân chỉ tính 1 lần theo loại ung thư đã chẩn đoán ở lượt khám đầu tiên).
    const grouped = await prisma.visit.groupBy({
      by: ['cancerTypeId'],
      where: { type: 'FIRST', cancerTypeId: { not: null } },
      _count: { _all: true }
    });
    const cancerTypeIds = grouped.map((g) => g.cancerTypeId as string);
    const cancerTypes = await prisma.catalogCancerType.findMany({
      where: { id: { in: cancerTypeIds } },
      select: { id: true, name: true, stage: true }
    });
    const stages = grouped
      .map((g) => {
        const ct = cancerTypes.find((c) => c.id === g.cancerTypeId);
        return ct ? { name: ct.name, stage: ct.stage, patientCount: g._count._all } : null;
      })
      .filter((x): x is { name: string; stage: string | null; patientCount: number } => x !== null)
      .sort((a, b) => b.patientCount - a.patientCount);

    const firstVisitsWithoutCancerType = await prisma.visit.count({
      where: { type: 'FIRST', cancerTypeId: null }
    });

    return NextResponse.json({
      stats: {
        totalPatients,
        totalVisits,
        totalPrescriptions,
        totalSideEffects,
        stages,
        firstVisitsWithoutCancerType
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
