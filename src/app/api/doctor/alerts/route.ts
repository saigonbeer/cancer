import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';
import { getActiveAlertsForDoctor, decideAlert } from '@/services/clinicalAlert.service';

const patchSchema = z.object({
  alertId: z.string().min(1),
  status: z.enum(['CONFIRMED', 'DISMISSED']),
  note: z.string().max(1000).optional(),
});

export async function GET() {
  const auth = await requireRole('DOCTOR', 'ADMIN');
  if ('response' in auth) return auth.response;

  const doctor = await prisma.doctorProfile.findUnique({ where: { userId: auth.session.userId } });
  if (!doctor) return NextResponse.json({ alerts: [] });

  const alerts = await getActiveAlertsForDoctor(doctor.id);
  return NextResponse.json({ alerts });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  try {
    const alert = await decideAlert(parsed.data.alertId, parsed.data.status, parsed.data.note, auth.session.role);
    return NextResponse.json({ alert });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
