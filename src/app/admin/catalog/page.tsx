"use client";

import { useState } from "react";
import CtcaeCatalogTab from "@/components/CtcaeCatalogTab";
import DrugInteractionTab from "@/components/DrugInteractionTab";
import RichCatalogTab from "@/components/RichCatalogTab";

const DRUG_FIELDS = [
  { key: "name", label: "Tên thuốc", placeholder: "Paracetamol" },
  { key: "group", label: "Nhóm", placeholder: "Giảm đau, hạ sốt..." },
  { key: "subGroup", label: "Nhóm phụ", placeholder: "..." },
  { key: "abbreviation", label: "Viết tắt", placeholder: "PCM" },
  { key: "alternateNames", label: "Tên khác", placeholder: "Acetaminophen" },
  { key: "primarySite", label: "Vị trí nguyên phát", placeholder: "..." },
  { key: "histology", label: "Mô bệnh học", placeholder: "..." },
  { key: "source", label: "Nguồn", placeholder: "SEER*Rx, DDInter..." },
  { key: "note", label: "Ghi chú", placeholder: "...", multiline: true },
  { key: "description", label: "Mô tả", placeholder: "Mô tả ngắn...", multiline: true },
] as const;

const DRUG_LIST_COLUMNS = [
  { key: "name", label: "Tên thuốc" },
  { key: "group", label: "Nhóm" },
  { key: "source", label: "Nguồn" },
] as const;

const DRUG_IMPORT_ALIASES: Record<string, string> = {
  "name": "name",
  "tên thuốc": "name",
  "group": "group",
  "category": "group",
  "nhóm": "group",
  "sub-category": "subGroup",
  "subcategory": "subGroup",
  "nhóm phụ": "subGroup",
  "abbreviation": "abbreviation",
  "viết tắt": "abbreviation",
  "alternate name": "alternateNames",
  "alternate names": "alternateNames",
  "tên khác": "alternateNames",
  "primary site": "primarySite",
  "vị trí nguyên phát": "primarySite",
  "histology": "histology",
  "mô bệnh học": "histology",
  "remarks": "note",
  "ghi chú": "note",
  "description": "description",
  "mô tả": "description",
  "source": "source",
  "nguồn": "source",
};

const REGIMEN_FIELDS = [
  { key: "name", label: "Tên phác đồ", placeholder: "FOLFOX" },
  { key: "histology", label: "Mô bệnh học", placeholder: "..." },
  { key: "primarySite", label: "Vị trí nguyên phát", placeholder: "..." },
  { key: "radiation", label: "Xạ trị kèm theo", placeholder: "..." },
  { key: "alternateNames", label: "Tên khác", placeholder: "..." },
  { key: "source", label: "Nguồn", placeholder: "NCCN, SEER*Rx..." },
  { key: "remarks", label: "Ghi chú", placeholder: "...", multiline: true },
  { key: "description", label: "Mô tả", placeholder: "Mô tả ngắn...", multiline: true },
] as const;

const REGIMEN_LIST_COLUMNS = [
  { key: "name", label: "Tên phác đồ" },
  { key: "primarySite", label: "Vị trí nguyên phát" },
  { key: "source", label: "Nguồn" },
] as const;

const REGIMEN_IMPORT_ALIASES: Record<string, string> = {
  "name": "name",
  "tên phác đồ": "name",
  "regimen": "name",
  "histology": "histology",
  "mô bệnh học": "histology",
  "primary site": "primarySite",
  "vị trí nguyên phát": "primarySite",
  "radiation": "radiation",
  "xạ trị": "radiation",
  "alternate name": "alternateNames",
  "alternate names": "alternateNames",
  "tên khác": "alternateNames",
  "remarks": "remarks",
  "ghi chú": "remarks",
  "description": "description",
  "mô tả": "description",
  "source": "source",
  "nguồn": "source",
};

