"use client";

import { useState } from "react";
import CatalogTab from "@/components/CatalogTab";

const TABS = [
  { id: "drugs", label: "Thuốc", api: "/api/admin/catalog/drugs", addLabel: "Thêm thuốc", fields: [
    { key: "name", label: "Tên thuốc", placeholder: "Paracetamol" },
    { key: "group", label: "Nhóm", placeholder: "Giảm đau..." },
    { key: "description", label: "Mô tả", placeholder: "Mô tả ngắn..." },
  ] },
  { id: "cancers", label: "Loại ung thư", api: "/api/admin/catalog/cancers", addLabel: "Thêm loại ung thư", fields: [
    { key: "name", label: "Tên ung thư", placeholder: "Ung thư vú" },
    { key: "stage", label: "Giai đoạn", placeholder: "I / II / III / IV" },
    { key: "description", label: "Mô tả", placeholder: "Mô tả ngắn..." },
  ] },
  { id: "symptoms", label: "Triệu chứng", api: "/api/admin/catalog/symptoms", addLabel: "Thêm triệu chứng", fields: [
    { key: "name", label: "Tên triệu chứng", placeholder: "Buồn nôn" },
    { key: "group", label: "Nhóm", placeholder: "Tiêu hóa..." },
    { key: "description", label: "Mô tả", placeholder: "Mô tả ngắn..." },
  ] },
  { id: "regimens", label: "Phác đồ", api: "/api/admin/catalog/regimens", addLabel: "Thêm phác đồ", fields: [
    { key: "name", label: "Tên phác đồ", placeholder: "FOLFOX" },
    { key: "description", label: "Mô tả", placeholder: "Mô tả ngắn..." },
  ] },
] as const;

export default function CatalogPage() {
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("drugs");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", color: "var(--teal)", textTransform: "uppercase" }}>
          Onco EMR
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

      <CatalogTab apiBase={active.api} fields={active.fields as unknown as { key: string; label: string; placeholder?: string }[]} addLabel={active.addLabel} />
    </>
  );
}
