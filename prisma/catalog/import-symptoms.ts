/**
 * Đồng bộ danh mục Triệu chứng (CatalogSymptom) cho tab Admin từ CTCAE v6.0.
 *
 * Danh sách triệu chứng tác dụng phụ bệnh nhân dùng để báo cáo đã có sẵn
 * trong CtcaeTerm (850 thuật ngữ), nhưng CatalogSymptom (hiển thị ở tab
 * Danh mục > Triệu chứng của admin) đang trống. Script này nạp từ CtcaeTerm
 * sang CatalogSymptom để admin quản lý được cùng danh mục.
 *
 * Chạy: npx tsx prisma/catalog/import-symptoms.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const terms = await prisma.ctcaeTerm.findMany({
    select: { term: true, termVi: true, soc: true, socVi: true, definition: true },
  });

  let created = 0;
  let filled = 0;
  let skipped = 0;

  for (const t of terms) {
    const name = t.termVi || t.term;
    if (!name) {
      skipped++;
      continue;
    }

    const existing = await prisma.catalogSymptom.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (!existing) {
      await prisma.catalogSymptom.create({
        data: {
          name,
          group: t.socVi || t.soc || null,
          description: t.definition || null,
        },
      });
      created++;
      continue;
    }

    const patch: Record<string, string> = {};
    if (!existing.group && (t.socVi || t.soc)) patch.group = t.socVi || t.soc!;
    if (!existing.description && t.definition) patch.description = t.definition;
    if (Object.keys(patch).length > 0) {
      await prisma.catalogSymptom.update({ where: { id: existing.id }, data: patch });
      filled++;
    } else {
      skipped++;
    }
  }

  console.log(`Triệu chứng: tạo mới ${created}, bổ sung ${filled}, bỏ qua ${skipped}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