const TABS = [
  { id: "drugs", label: "Thuốc" },
  { id: "interactions", label: "Tương tác thuốc" },
  { id: "cancers", label: "Loại ung thư" },
  { id: "ctcae", label: "Tác dụng phụ (CTCAE)" },
  { id: "regimens", label: "Phác đồ" },
] as const;

const CANCER_FIELDS = [
  { key: "name", label: "Tên ung thư", placeholder: "Ung thư vú" },
  { key: "stage", label: "Giai đoạn", placeholder: "I / II / III / IV" },
  { key: "description", label: "Mô tả", placeholder: "Mô tả ngắn...", multiline: true },
] as const;

const CANCER_LIST_COLUMNS = [
  { key: "name", label: "Tên ung thư" },
  { key: "stage", label: "Giai đoạn" },
] as const;

const CANCER_IMPORT_ALIASES: Record<string, string> = {
  "name": "name",
  "tên ung thư": "name",
  "stage": "stage",
  "giai đoạn": "stage",
  "description": "description",
  "mô tả": "description",
};

export default function CatalogPage() {
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("drugs");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", color: "var(--teal)", textTransform: "uppercase" }}>
          108|Future
        </div>
        <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 700 }}>Danh mục</h1>
      </div>

      <div style={{ display: "flex", gap: 26, borderBottom: "1px solid var(--line)", overflowX: "auto" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              border: "none",
              background: "none",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 4px",
              cursor: "pointer",
              borderBottom: tab === t.id ? "3px solid var(--teal)" : "3px solid transparent",
              color: tab === t.id ? "var(--teal-deep)" : "var(--ink-soft)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active.id === "ctcae" ? (
        <CtcaeCatalogTab />
      ) : active.id === "interactions" ? (
        <DrugInteractionTab />
      ) : active.id === "drugs" ? (
        <RichCatalogTab
          apiBase="/api/admin/catalog/drugs"
          addLabel="Thêm thuốc"
          fields={DRUG_FIELDS as unknown as { key: string; label: string; placeholder?: string; multiline?: boolean }[]}
          listColumns={DRUG_LIST_COLUMNS as unknown as { key: string; label: string }[]}
          searchPlaceholder="Tìm theo tên thuốc..."
          importColumnAliases={DRUG_IMPORT_ALIASES}
          importHint="Chấp nhận file .xlsx với các cột: Name, Group/Category, Sub-category, Abbreviation, Alternate Name, Primary Site, Histology, Remarks, Description, Source. Chỉ cần cột Tên thuốc là bắt buộc."
        />
      ) : active.id === "regimens" ? (
        <RichCatalogTab
          apiBase="/api/admin/catalog/regimens"
          addLabel="Thêm phác đồ"
          fields={REGIMEN_FIELDS as unknown as { key: string; label: string; placeholder?: string; multiline?: boolean }[]}
          listColumns={REGIMEN_LIST_COLUMNS as unknown as { key: string; label: string }[]}
          searchPlaceholder="Tìm theo tên phác đồ..."
          importColumnAliases={REGIMEN_IMPORT_ALIASES}
          importHint="Chấp nhận file .xlsx với các cột: Name, Histology, Primary Site, Radiation, Alternate Name, Remarks, Description, Source. Chỉ cần cột Tên phác đồ là bắt buộc."
        />
      ) : (
        <RichCatalogTab
          apiBase="/api/admin/catalog/cancers"
          addLabel="Thêm loại ung thư"
          fields={CANCER_FIELDS as unknown as { key: string; label: string; placeholder?: string; multiline?: boolean }[]}
          listColumns={CANCER_LIST_COLUMNS as unknown as { key: string; label: string }[]}
          searchPlaceholder="Tìm theo tên loại ung thư..."
          importColumnAliases={CANCER_IMPORT_ALIASES}
          importHint="Chấp nhận file .xlsx với các cột: Name, Stage, Description. Chỉ cần cột Tên ung thư là bắt buộc."
        />
      )}
    </>
  );
}
