import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function getDoctorProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      dob: true,
      email: true,
      phone: true,
      username: true,
      doctorProfile: { select: { department: true } },
    },
  });
}

export async function changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) throw new Error('Không tìm thấy tài khoản.');

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw new Error('Mật khẩu hiện tại không đúng.');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
