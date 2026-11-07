/** Tiện ích dùng chung để tính "thuốc nào đang trong thời gian sử dụng hiện hành" cho 1 bệnh nhân. */

export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function activeDays(duration?: string | null): number | null {
  const m = (duration || '').match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

/** Số đầu tiên trong chuỗi, ví dụ "2 viên" → 2, "20 viên" → 20. */
export function leadingNumber(value?: string | null): number | null {
  const m = (value || '').match(/(\d+(?:[.,]\d+)?)/);
  return m ? Number(m[1].replace(',', '.')) : null;
}

export function timesOf(reminderTimes?: string | null) {
  const list = (reminderTimes || '').split(',').map((t) => t.trim()).filter(Boolean);
  return list.length > 0 ? list : ['08:00'];
}

export function isActiveOn(prescribedAt: Date, duration: string | null | undefined, day: Date) {
  const start = startOfDay(prescribedAt);
  if (day < start) return false;
  const days = activeDays(duration);
  if (days === null) return true;
  return day.getTime() < start.getTime() + days * DAY_MS;
}

export function atTime(day: Date, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(day);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}
