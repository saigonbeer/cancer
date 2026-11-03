import type { CSSProperties } from 'react';

export const GRADE_LABELS: Record<number, string> = {
  1: 'Độ 1 — Nhẹ',
  2: 'Độ 2 — Vừa',
  3: 'Độ 3 — Nặng',
  4: 'Độ 4 — Đe dọa tính mạng',
  5: 'Độ 5 — Tử vong',
};

export function gradeStyle(grade?: number | null): CSSProperties {
  switch (grade) {
    case 1:
      return { background: 'var(--grade1-tint)', color: 'var(--grade1)' };
    case 2:
      return { background: 'var(--grade2-tint)', color: 'var(--grade2)' };
    case 3:
      return { background: 'var(--grade3-tint)', color: 'var(--grade3)' };
    case 4:
      return { background: 'var(--grade4-tint)', color: 'var(--grade4)' };
    case 5:
      return { background: 'var(--grade5-tint)', color: 'var(--grade5)' };
    default:
      return { background: 'var(--bg)', color: 'var(--ink-soft)' };
  }
}

export function gradeLabel(grade?: number | null): string {
  if (!grade) return 'Chưa phân độ';
  return GRADE_LABELS[grade] || `Độ ${grade}`;
}
