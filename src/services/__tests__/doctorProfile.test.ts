import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
  verifyPassword: vi.fn(),
}));

import { getDoctorProfile, changeOwnPassword } from '../doctorProfile.service';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';

const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>;
const mockVerify = verifyPassword as ReturnType<typeof vi.fn>;
const mockHash = hashPassword as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('getDoctorProfile', () => {
  it('selects own user fields including department', async () => {
    mockFindUnique.mockResolvedValue({ id: 'u1', name: 'BS. A', doctorProfile: { department: 'Xạ trị' } });
    const result = await getDoctorProfile('u1');
    expect(result?.doctorProfile?.department).toBe('Xạ trị');
    expect(mockFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' } }));
  });
});

describe('changeOwnPassword', () => {
  it('throws when user not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(changeOwnPassword('u1', 'old', 'new123')).rejects.toThrow('Không tìm thấy tài khoản.');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('throws when current password is wrong', async () => {
    mockFindUnique.mockResolvedValue({ passwordHash: 'hash1' });
    mockVerify.mockResolvedValue(false);
    await expect(changeOwnPassword('u1', 'wrong', 'new123')).rejects.toThrow('Mật khẩu hiện tại không đúng.');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('updates passwordHash when current password is correct', async () => {
    mockFindUnique.mockResolvedValue({ passwordHash: 'hash1' });
    mockVerify.mockResolvedValue(true);
    mockUpdate.mockResolvedValue({});

    await changeOwnPassword('u1', 'correct', 'newpass123');

    expect(mockHash).toHaveBeenCalledWith('newpass123');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { passwordHash: 'hashed:newpass123' },
    });
  });
});
