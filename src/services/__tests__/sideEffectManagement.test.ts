import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    sideEffectReport: { findUnique: vi.fn(), update: vi.fn() },
    doctorProfile: { findUnique: vi.fn() },
    permissionMatrix: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/rbac', () => ({
  assertPermission: vi.fn(),
}));

import { saveManagementSheet, setMonitorMore } from '../sideEffectManagement.service';
import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';

const mockReportFind = prisma.sideEffectReport.findUnique as ReturnType<typeof vi.fn>;
const mockReportUpdate = prisma.sideEffectReport.update as ReturnType<typeof vi.fn>;
const mockDoctorFind = prisma.doctorProfile.findUnique as ReturnType<typeof vi.fn>;
const mockAssert = assertPermission as ReturnType<typeof vi.fn>;

function mockAccess() {
  mockAssert.mockResolvedValue(undefined);
  mockReportFind.mockResolvedValue({ id: 'r1', patient: { doctorId: 'doc1' } });
  mockDoctorFind.mockResolvedValue({ id: 'doc1' });
}

beforeEach(() => vi.clearAllMocks());

describe('saveManagementSheet', () => {
  it('saves and marks RESOLVED for NO_CHANGE', async () => {
    mockAccess();
    mockReportUpdate.mockResolvedValue({ id: 'r1', status: 'RESOLVED' });

    await saveManagementSheet('r1', 'user1', 'DOCTOR', {
      regimenDecision: 'NO_CHANGE',
      managementNote: 'Theo dõi',
    });

    expect(mockReportUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'r1' },
      data: expect.objectContaining({
        status: 'RESOLVED',
        regimenDecision: 'NO_CHANGE',
        decisionReason: null,
        doseReduced: false,
      }),
    }));
  });

  it('requires decisionReason when HOLD', async () => {
    mockAccess();
    await expect(
      saveManagementSheet('r1', 'user1', 'DOCTOR', {
        regimenDecision: 'HOLD',
        decisionReason: '',
      })
    ).rejects.toThrow('Vui lòng nhập lý do');
  });

  it('requires decisionReason when REDUCE', async () => {
    mockAccess();
    await expect(
      saveManagementSheet('r1', 'user1', 'DOCTOR', {
        regimenDecision: 'REDUCE',
      })
    ).rejects.toThrow('Vui lòng nhập lý do');
  });

  it('sets doseReduced=true for REDUCE decision', async () => {
    mockAccess();
    mockReportUpdate.mockResolvedValue({ id: 'r1' });

    await saveManagementSheet('r1', 'user1', 'DOCTOR', {
      regimenDecision: 'REDUCE',
      decisionReason: 'CTCAE Độ 3',
    });

    expect(mockReportUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        doseReduced: true,
        regimenDecision: 'REDUCE',
        decisionReason: 'CTCAE Độ 3',
      }),
    }));
  });

  it('throws when report not found', async () => {
    mockAssert.mockResolvedValue(undefined);
    mockReportFind.mockResolvedValue(null);
    await expect(
      saveManagementSheet('bad-id', 'user1', 'DOCTOR', { regimenDecision: 'NO_CHANGE' })
    ).rejects.toThrow('Không tìm thấy báo cáo');
  });

  it('throws when doctor does not own the patient', async () => {
    mockAssert.mockResolvedValue(undefined);
    mockReportFind.mockResolvedValue({ id: 'r1', patient: { doctorId: 'other-doc' } });
    mockDoctorFind.mockResolvedValue({ id: 'doc1' });
    await expect(
      saveManagementSheet('r1', 'user1', 'DOCTOR', { regimenDecision: 'NO_CHANGE' })
    ).rejects.toThrow('không phụ trách');
  });
});

describe('setMonitorMore', () => {
  it('toggles monitorMore flag', async () => {
    mockAccess();
    mockReportUpdate.mockResolvedValue({ id: 'r1', monitorMore: true });

    const result = await setMonitorMore('r1', 'user1', 'DOCTOR', true);
    expect(mockReportUpdate).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { monitorMore: true },
    });
    expect(result.monitorMore).toBe(true);
  });
});
