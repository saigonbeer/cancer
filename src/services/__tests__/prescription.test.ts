import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    catalogDrug: { findMany: vi.fn() },
    drugInteraction: { findMany: vi.fn() },
    prescription: { create: vi.fn(), findMany: vi.fn() },
    visit: { findUnique: vi.fn() },
    doctorProfile: { findUnique: vi.fn() },
    permissionMatrix: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/rbac', () => ({
  assertPermission: vi.fn(),
}));

vi.mock('@/lib/ownership', () => ({
  assertOwnsPatient: vi.fn(),
}));

import { checkDrugInteractions, createPrescription, getActiveDrugNames } from '../prescription.service';
import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import { assertOwnsPatient } from '@/lib/ownership';

const mockDrugFind = prisma.catalogDrug.findMany as ReturnType<typeof vi.fn>;
const mockInterFind = prisma.drugInteraction.findMany as ReturnType<typeof vi.fn>;
const mockCreate = prisma.prescription.create as ReturnType<typeof vi.fn>;
const mockPrescriptionFindMany = prisma.prescription.findMany as ReturnType<typeof vi.fn>;
const mockVisitFindUnique = prisma.visit.findUnique as ReturnType<typeof vi.fn>;
const mockDoctorFindUnique = prisma.doctorProfile.findUnique as ReturnType<typeof vi.fn>;
const mockAssert = assertPermission as ReturnType<typeof vi.fn>;
const mockOwns = assertOwnsPatient as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockAssert.mockResolvedValue(undefined);
  mockOwns.mockResolvedValue(undefined);
  mockVisitFindUnique.mockResolvedValue({ patientId: 'p1' });
  mockDoctorFindUnique.mockResolvedValue({ id: 'doc1' });
  mockPrescriptionFindMany.mockResolvedValue([]); // không có thuốc nào đang dùng, trừ khi test ghi đè
});

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

describe('getActiveDrugNames', () => {
  it('returns distinct drug names still within their active duration window', async () => {
    const now = Date.now();
    mockPrescriptionFindMany.mockResolvedValue([
      { prescribedAt: new Date(now - 2 * 24 * 3600 * 1000), items: [{ drugName: 'Tamoxifen', duration: '10 ngày' }] },
      { prescribedAt: new Date(now - 30 * 24 * 3600 * 1000), items: [{ drugName: 'Doxorubicin', duration: '1 ngày' }] }, // đã hết hạn dùng
      { prescribedAt: new Date(now - 1 * 24 * 3600 * 1000), items: [{ drugName: 'Tamoxifen', duration: '10 ngày' }] }, // trùng tên
    ]);

    const names = await getActiveDrugNames('p1');
    expect(names).toEqual(['Tamoxifen']);
  });
});

describe('createPrescription', () => {
  it('checks permission and patient ownership before creating', async () => {
    mockDrugFind.mockResolvedValue([]);
    mockInterFind.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: 'rx1', items: [{ drugName: 'Paracetamol' }] });

    await createPrescription('v1', [{ drugName: 'Paracetamol' }], 'DOCTOR', 'u1');
    expect(mockAssert).toHaveBeenCalledWith('medications', 'DOCTOR');
    expect(mockOwns).toHaveBeenCalledWith('p1', 'u1', 'DOCTOR');
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('throws when permission denied', async () => {
    mockAssert.mockRejectedValue(new Error('Forbidden'));
    await expect(
      createPrescription('v1', [{ drugName: 'X' }], 'PATIENT', 'u1')
    ).rejects.toThrow('Forbidden');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('throws when the doctor does not own this patient', async () => {
    mockOwns.mockRejectedValue(new Error('Bạn không phụ trách bệnh nhân này.'));
    await expect(
      createPrescription('v1', [{ drugName: 'X' }], 'DOCTOR', 'u1')
    ).rejects.toThrow('Bạn không phụ trách bệnh nhân này.');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('blocks save and returns needsAck when interactions found but not confirmed', async () => {
    mockDrugFind.mockResolvedValue([{ id: 'd1' }, { id: 'd2' }]);
    mockInterFind.mockResolvedValue([{ id: 'i1', severity: 'MEDIUM' }]);

    const result = await createPrescription('v1', [{ drugName: 'A' }, { drugName: 'B' }], 'DOCTOR', 'u1');
    expect(result.needsAck).toBe(true);
    expect(result.interactions).toHaveLength(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('checks interactions against drugs the patient is already actively taking, not just the new items', async () => {
    // Bệnh nhân đang dùng Warfarin từ đơn trước; lần này bác sĩ chỉ kê Aspirin (đơn mới, không liên quan rõ ràng).
    mockPrescriptionFindMany.mockResolvedValue([
      { prescribedAt: new Date(), items: [{ drugName: 'Warfarin', duration: '30 ngày' }] },
    ]);
    mockDrugFind.mockResolvedValue([{ id: 'd1', name: 'Warfarin' }, { id: 'd2', name: 'Aspirin' }]);
    mockInterFind.mockResolvedValue([{ id: 'i1', severity: 'HIGH' }]);

    const result = await createPrescription('v1', [{ drugName: 'Aspirin' }], 'DOCTOR', 'u1');

    expect(mockDrugFind).toHaveBeenCalledWith(expect.objectContaining({
      where: { name: { in: expect.arrayContaining(['Warfarin', 'Aspirin']) } },
    }));
    expect(result.needsAck).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates and records interaction acknowledgment when confirmed, linking the prescribing doctor', async () => {
    mockDrugFind.mockResolvedValue([{ id: 'd1' }, { id: 'd2' }]);
    mockInterFind.mockResolvedValue([{ id: 'i1', severity: 'HIGH' }]);
    mockCreate.mockResolvedValue({ id: 'rx1', items: [] });

    const result = await createPrescription(
      'v1', [{ drugName: 'A' }, { drugName: 'B' }], 'DOCTOR', 'u1',
      { confirmed: true, note: 'Đã cân nhắc lợi ích/nguy cơ' }
    );
    expect(result.needsAck).toBe(false);
    expect(result.prescription?.id).toBe('rx1');
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        prescribedById: 'doc1',
        interactionAckNote: 'Đã cân nhắc lợi ích/nguy cơ',
      }),
    }));
  });

  it('creates without acknowledgment fields when no interactions exist', async () => {
    mockDrugFind.mockResolvedValue([]);
    mockInterFind.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: 'rx2', items: [] });

    const result = await createPrescription('v1', [{ drugName: 'Paracetamol' }], 'DOCTOR', 'u1');
    expect(result.needsAck).toBe(false);
    expect(result.prescription?.id).toBe('rx2');
  });
});
