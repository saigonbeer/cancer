"use client";

import { useEffect, useState } from "react";

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
}

interface Item {
  id: string;
  [key: string]: unknown;
}

export default function CatalogTab({
  apiBase,
  fields,
  addLabel,
}: {
  apiBase: string;
  fields: FieldDef[];
  addLabel: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(apiBase);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    setDraft({});
  }, [apiBase]);

  async function add() {
    setError(null);
    if (!draft.name?.trim()) {
      setError("Vui lòng nhập tên.");
      return;
    }
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không thêm được.");
      return;
    }
    setDraft({});
    load();
  }

  async function remove(id: string) {
    await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    load();
  }

  async function save(id: string, data: Record<string, string>) {
    await fetch(`${apiBase}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingId(null);
    load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section className="sec-card">
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--line-soft)" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{addLabel}</h2>
        </div>
        <div
          style={{
            padding: "18px 22px",
            display: "grid",
            gridTemplateColumns: `repeat(${fields.length}, minmax(0,1fr)) auto`,
            gap: 12,
            alignItems: "end",
          }}
        >
          {fields.map((f) => (
            <div key={f.key}>
              <label className="field-label">{f.label}</label>
              <input
                value={draft[f.key] || ""}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                placeholder={f.placeholder}
              />
            </div>
          ))}
          <button type="button" className="addbtn" style={{ height: 38 }} onClick={add}>
            Thêm
          </button>
        </div>
        {error && <div style={{ padding: "0 22px 16px", color: "var(--red)", fontSize: 13 }}>{error}</div>}
      </section>

      <section className="sec-card" style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${fields.length}, minmax(0,1fr)) auto`,
            gap: 12,
            padding: "12px 20px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.03em",
            color: "var(--ink-soft)",
            textTransform: "uppercase",
            borderBottom: "1px solid var(--line)",
          }}
        >
          {fields.map((f) => (
            <div key={f.key}>{f.label}</div>
          ))}
          <div>Hành động</div>
        </div>

        {loading && <div style={{ padding: 24, textAlign: "center", color: "var(--ink-soft)" }}>Đang tải...</div>}

        {!loading &&
          items.map((it) =>
            editingId === it.id ? (
              <EditRow key={it.id} item={it} fields={fields} onCancel={() => setEditingId(null)} onSave={save} />
            ) : (
              <div
                key={it.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${fields.length}, minmax(0,1fr)) auto`,
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 20px",
                  fontSize: 13.5,
                  borderBottom: "1px solid var(--line-soft)",
                }}
              >
                {fields.map((f, i) => (
                  <div key={f.key} style={{ fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "var(--ink)" : "var(--ink-soft)" }}>
                    {(it[f.key] as string) || "—"}
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="ghostbtn" onClick={() => setEditingId(it.id)}>
                    Sửa
                  </button>
                  <button type="button" className="ghostbtn" style={{ color: "var(--red)" }} onClick={() => remove(it.id)}>
                    Xóa
                  </button>
                </div>
              </div>
            )
          )}

        {!loading && items.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ink-soft)", fontSize: 14 }}>Chưa có mục nào.</div>
        )}
      </section>
    </div>
  );
}

function EditRow({
  item,
  fields,
  onCancel,
  onSave,
}: {
  item: Item;
  fields: FieldDef[];
  onCancel: () => void;
  onSave: (id: string, data: Record<string, string>) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, (item[f.key] as string) || ""]))
  );
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${fields.length}, minmax(0,1fr)) auto`,
        gap: 12,
        alignItems: "center",
        padding: "12px 20px",
        borderBottom: "1px solid var(--line-soft)",
      }}
    >
      {fields.map((f) => (
        <input key={f.key} value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="ghostbtn" onClick={() => onSave(item.id, draft)}>
          Xong
        </button>
        <button type="button" className="ghostbtn" onClick={onCancel}>
          Hủy
        </button>
      </div>
    </div>
  );
}
