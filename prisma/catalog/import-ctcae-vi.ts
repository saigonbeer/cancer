/**
 * Nạp bản dịch tiếng Việt CTCAE v6.0 vào CtcaeTerm (các cột *Vi).
 * Nguồn: CTCAE_v6.0_Tieng_Viet.xlsx -> prisma/catalog/ctcae-v6-vi.json
 * Khớp theo lltCode (giống hệt bản tiếng Anh đã import).
 *
 * Chạy: npx tsx prisma/catalog/import-ctcae-vi.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows = JSON.parse(readFileSync(join(__dirname, 'ctcae-v6-vi.json'), 'utf8')) as Array<{
    lltCode: string;
    socVi: string;
    termVi: string;
    grade1Vi: string | null;
    grade2Vi: string | null;
    grade3Vi: string | null;
    grade4Vi: string | null;
    grade5Vi: string | null;
    definitionVi: string | null;
    navigationalNoteVi: string | null;
    changeNoteVi: string | null;
  }>;

  let updated = 0;
  let notFound = 0;

  for (const r of rows) {
    const result = await prisma.ctcaeTerm.updateMany({
      where: { lltCode: r.lltCode },
      data: {
        socVi: r.socVi,
        termVi: r.termVi,
        grade1Vi: r.grade1Vi,
        grade2Vi: r.grade2Vi,
        grade3Vi: r.grade3Vi,
        grade4Vi: r.grade4Vi,
        grade5Vi: r.grade5Vi,
        definitionVi: r.definitionVi,
        navigationalNoteVi: r.navigationalNoteVi,
        changeNoteVi: r.changeNoteVi,
      },
    });
    if (result.count > 0) updated++;
    else notFound++;
  }

  console.log(`CTCAE tiếng Việt: cập nhật ${updated}, không khớp lltCode ${notFound}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
