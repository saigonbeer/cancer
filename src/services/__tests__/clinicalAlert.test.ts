import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    sideEffectReport: { findMany: vi.fn() },
    clinicalAlert: { deleteMany: vi.fn(), upsert: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/rbac', () => ({
  assertPermission: vi.fn(),
}));

import {
  evaluateAlerts,
  ruleReportSpike,
  ruleSeverityEscalation,
  ruleUnhandledSevereGrade,
  syncPatientAlerts,
  decideAlert,
} from '../clinicalAlert.service';
import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';

const mockFindReports = prisma.sideEffectReport.findMany as ReturnType<typeof vi.fn>;
const mockDeleteMany = prisma.clinicalAlert.deleteMany as ReturnType<typeof vi.fn>;
const mockUpsert = prisma.clinicalAlert.upsert as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.clinicalAlert.update as ReturnType<typeof vi.fn>;
const mockAssert = assertPermission as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000);

function report(overrides: Partial<{ severity: string | null; ctcaeGrade: number | null; status: string; createdAt: Date }>) {
  return {
    severity: null,
    ctcaeGrade: null,
    status: 'PENDING',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('ruleReportSpike', () => {
  it('triggers when there are 3+ reports within 48 hours', () => {
    const reports = [report({ createdAt: hoursAgo(1) }), report({ createdAt: hoursAgo(10) }), report({ createdAt: hoursAgo(30) })];
    const result = ruleReportSpike(reports);
    expect(result?.type).toBe('REPORT_SPIKE');
    expect(result?.severity).toBe('MEDIUM');
  });

  it('does not trigger with fewer than 3 reports in window', () => {
    const reports = [report({ createdAt: hoursAgo(1) }), report({ createdAt: hoursAgo(10) })];
    expect(ruleReportSpike(reports)).toBeNull();
  });

  it('ignores reports outside the 48h window', () => {
    const reports = [report({ createdAt: hoursAgo(1) }), report({ createdAt: hoursAgo(60) }), report({ createdAt: hoursAgo(90) })];
    expect(ruleReportSpike(reports)).toBeNull();
  });
});

describe('ruleSeverityEscalation', () => {
  it('triggers when last 3 reports escalate Nhẹ -> Trung bình -> Nặng', () => {
    // mới nhất trước (desc): Nặng, Trung bình, Nhẹ
    const reports = [
      report({ severity: 'Nặng', createdAt: hoursAgo(1) }),
      report({ severity: 'Trung bình', createdAt: hoursAgo(5) }),
      report({ severity: 'Nhẹ', createdAt: hoursAgo(10) }),
    ];
    const result = ruleSeverityEscalation(reports);
    expect(result?.type).toBe('SEVERITY_ESCALATION');
    expect(result?.severity).toBe('HIGH');
  });

  it('does not trigger when severity does not strictly increase', () => {
    const reports = [
      report({ severity: 'Trung bình', createdAt: hoursAgo(1) }),
      report({ severity: 'Trung bình', createdAt: hoursAgo(5) }),
      report({ severity: 'Nhẹ', createdAt: hoursAgo(10) }),
    ];
    expect(ruleSeverityEscalation(reports)).toBeNull();
  });

  it('does not trigger with fewer than 3 reports', () => {
    const reports = [report({ severity: 'Nhẹ' }), report({ severity: 'Nặng' })];
    expect(ruleSeverityEscalation(reports)).toBeNull();
  });
});

describe('ruleUnhandledSevereGrade', () => {
  it('triggers when a grade >= 3 report is still PENDING after 24h', () => {
    const reports = [report({ ctcaeGrade: 3, status: 'PENDING', createdAt: hoursAgo(30) })];
    const result = ruleUnhandledSevereGrade(reports);
    expect(result?.type).toBe('GRADE3_UNHANDLED');
    expect(result?.severity).toBe('HIGH');
  });

  it('does not trigger when the report is already RESOLVED', () => {
    const reports = [report({ ctcaeGrade: 3, status: 'RESOLVED', createdAt: hoursAgo(30) })];
    expect(ruleUnhandledSevereGrade(reports)).toBeNull();
  });

  it('does not trigger within the first 24h', () => {
    const reports = [report({ ctcaeGrade: 3, status: 'PENDING', createdAt: hoursAgo(5) })];
    expect(ruleUnhandledSevereGrade(reports)).toBeNull();
  });

  it('does not trigger for grade < 3', () => {
    const reports = [report({ ctcaeGrade: 2, status: 'PENDING', createdAt: hoursAgo(30) })];
    expect(ruleUnhandledSevereGrade(reports)).toBeNull();
  });
});

describe('evaluateAlerts', () => {
  it('returns candidates from every matching rule', () => {
    const reports = [report({ ctcaeGrade: 3, status: 'PENDING', createdAt: hoursAgo(30) })];
    const result = evaluateAlerts(reports);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('GRADE3_UNHANDLED');
  });

  it('returns empty array when nothing matches', () => {
    const reports = [report({ severity: 'Nhẹ', createdAt: hoursAgo(1) })];
    expect(evaluateAlerts(reports)).toEqual([]);
  });
});

describe('syncPatientAlerts', () => {
  it('upserts alerts for matching rules and deletes alerts for rules no longer matching', async () => {
    mockFindReports.mockResolvedValue([report({ ctcaeGrade: 4, status: 'PENDING', createdAt: hoursAgo(48) })]);
    mockDeleteMany.mockResolvedValue({ count: 0 });
    mockUpsert.mockResolvedValue({});

    await syncPatientAlerts('p1');

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { patientId: 'p1', type: { notIn: ['GRADE3_UNHANDLED'] } },
    });
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { patientId_type: { patientId: 'p1', type: 'GRADE3_UNHANDLED' } },
    }));
  });

  it('deletes all alerts when no rule matches', async () => {
    mockFindReports.mockResolvedValue([]);
    mockDeleteMany.mockResolvedValue({ count: 0 });

    await syncPatientAlerts('p1');

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { patientId: 'p1', type: { notIn: ['__none__'] } },
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

describe('decideAlert', () => {
  it('checks permission and updates status/note', async () => {
    mockAssert.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue({ id: 'a1', status: 'CONFIRMED' });

    await decideAlert('a1', 'CONFIRMED', 'Đã trao đổi với bệnh nhân', 'DOCTOR');

    expect(mockAssert).toHaveBeenCalledWith('sideeffects', 'DOCTOR');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: expect.objectContaining({ status: 'CONFIRMED', note: 'Đã trao đổi với bệnh nhân' }),
    });
  });

  it('throws when permission denied', async () => {
    mockAssert.mockRejectedValue(new Error('Forbidden'));
    await expect(decideAlert('a1', 'DISMISSED', undefined, 'PATIENT')).rejects.toThrow('Forbidden');
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
