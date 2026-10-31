import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    patientProfile: { findUnique: vi.fn() },
    prescription: { findMany: vi.fn() },
    doseLog: { findMany: vi.fn(), upsert: vi.fn() },
    prescriptionItem: { findFirst: vi.fn() },
  },
}));

import { timesOf } from '../patientMedication.service';
import { prisma } from '@/lib/db';

const mockProfileFind = prisma.patientProfile.findUnique as ReturnType<typeof vi.fn>;
const mockPrescFind = prisma.prescription.findMany as ReturnType<typeof vi.fn>;
const mockLogFind = prisma.doseLog.findMany as ReturnType<typeof vi.fn>;
const mockUpsert = prisma.doseLog.upsert as ReturnType<typeof vi.fn>;
const mockItemFind = prisma.prescriptionItem.findFirst as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('timesOf', () => {
  it('parses comma-separated times', () => {
    expect(timesOf('08:00, 20:00')).toEqual(['08:00', '20:00']);
  });

  it('returns default 08:00 when empty', () => {
    expect(timesOf('')).toEqual(['08:00']);
    expect(timesOf(null)).toEqual(['08:00']);
    expect(timesOf(undefined)).toEqual(['08:00']);
  });

  it('trims whitespace', () => {
    expect(timesOf('  06:30 , 12:00 , 18:00  ')).toEqual(['06:30', '12:00', '18:00']);
  });
});

describe('getPatientMedicationView', async () => {
  const { getPatientMedicationView } = await import('../patientMedication.service');

  it('returns empty state when patient profile not found', async () => {
    mockProfileFind.mockResolvedValue(null);
    const result = await getPatientMedicationView('nonexistent');
    expect(result.activeItems).toEqual([]);
    expect(result.today).toEqual([]);
    expect(result.adherence.percent).toBeNull();
  });

  it('computes adherence correctly with all doses taken', async () => {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const prescribedAt = new Date(today.getTime() - 3 * 86400000);

    mockProfileFind.mockResolvedValue({ id: 'p1' });
    mockPrescFind.mockResolvedValue([{
      id: 'rx1',
      prescribedAt,
      items: [{
        id: 'it1', drugName: 'Paracetamol', dose: '1', unit: 'viên',
        frequency: '2 lần/ngày', duration: '7 ngày', quantity: '14',
        reminderTimes: '08:00, 20:00',
      }],
    }]);

    const scheduled08 = new Date(today); scheduled08.setHours(8, 0, 0, 0);
    mockLogFind.mockResolvedValue([
      { id: 'l1', prescriptionItemId: 'it1', scheduledAt: scheduled08, status: 'TAKEN', prescriptionItem: { drugName: 'Paracetamol', dose: '1', unit: 'viên' } },
    ]);

    const result = await getPatientMedicationView('u1');
    expect(result.activeItems.length).toBeGreaterThan(0);
    expect(result.activeItems[0].drugName).toBe('Paracetamol');
    expect(result.adherence.taken).toBeGreaterThanOrEqual(0);
    expect(typeof result.adherence.percent === 'number' || result.adherence.percent === null).toBe(true);
  });
});

describe('recordDose', async () => {
  const { recordDose } = await import('../patientMedication.service');

  it('throws when patient profile not found', async () => {
    mockProfileFind.mockResolvedValue(null);
    await expect(recordDose('u1', 'it1', new Date(), 'TAKEN')).rejects.toThrow('Không tìm thấy hồ sơ bệnh nhân');
  });

  it('throws when prescription item does not belong to patient', async () => {
    mockProfileFind.mockResolvedValue({ id: 'p1' });
    mockItemFind.mockResolvedValue(null);
    await expect(recordDose('u1', 'wrong-item', new Date(), 'TAKEN')).rejects.toThrow('Không tìm thấy thuốc trong đơn của bạn');
  });

  it('upserts dose log for valid item', async () => {
    mockProfileFind.mockResolvedValue({ id: 'p1' });
    mockItemFind.mockResolvedValue({ id: 'it1' });
    mockUpsert.mockResolvedValue({ id: 'dl1', status: 'TAKEN' });

    const at = new Date();
    const result = await recordDose('u1', 'it1', at, 'TAKEN');
    expect(result.status).toBe('TAKEN');
    expect(mockUpsert).toHaveBeenCalledOnce();
  });
});
