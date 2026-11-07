import { prisma } from '@/lib/db';

/** Tìm kiếm thuật ngữ CTCAE theo tên tiếng Việt/Anh hoặc mã LLT, dùng chung cho API bác sĩ/bệnh nhân. */
export async function searchCtcaeTerms(q: string | undefined, limit = 20) {
  const where = q?.trim()
    ? {
        OR: [
          { termVi: { contains: q.trim(), mode: 'insensitive' as const } },
          { term: { contains: q.trim(), mode: 'insensitive' as const } },
          { lltCode: { contains: q.trim(), mode: 'insensitive' as const } },
        ],
      }
    : {};

  return prisma.ctcaeTerm.findMany({
    where,
    orderBy: [{ order: 'asc' }, { termVi: 'asc' }],
    take: limit,
  });
}
