import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    catalogDrug: { findMany: vi.fn() },
    drugInteraction: { findMany: vi.fn() },
    prescription: { create: vi.fn() },
    permissionMatrix: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/rbac', () => ({
  assertPermission: vi.fn(),
}));

import { checkDrugInteractions, createPrescription } from '../prescription.service';
import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';

const mockDrugFind = prisma.catalogDrug.findMany as ReturnType<typeof vi.fn>;
const mockInterFind = prisma.drugInteraction.findMany as ReturnType<typeof vi.fn>;
const mockCreate = prisma.prescription.create as ReturnType<typeof vi.fn>;
const mockAssert = assertPermission as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('checkDrugInteractions', () => {
  it('returns empty array when fewer than 2 drugs', async () => {
    expect(await checkDrugInteractions(['Aspirin'])).toEqual([]);
    expect(await checkDrugInteractions([])).toEqual([]);
    expect(mockDrugFind).not.toHaveBeenCalled();
  });

  it('queries interactions between found drug IDs', async () => {
    mockDrugFind.mockResolvedValue([
      { id: 'd1', name: 'Aspirin' },
      { id: 'd2', name: 'Warfarin' },
    ]);
    mockInterFind.mockResolvedValue([
      { id: 'i1', drugAId: 'd1', drugBId: 'd2', severity: 'HIGH', description: 'Tăng nguy cơ chảy máu', drugA: { name: 'Aspirin' }, drugB: { name: 'Warfarin' } },
    ]);

    const result = await checkDrugInteractions(['Aspirin', 'Warfarin']);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('HIGH');
    expect(mockInterFind).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ drugAId: { in: ['d1', 'd2'] }, drugBId: { in: ['d1', 'd2'] } }] },
    }));
  });

  it('returns empty when no drugs match catalog', async () => {
    mockDrugFind.mockResolvedValue([]);
    mockInterFind.mockResolvedValue([]);
    const result = await checkDrugInteractions(['FakeDrug1', 'FakeDrug2']);
    expect(result).toEqual([]);
  });
});

describe('createPrescription', () => {
  it('checks permission before creating', async () => {
    mockAssert.mockResolvedValue(undefined);
    mockDrugFind.mockResolvedValue([]);
    mockInterFind.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: 'rx1', items: [{ drugName: 'Paracetamol' }] });

    await createPrescription('v1', 'BS. Lê', [{ drugName: 'Paracetamol' }], 'DOCTOR');
    expect(mockAssert).toHaveBeenCalledWith('medications', 'DOCTOR');
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('throws when permission denied', async () => {
    mockAssert.mockRejectedValue(new Error('Forbidden'));
    await expect(
      createPrescription('v1', 'BS.', [{ drugName: 'X' }], 'PATIENT')
    ).rejects.toThrow('Forbidden');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns interactions alongside prescription', async () => {
    mockAssert.mockResolvedValue(undefined);
    mockDrugFind.mockResolvedValue([{ id: 'd1' }, { id: 'd2' }]);
    mockInterFind.mockResolvedValue([{ id: 'i1', severity: 'MEDIUM' }]);
    mockCreate.mockResolvedValue({ id: 'rx1', items: [] });

    const result = await createPrescription('v1', 'BS.', [{ drugName: 'A' }, { drugName: 'B' }], 'DOCTOR');
    expect(result.interactions).toHaveLength(1);
    expect(result.prescription.id).toBe('rx1');
  });
});
