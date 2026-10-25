"use client";

import { useEffect, useState } from "react";

interface Row {
  module: string;
  label: string;
  ADMIN: boolean;
  DOCTOR: boolean;
  PATIENT: boolean;
}

export default function PermissionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/permissions");
    const data = await res.json();
    setRows(data.matrix || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(module: string, role: "ADMIN" | "DOCTOR" | "PATIENT", current: boolean) {
    setRows((prev) => prev.map((r) => (r.module === module ? { ...r, [role]: !current } : r)));
    await fetch("/api/admin/permissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module, role, allowed: !current }),
    });
  }

  return (
    <>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", color: "var(--teal)", textTransform: "uppercase" }}>
          Onco EMR
        </div>
        <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 700 }}>Ma trận phân quyền</h1>
        <div style={{ marginTop: 2, fontSize: 13.5, color: "var(--ink-soft)" }}>
          Bật/tắt quyền truy cập từng chức năng theo vai trò — áp dụng ngay vào kiểm tra phân quyền ở server.
        </div>
      </div>

      <section className="sec-card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr repeat(3, 1fr)" }}>
          <div style={head}>Chức năng</div>
          <div style={{ ...head, textAlign: "center" }}>Quản trị viên</div>
          <div style={{ ...head, textAlign: "center" }}>Bác sĩ</div>
          <div style={{ ...head, textAlign: "center" }}>Bệnh nhân</div>

          {!loading &&
            rows.map((r) => (
              <>
                <div key={r.module + "-label"} style={rowCell}>
                  {r.label}
                </div>
                <div key={r.module + "-admin"} style={{ ...rowCell, justifyContent: "center" }}>
                  <input type="checkbox" checked={r.ADMIN} onChange={() => toggle(r.module, "ADMIN", r.ADMIN)} />
                </div>
                <div key={r.module + "-doctor"} style={{ ...rowCell, justifyContent: "center" }}>
                  <input type="checkbox" checked={r.DOCTOR} onChange={() => toggle(r.module, "DOCTOR", r.DOCTOR)} />
                </div>
                <div key={r.module + "-patient"} style={{ ...rowCell, justifyContent: "center" }}>
                  <input type="checkbox" checked={r.PATIENT} onChange={() => toggle(r.module, "PATIENT", r.PATIENT)} />
                </div>
              </>
            ))}
        </div>
      </section>
    </>
  );
}

const head: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.03em",
  color: "var(--ink-soft)",
  textTransform: "uppercase",
  padding: "14px 20px",
  borderBottom: "1px solid var(--line)",
};

const rowCell: React.CSSProperties = {
  padding: "14px 20px",
  borderBottom: "1px solid var(--line-soft)",
  display: "flex",
  alignItems: "center",
  fontSize: 13.5,
  fontWeight: 600,
};
