import { prisma } from '@/lib/db';

const DAY_MS = 24 * 60 * 60 * 1000;
export type DoseStatusValue = 'TAKEN' | 'MISSED';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function activeDays(duration?: string | null): number | null {
  const m = (duration || '').match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

/** Số đầu tiên trong chuỗi, ví dụ "2 viên" → 2, "20 viên" → 20. */
function leadingNumber(value?: string | null): number | null {
  const m = (value || '').match(/(\d+(?:[.,]\d+)?)/);
  return m ? Number(m[1].replace(',', '.')) : null;
}

export function timesOf(reminderTimes?: string | null) {
  const list = (reminderTimes || '').split(',').map((t) => t.trim()).filter(Boolean);
  return list.length > 0 ? list : ['08:00'];
}

function isActiveOn(prescribedAt: Date, duration: string | null | undefined, day: Date) {
  const start = startOfDay(prescribedAt);
  if (day < start) return false;
  const days = activeDays(duration);
  if (days === null) return true;
  return day.getTime() < start.getTime() + days * DAY_MS;
}

function atTime(day: Date, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(day);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

async function patientProfileId(userId: string) {
  const profile = await prisma.patientProfile.findUnique({ where: { userId }, select: { id: true } });
  return profile?.id ?? null;
}

/** Tổng hợp dữ liệu cho trang thuốc của bệnh nhân: đơn hiện hành, liều hôm nay, tuân thủ và lịch sử. */
export async function getPatientMedicationView(userId: string) {
  const patientId = await patientProfileId(userId);
  if (!patientId) {
    return { activeItems: [], today: [], adherence: { taken: 0, expected: 0, percent: null }, history: [] };
  }

  const now = new Date();
  const today = startOfDay(now);
  const weekStart = new Date(today.getTime() - 6 * DAY_MS);

  const [prescriptions, logs] = await Promise.all([
    prisma.prescription.findMany({
      where: { visit: { patientId } },
      include: { items: true },
      orderBy: { prescribedAt: 'desc' },
    }),
    prisma.doseLog.findMany({
      where: { patientId },
      include: { prescriptionItem: { select: { drugName: true, dose: true, unit: true } } },
      orderBy: { scheduledAt: 'desc' },
      take: 1000,
    }),
  ]);

  const logKey = (itemId: string, at: Date) => `${itemId}|${at.toISOString()}`;
  const logByKey = new Map(logs.map((l) => [logKey(l.prescriptionItemId, l.scheduledAt), l.status as DoseStatusValue]));

  // Đơn hiện hành: các thuốc đang trong thời gian dùng hôm nay.
  const activeItems = prescriptions.flatMap((pr) =>
    pr.items
      .filter((it) => isActiveOn(pr.prescribedAt, it.duration, today))
      .map((it) => {
        const takenLogs = logs.filter((l) => l.prescriptionItemId === it.id && l.status === 'TAKEN').length;
        const perDose = leadingNumber(it.dose) ?? 1;
        return {
          id: it.id,
          drugName: it.drugName,
          dose: it.dose,
          unit: it.unit,
          frequency: it.frequency,
          duration: it.duration,
          quantity: it.quantity,
          times: timesOf(it.reminderTimes),
          takenQuantity: takenLogs * perDose,
          totalQuantity: leadingNumber(it.quantity),
        };
      })
  );

  // Liều hôm nay.
  const todayDoses = activeItems
    .flatMap((it) =>
      it.times.map((time) => {
        const at = atTime(today, time);
        return {
          itemId: it.id,
          drugName: it.drugName,
          dose: [it.dose, it.unit].filter(Boolean).join(' '),
          time,
          scheduledAt: at.toISOString(),
          status: logByKey.get(logKey(it.id, at)) ?? null,
          due: at.getTime() <= now.getTime(),
        };
      })
    )
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  // Tuân thủ 7 ngày: liều đã đến giờ so với liều đã ghi nhận là đã uống.
  let expected = 0;
  for (let d = weekStart; d.getTime() <= today.getTime(); d = new Date(d.getTime() + DAY_MS)) {
    for (const pr of prescriptions) {
      for (const it of pr.items) {
        if (!isActiveOn(pr.prescribedAt, it.duration, d)) continue;
        for (const time of timesOf(it.reminderTimes)) {
          if (atTime(d, time).getTime() <= now.getTime()) expected++;
        }
      }
    }
  }
  const weekLogs = logs.filter((l) => l.scheduledAt.getTime() >= weekStart.getTime());
  const taken = Math.min(weekLogs.filter((l) => l.status === 'TAKEN').length, expected);

  const history = logs.slice(0, 20).map((l) => ({
    id: l.id,
    scheduledAt: l.scheduledAt.toISOString(),
    drugName: l.prescriptionItem.drugName,
    status: l.status,
  }));

  return {
    activeItems,
    today: todayDoses,
    adherence: { taken, expected, percent: expected > 0 ? Math.round((taken / expected) * 100) : null },
    history,
  };
}

/** Ghi nhận đã uống hoặc bỏ lỡ một liều. Chỉ cho phép thao tác trên thuốc của chính bệnh nhân. */
export async function recordDose(userId: string, itemId: string, scheduledAt: Date, status: DoseStatusValue) {
  const patientId = await patientProfileId(userId);
  if (!patientId) throw new Error('Không tìm thấy hồ sơ bệnh nhân');

  const item = await prisma.prescriptionItem.findFirst({
    where: { id: itemId, prescription: { visit: { patientId } } },
    select: { id: true },
  });
  if (!item) throw new Error('Không tìm thấy thuốc trong đơn của bạn');

  return prisma.doseLog.upsert({
    where: { prescriptionItemId_scheduledAt: { prescriptionItemId: itemId, scheduledAt } },
    create: { patientId, prescriptionItemId: itemId, scheduledAt, status },
    update: { status, recordedAt: new Date() },
  });
}
