import { prisma } from '@/lib/db';
import type { Severity } from '@prisma/client';

const PAGE_SIZE = 25;

/** Danh sách tương tác thuốc, có thể lọc theo tên thuốc (khớp 1 trong 2 vế) và phân trang. */
export async function listDrugInteractions(opts: { q?: string; page?: number }) {
  const page = Math.max(1, opts.page || 1);
  const q = opts.q?.trim();

  const where = q
    ? {
        OR: [
          { drugA: { name: { contains: q, mode: 'insensitive' as const } } },
          { drugB: { name: { contains: q, mode: 'insensitive' as const } } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.drugInteraction.findMany({
      where,
      include: { drugA: { select: { id: true, name: true } }, drugB: { select: { id: true, name: true } } },
      orderBy: [{ severity: 'desc' }, { drugA: { name: 'asc' } }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.drugInteraction.count({ where }),
  ]);

  return { items, total, page, pageSize: PAGE_SIZE };
}

export async function createDrugInteraction(data: { drugAId: string; drugBId: string; severity: Severity; description: string }) {
  if (data.drugAId === data.drugBId) {
    throw new Error('Không thể tạo tương tác của một thuốc với chính nó.');
  }

  // Chuẩn hoá thứ tự A/B để tránh tạo trùng (A,B) và (B,A) như hai cặp khác nhau.
  const [drugAId, drugBId] = [data.drugAId, data.drugBId].sort();

  const existing = await prisma.drugInteraction.findUnique({ where: { drugAId_drugBId: { drugAId, drugBId } } });
  if (existing) {
    throw new Error('Cặp thuốc này đã có tương tác được ghi nhận — vui lòng sửa bản ghi hiện có thay vì tạo mới.');
  }

  return prisma.drugInteraction.create({
    data: { drugAId, drugBId, severity: data.severity, description: data.description },
    include: { drugA: { select: { id: true, name: true } }, drugB: { select: { id: true, name: true } } },
  });
}

export async function updateDrugInteraction(id: string, data: { severity?: Severity; description?: string }) {
  return prisma.drugInteraction.update({
    where: { id },
    data,
    include: { drugA: { select: { id: true, name: true } }, drugB: { select: { id: true, name: true } } },
  });
}

export async function deleteDrugInteraction(id: string) {
  return prisma.drugInteraction.delete({ where: { id } });
}
