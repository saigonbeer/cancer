/**
 * Nạp danh mục thuốc, phác đồ (NCI) và thuật ngữ CTCAE v6.0 vào cơ sở dữ liệu.
 *
 * Chạy: npx tsx prisma/catalog/import.ts
 *
 * Quy tắc:
 * - Dữ liệu admin đã nhập (mô tả, tương tác) được giữ nguyên: chỉ điền các trường còn trống.
 * - Chạy lại nhiều lần an toàn (upsert theo tên hoặc mã LLT).
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE_DRUGS = 'NCI drugs.csv';
const SOURCE_REGIMENS = 'NCI regimens.csv';

/** Đọc CSV chuẩn RFC 4180: hỗ trợ dấu nháy kép, xuống dòng trong ô và CRLF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Đọc CSV thành danh sách object theo dòng tiêu đề. */
function readCsv(file: string): Record<string, string>[] {
  const text = readFileSync(join(__dirname, file), 'utf8').replace(/^﻿/, '');
  const [header, ...body] = parseCsv(text);
  return body
    .filter((cells) => cells.some((c) => c.trim() !== ''))
    .map((cells) => Object.fromEntries(header.map((h, idx) => [h.trim(), (cells[idx] ?? '').trim()])));
}

const orNull = (value: string | undefined) => (value && value.length > 0 ? value : null);

async function importDrugs() {
  const rows = readCsv('drugs.csv');
  const seen = new Set<string>();
  let created = 0;
  let filled = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row['Name'];
    if (!name || seen.has(name.toLowerCase())) {
      skipped++;
      continue;
    }
    seen.add(name.toLowerCase());

    const data = {
      group: orNull(row['Category']),
      subGroup: orNull(row['Sub-category']),
      abbreviation: orNull(row['Abbreviation']),
      alternateNames: orNull(row['Alternate Name']),
      primarySite: orNull(row['Primary Site']),
      histology: orNull(row['Histology']),
      note: orNull(row['Remarks']),
      evsId: orNull(row['EVS ID']),
      source: SOURCE_DRUGS,
    };

    const existing = await prisma.catalogDrug.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (!existing) {
      await prisma.catalogDrug.create({ data: { name, ...data } });
      created++;
      continue;
    }
    // Chỉ điền các trường còn trống, không ghi đè dữ liệu admin đã nhập.
    const patch = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => value !== null && existing[key as keyof typeof existing] === null)
    );
    if (Object.keys(patch).length > 0) {
      await prisma.catalogDrug.update({ where: { id: existing.id }, data: patch });
      filled++;
    }
  }
  console.log(`Thuốc: tạo mới ${created}, bổ sung ${filled}, bỏ qua ${skipped}`);
}

async function importRegimens() {
  const rows = readCsv('regimens.csv');
  const drugs = await prisma.catalogDrug.findMany({ select: { id: true, name: true } });
  const drugIdByName = new Map(drugs.map((d) => [d.name.toLowerCase(), d.id]));
  let regimenCount = 0;
  let linkCount = 0;
  let stubDrugs = 0;

  for (const row of rows) {
    const name = row['Name'];
    if (!name) continue;

    const regimen = await prisma.catalogRegimen.upsert({
      where: { name },
      create: {
        name,
        histology: orNull(row['Histology']),
        primarySite: orNull(row['Primary Site']),
        radiation: orNull(row['Radiation']),
        alternateNames: orNull(row['Alternate Names']),
        remarks: orNull(row['Remarks']),
        source: SOURCE_REGIMENS,
      },
      update: {},
    });
    regimenCount++;

    const drugNames = (row['Drugs'] || '')
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean);

    for (const drugName of drugNames) {
      const key = drugName.toLowerCase();
      let drugId = drugIdByName.get(key);
      if (!drugId) {
        // Thuốc có trong phác đồ nhưng chưa có trong danh mục: tạo mục mới để liên kết.
        const created = await prisma.catalogDrug.create({
          data: { name: drugName, source: SOURCE_REGIMENS },
        });
        drugId = created.id;
        drugIdByName.set(key, drugId);
        stubDrugs++;
      }
      await prisma.regimenDrug.upsert({
        where: { regimenId_drugId: { regimenId: regimen.id, drugId } },
        create: { regimenId: regimen.id, drugId },
        update: {},
      });
      linkCount++;
    }
  }
  console.log(`Phác đồ: ${regimenCount}, liên kết thuốc ${linkCount}, thuốc mới trong phác đồ ${stubDrugs}`);
}

async function importCtcae() {
  const terms = JSON.parse(readFileSync(join(__dirname, 'ctcae-v6.json'), 'utf8')) as Array<{
    lltCode: string;
    soc: string;
    term: string;
    grade1: string | null;
    grade2: string | null;
    grade3: string | null;
    grade4: string | null;
    grade5: string | null;
    definition: string | null;
    navigationalNote: string | null;
    changeNote: string | null;
  }>;

  for (const t of terms) {
    await prisma.ctcaeTerm.upsert({
      where: { lltCode: t.lltCode },
      create: { ...t, version: 'v6.0' },
      update: { ...t, version: 'v6.0' },
    });
  }
  console.log(`CTCAE v6.0: ${terms.length} thuật ngữ`);
}

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
  for (const entry of data) {
    const ctcaeTerm = await prisma.ctcaeTerm.findUnique({ where: { lltCode: entry.lltCode } });
    if (!ctcaeTerm) {
      console.warn(`CTCAE term not found: ${entry.lltCode} (${entry.term})`);
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
  console.log(`Hướng dẫn xử trí: ${total} entries cho ${data.length} CTCAE terms`);
}

async function main() {
  await importDrugs();
  await importRegimens();
  await importCtcae();
  await importManagementGuidelines();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
