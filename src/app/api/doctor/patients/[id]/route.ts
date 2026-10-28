import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

const updateSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ và tên.').optional(),
  dob: z.string().trim().optional(),
  email: z.string().trim().email('Email không hợp lệ.').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  username: z.string().trim().min(3, 'Username tối thiểu 3 ký tự.').optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự.').optional().or(z.literal('')),
  address: z.string().trim().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
});

async function ownPatient(patientId: string, doctorUserId: string) {
  const doctor = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId }, select: { id: true } });
  if (!doctor) return null;
  return prisma.patientProfile.findFirst({ where: { id: patientId, doctorId: doctor.id }, select: { id: true, userId: true } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;
  const { id } = await params;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }
  const patient = await ownPatient(id, auth.session.userId);
  if (!patient) return NextResponse.json({ error: 'Không tìm thấy bệnh nhân.' }, { status: 404 });

  const d = parsed.data;
  if (d.username !== undefined) {
    const taken = await prisma.user.findFirst({ where: { username: d.username, NOT: { id: patient.userId } }, select: { id: true } });
    if (taken) return NextResponse.json({ error: 'Username đã tồn tại.' }, { status: 409 });
  }
  await prisma.user.update({
    where: { id: patient.userId },
    data: {
      ...(d.username !== undefined && { username: d.username }),
      ...(d.password && { passwordHash: await hashPassword(d.password) }),
      ...(d.name !== undefined && { name: d.name }),
      ...(d.dob !== undefined && { dob: d.dob || null }),
      ...(d.email !== undefined && { email: d.email || null }),
      ...(d.phone !== undefined && { phone: d.phone || null }),
    },
  });
  await prisma.patientProfile.update({
    where: { id: patient.id },
    data: {
      ...(d.gender !== undefined && { gender: d.gender || null }),
      ...(d.address !== undefined && { address: d.address || null }),
      ...(d.emergencyContactName !== undefined && { emergencyContactName: d.emergencyContactName || null }),
      ...(d.emergencyContactPhone !== undefined && { emergencyContactPhone: d.emergencyContactPhone || null }),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;
  const { id } = await params;

  const patient = await ownPatient(id, auth.session.userId);
  if (!patient) return NextResponse.json({ error: 'Không tìm thấy bệnh nhân.' }, { status: 404 });

  await prisma.user.delete({ where: { id: patient.userId } });
  return NextResponse.json({ ok: true });
}
