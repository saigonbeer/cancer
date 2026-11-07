import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    drugInteraction: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { listDrugInteractions, createDrugInteraction, updateDrugInteraction, deleteDrugInteraction } from '../drugInteraction.service';
import { prisma } from '@/lib/db';

const mockFindMany = prisma.drugInteraction.findMany as ReturnType<typeof vi.fn>;
const mockCount = prisma.drugInteraction.count as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.drugInteraction.findUnique as ReturnType<typeof vi.fn>;
const mockCreate = prisma.drugInteraction.create as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.drugInteraction.update as ReturnType<typeof vi.fn>;
const mockDelete = prisma.drugInteraction.delete as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('listDrugInteractions', () => {
  it('paginates and filters by drug name on either side', async () => {
    mockFindMany.mockResolvedValue([{ id: 'i1' }]);
    mockCount.mockResolvedValue(1);

    const result = await listDrugInteractions({ q: 'Warfarin', page: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { drugA: { name: { contains: 'Warfarin', mode: 'insensitive' } } },
          { drugB: { name: { contains: 'Warfarin', mode: 'insensitive' } } },
        ],
      },
      take: 25,
      skip: 0,
    }));
  });

  it('defaults to page 1 and no filter when not provided', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
    await listDrugInteractions({});
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: {}, skip: 0 }));
  });
});

describe('createDrugInteraction', () => {
  it('rejects a drug paired with itself', async () => {
    await expect(createDrugInteraction({ drugAId: 'd1', drugBId: 'd1', severity: 'HIGH', description: 'x' }))
      .rejects.toThrow('Không thể tạo tương tác của một thuốc với chính nó.');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects a duplicate pair regardless of A/B order', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing' });
    await expect(createDrugInteraction({ drugAId: 'd2', drugBId: 'd1', severity: 'HIGH', description: 'x' }))
      .rejects.toThrow('đã có tương tác được ghi nhận');
    // id được sắp xếp lại (d1, d2) trước khi tra trùng, bất kể thứ tự truyền vào
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { drugAId_drugBId: { drugAId: 'd1', drugBId: 'd2' } } });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates with normalized drug id order when the pair is new', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'i1' });

    await createDrugInteraction({ drugAId: 'd2', drugBId: 'd1', severity: 'MEDIUM', description: 'Tăng nguy cơ' });

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: { drugAId: 'd1', drugBId: 'd2', severity: 'MEDIUM', description: 'Tăng nguy cơ' },
    }));
  });
});

describe('updateDrugInteraction / deleteDrugInteraction', () => {
  it('updates only the provided fields', async () => {
    mockUpdate.mockResolvedValue({ id: 'i1', severity: 'HIGH' });
    await updateDrugInteraction('i1', { severity: 'HIGH' });
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'i1' }, data: { severity: 'HIGH' } }));
  });

  it('deletes by id', async () => {
    mockDelete.mockResolvedValue({ id: 'i1' });
    await deleteDrugInteraction('i1');
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'i1' } });
  });
});
