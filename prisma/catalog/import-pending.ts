/**
 * Import chỉ ManagementGuideline + DrugInteraction (DDInter).
 * Drugs/Regimens/CTCAE đã có trong DB, không cần chạy lại.
 *
 * Chạy: npx tsx prisma/catalog/import-pending.ts
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Management Guidelines ──────────────────────────────────────
async function importManagementGuidelines() {
  const data = JSON.parse(readFileSync(join(__dirname, 'management-guidelines.json'), 'utf8')) as Array<{
    lltCode: string;
    term: string;
    guidelines: Array<{
      grade: number;
      modality: string;
      assessment: string;
      management: string;
      medication?: string;
      regimenAction?: string;
      referral?: string;
      patientAdvice?: string;
    }>;
  }>;

  let total = 0;
  let skippedTerms = 0;
  for (const entry of data) {
    const ctcaeTerm = await prisma.ctcaeTerm.findUnique({ where: { lltCode: entry.lltCode } });
    if (!ctcaeTerm) {
      console.warn(`CTCAE term not found: ${entry.lltCode} (${entry.term})`);
      skippedTerms++;
      continue;
    }

    for (const g of entry.guidelines) {
      await prisma.managementGuideline.upsert({
        where: {
          ctcaeTermId_grade_modality: {
            ctcaeTermId: ctcaeTerm.id,
            grade: g.grade,
            modality: g.modality,
          },
        },
        create: {
          ctcaeTermId: ctcaeTerm.id,
          grade: g.grade,
          modality: g.modality,
          assessment: g.assessment,
          management: g.management,
          medication: g.medication ?? null,
          regimenAction: g.regimenAction ?? null,
          referral: g.referral ?? null,
          patientAdvice: g.patientAdvice ?? null,
        },
        update: {
          assessment: g.assessment,
          management: g.management,
          medication: g.medication ?? null,
          regimenAction: g.regimenAction ?? null,
          referral: g.referral ?? null,
          patientAdvice: g.patientAdvice ?? null,
        },
      });
      total++;
    }
  }
  console.log(`Hướng dẫn xử trí: ${total} entries, bỏ qua ${skippedTerms} terms`);
}

// ─── DDInter Drug Interactions ───────────────────────────────────
const DDINTER_DIR = join(__dirname, 'ddinter');
const SEVERITY_MAP: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
  Minor: 'LOW',
  Moderate: 'MEDIUM',
  Major: 'HIGH',
};

async function importDDInter() {
  const drugs = await prisma.catalogDrug.findMany({
    select: { id: true, name: true, alternateNames: true },
  });
  const drugByName = new Map<string, string>();
  for (const d of drugs) {
    drugByName.set(d.name.toLowerCase(), d.id);
    if (d.alternateNames) {
      for (const alt of d.alternateNames.split(';')) {
        const name = alt.trim().toLowerCase();
        if (name && !drugByName.has(name)) drugByName.set(name, d.id);
      }
    }
  }
  console.log(`Thuốc tra cứu: ${drugByName.size} tên`);

  let csvFiles: string[];
  try {
    csvFiles = readdirSync(DDINTER_DIR).filter((f) => f.endsWith('.csv'));
  } catch {
    console.log('Không tìm thấy thư mục ddinter/, bỏ qua import DDInter.');
    return;
  }

  let totalRows = 0;
  let matched = 0;
  const seen = new Set<string>();
  const batch: Array<{
    drugAId: string;
    drugBId: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
  }> = [];

  for (const file of csvFiles) {
    const text = readFileSync(join(DDINTER_DIR, file), 'utf8');
    const lines = text.split('\n').slice(1);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      totalRows++;
      const parts = trimmed.split(',');
      if (parts.length < 5) continue;

      const drugA = parts[1].trim();
      const drugB = parts[3].trim();
      const aId = drugByName.get(drugA.toLowerCase());
      const bId = drugByName.get(drugB.toLowerCase());
      if (!aId || !bId || aId === bId) continue;

      const [lo, hi] = aId < bId ? [aId, bId] : [bId, aId];
      const key = `${lo}:${hi}`;
      if (seen.has(key)) continue;
      seen.add(key);

      batch.push({
        drugAId: lo,
        drugBId: hi,
        severity: SEVERITY_MAP[parts[4].trim()] || 'MEDIUM',
        description: `${drugA} ↔ ${drugB}: ${parts[4].trim()} (DDInter 2.0)`,
      });
      matched++;
    }
  }

  console.log(`DDInter: ${totalRows} rows, matched ${matched} cặp`);

  const BATCH_SIZE = 50;
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
      console.log(`  DDInter imported: ${imported}/${batch.length}`);
    }
  }
  console.log(`DDInter hoàn tất: ${imported} tương tác.`);
}

async function main() {
  await importManagementGuidelines();
  await importDDInter();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
