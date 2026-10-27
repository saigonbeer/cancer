import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getDoctorPatients } from '@/services/doctor.service';

export async function GET() {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  try {
    const patients = await getDoctorPatients(auth.session.userId, auth.session.role);
    return NextResponse.json({ patients });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ và tên.'),
  dob: z.string().trim().optional(),
  email: z.string().trim().email('Email không hợp lệ.').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  username: z.string().trim().min(3, 'Username tối thiểu 3 ký tự.'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự.'),
  address: z.string().trim().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole('DOCTOR');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }
  const d = parsed.data;

  const doctor = await prisma.doctorProfile.findUnique({ where: { userId: auth.session.userId }, select: { id: true } });
  if (!doctor) {
    return NextResponse.json({ error: 'Tài khoản chưa có hồ sơ bác sĩ.' }, { status: 403 });
  }

  const exists = await prisma.user.findUnique({ where: { username: d.username }, select: { id: true } });
  if (exists) {
    return NextResponse.json({ error: 'Username đã tồn tại.' }, { status: 409 });
  }

  const patientCode = `BN-${Date.now().toString(36).toUpperCase()}`;
  const user = await prisma.user.create({
    data: {
      name: d.name,
      dob: d.dob || null,
      email: d.email || null,
      phone: d.phone || null,
      username: d.username,
      passwordHash: await hashPassword(d.password),
      role: 'PATIENT',
      patientProfile: {
        create: {
          patientCode,
          address: d.address || null,
          emergencyContactName: d.emergencyContactName || null,
          emergencyContactPhone: d.emergencyContactPhone || null,
          doctorId: doctor.id,
        },
      },
    },
    select: { id: true, name: true, username: true },
  });

  return NextResponse.json({ patient: { ...user, patientCode } }, { status: 201 });
}
