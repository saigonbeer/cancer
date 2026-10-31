import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    permissionMatrix: {
      findUnique: vi.fn(),
    },
  },
}));

import { hasPermission, assertPermission, ForbiddenError } from '../rbac';
import { prisma } from '@/lib/db';

const mockFindUnique = prisma.permissionMatrix.findUnique as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('hasPermission', () => {
  it('returns true when row exists and allowed is true', async () => {
    mockFindUnique.mockResolvedValue({ id: '1', module: 'record', role: 'DOCTOR', allowed: true });
    expect(await hasPermission('record', 'DOCTOR')).toBe(true);
  });

  it('returns false when row exists but allowed is false', async () => {
    mockFindUnique.mockResolvedValue({ id: '1', module: 'record', role: 'PATIENT', allowed: false });
    expect(await hasPermission('record', 'PATIENT')).toBe(false);
  });

  it('returns false (fail-closed) when no row exists', async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await hasPermission('unknown_module', 'DOCTOR')).toBe(false);
  });

  it('queries with correct composite key', async () => {
    mockFindUnique.mockResolvedValue(null);
    await hasPermission('medications', 'ADMIN');
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { module_role: { module: 'medications', role: 'ADMIN' } },
    });
  });
});

describe('assertPermission', () => {
  it('does not throw when permission is granted', async () => {
    mockFindUnique.mockResolvedValue({ allowed: true });
    await expect(assertPermission('record', 'DOCTOR')).resolves.toBeUndefined();
  });

  it('throws ForbiddenError when permission is denied', async () => {
    mockFindUnique.mockResolvedValue({ allowed: false });
    await expect(assertPermission('record', 'PATIENT')).rejects.toThrow(ForbiddenError);
  });

  it('throws ForbiddenError when no row exists', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(assertPermission('sideeffects', 'PATIENT')).rejects.toThrow(ForbiddenError);
  });
});
