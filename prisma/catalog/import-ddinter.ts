/**
 * Import tương tác thuốc từ DDInter 2.0 vào DrugInteraction.
 *
 * Chạy: npx tsx prisma/catalog/import-ddinter.ts
 *
 * Quy trình:
 * 1. Đọc tất cả CatalogDrug từ DB, tạo map tên (lowercase) → id
 * 2. Đọc 8 file CSV DDInter, lọc các cặp mà CẢ HAI thuốc đều có trong CatalogDrug
 * 3. Upsert vào DrugInteraction (severity + description)
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DDINTER_DIR = join(__dirname, 'ddinter');
const SEVERITY_MAP: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
  Minor: 'LOW',
  Moderate: 'MEDIUM',
  Major: 'HIGH',
};

function parseDDInterCsv(filePath: string): Array<{
  drugA: string;
  drugB: string;
  level: string;
}> {
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split('\n').slice(1); // skip header
  const results: Array<{ drugA: string; drugB: string; level: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Format: DDInterID_A,Drug_A,DDInterID_B,Drug_B,Level
    const parts = trimmed.split(',');
    if (parts.length < 5) continue;
    results.push({
      drugA: parts[1].trim(),
      drugB: parts[3].trim(),
      level: parts[4].trim(),
    });
  }
  return results;
}

async function main() {
  // 1. Load all catalog drugs
  const drugs = await prisma.catalogDrug.findMany({ select: { id: true, name: true } });
  const drugByName = new Map<string, string>();
  for (const d of drugs) {
    drugByName.set(d.name.toLowerCase(), d.id);
  }
  console.log(`CatalogDrug trong DB: ${drugs.length}`);

  // Also build alternate name map
  const drugsWithAlts = await prisma.catalogDrug.findMany({
    select: { id: true, alternateNames: true },
    where: { alternateNames: { not: null } },
  });
  for (const d of drugsWithAlts) {
    if (d.alternateNames) {
      for (const alt of d.alternateNames.split(';')) {
        const name = alt.trim().toLowerCase();
        if (name && !drugByName.has(name)) {
          drugByName.set(name, d.id);
        }
      }
    }
  }
  console.log(`Tổng tên tra cứu (gồm alternate): ${drugByName.size}`);

  // 2. Read all DDInter CSV files
  const csvFiles = readdirSync(DDINTER_DIR).filter((f) => f.endsWith('.csv'));
  let totalRows = 0;
  let matched = 0;
  let skipped = 0;
  const seen = new Set<string>();
  const batch: Array<{
    drugAId: string;
    drugBId: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
  }> = [];

  for (const file of csvFiles) {
    const rows = parseDDInterCsv(join(DDINTER_DIR, file));
    totalRows += rows.length;

    for (const row of rows) {
      const aId = drugByName.get(row.drugA.toLowerCase());
      const bId = drugByName.get(row.drugB.toLowerCase());
      if (!aId || !bId || aId === bId) {
        skipped++;
        continue;
      }

      // Normalize pair order to avoid duplicates (A-B = B-A)
      const [lo, hi] = aId < bId ? [aId, bId] : [bId, aId];
      const key = `${lo}:${hi}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const severity = SEVERITY_MAP[row.level] || 'MEDIUM';
      batch.push({
        drugAId: lo,
        drugBId: hi,
        severity,
        description: `${row.drugA} ↔ ${row.drugB}: ${row.level} interaction (DDInter)`,
      });
      matched++;
    }
  }

  console.log(`DDInter rows đọc: ${totalRows}`);
  console.log(`Matched cả 2 thuốc: ${matched}`);
  console.log(`Bỏ qua (không match): ${skipped}`);

  // 3. Upsert in batches
  const BATCH_SIZE = 100;
  let imported = 0;
  for (let i = 0; i < batch.length; i += BATCH_SIZE) {
    const chunk = batch.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map((item) =>
        prisma.drugInteraction.upsert({
          where: { drugAId_drugBId: { drugAId: item.drugAId, drugBId: item.drugBId } },
          create: item,
          update: { severity: item.severity, description: item.description },
        })
      )
    );
    imported += chunk.length;
    if (imported % 500 === 0 || imported === batch.length) {
      console.log(`Imported ${imported}/${batch.length}`);
    }
  }

  console.log(`\nHoàn tất: ${imported} tương tác thuốc imported.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
