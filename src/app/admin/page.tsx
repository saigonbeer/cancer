"use client";

import { useEffect, useState } from "react";

type Role = "DOCTOR" | "PATIENT" | "ADMIN";

interface Account {
  id: string;
  name: string;
  dob: string | null;
  email: string | null;
  role: Role;
  username: string;
}

const ROLE_LABEL: Record<Role, string> = {
  DOCTOR: "Bác sĩ",
  PATIENT: "Bệnh nhân",
  ADMIN: "Quản trị viên",
};

const ROLE_CLASS: Record<Role, string> = {
  DOCTOR: "var(--teal-tint)",
  PATIENT: "#FBEEE4",
  ADMIN: "var(--purple-tint)",
};

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    name: "",
    dob: "",
    email: "",
    role: "PATIENT" as Role,
    username: "",
    password: "",
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/accounts");
    const data = await res.json();
    setAccounts(data.accounts || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addAccount() {
    setError(null);
    if (!draft.name.trim() || !draft.username.trim() || !draft.password.trim()) {
      setError("Vui lòng nhập Họ tên, Username và Mật khẩu.");
      return;
    }
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Không thêm được tài khoản.");
      return;
    }
    setDraft({ name: "", dob: "", email: "", role: "PATIENT", username: "", password: "" });
    load();
  }

  async function removeAccount(id: string) {
    await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
    load();
  }

  async function saveEdit(acc: Account) {
    await fetch(`/api/admin/accounts/${acc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: acc.name,
        dob: acc.dob || undefined,
        email: acc.email || "",
        role: acc.role,
        username: acc.username,
      }),
    });
    setEditingId(null);
    load();
  }

  const totalAccounts = accounts.length;
  const doctorCount = accounts.filter((a) => a.role === "DOCTOR").length;
  const patientCount = accounts.filter((a) => a.role === "PATIENT").length;

  return (
    <>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", color: "var(--teal)", textTransform: "uppercase" }}>
          Onco EMR
        </div>
        <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 700 }}>Quản lý tài khoản</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        <Stat label="Tổng số tài khoản" value={totalAccounts} />
        <Stat label="Tài khoản bác sĩ" value={doctorCount} color="var(--teal-deep)" />
        <Stat label="Tài khoản bệnh nhân" value={patientCount} color="#C8743A" />
        <a href="/admin/catalog" className="sec-card" style={{ padding: "16px 18px", display: "block", textDecoration: "none", color: "inherit" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>Danh mục</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--purple)" }}>Xem →</div>
        </a>
      </div>

      <section className="sec-card">
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--line-soft)" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Thêm tài khoản mới</h2>
        </div>
        <div style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <Field label="Họ và tên">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nguyễn Văn A" />
          </Field>
          <Field label="Năm sinh">
            <input value={draft.dob} onChange={(e) => setDraft({ ...draft, dob: e.target.value })} placeholder="19.." />
          </Field>
          <Field label="Email">
            <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="email@domain.com" />
          </Field>
          <Field label="Vai trò">
            <select
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line)" }}
            >
              <option value="DOCTOR">Bác sĩ</option>
              <option value="PATIENT">Bệnh nhân</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </Field>
          <Field label="Username">
            <input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} placeholder="username" />
          </Field>
          <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
            <div style={{ flex: 1 }}>
              <Field label="Mật khẩu">
                <input
                  type="password"
                  value={draft.password}
                  onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                  placeholder="••••••"
                />
              </Field>
            </div>
            <button type="button" className="addbtn" style={{ height: 38 }} onClick={addAccount}>
              Thêm
            </button>
          </div>
        </div>
        {error && <div style={{ padding: "0 22px 16px", color: "var(--red)", fontSize: 13 }}>{error}</div>}
      </section>

      <section className="sec-card" style={{ overflow: "hidden" }}>
        <div style={gridHead}>
          <div>Họ và tên</div>
          <div>Năm sinh</div>
          <div>Email</div>
          <div>Vai trò</div>
          <div>Username</div>
          <div>Hành động</div>
        </div>
        {loading && <div style={{ padding: 24, textAlign: "center", color: "var(--ink-soft)" }}>Đang tải...</div>}
        {!loading &&
          accounts.map((acc) =>
            editingId === acc.id ? (
              <EditRow key={acc.id} account={acc} onCancel={() => setEditingId(null)} onSave={saveEdit} />
            ) : (
              <div key={acc.id} style={gridRow}>
                <div style={{ fontWeight: 600 }}>{acc.name}</div>
                <div style={{ color: "var(--ink-soft)" }}>{acc.dob || "—"}</div>
                <div style={{ color: "var(--ink-soft)" }}>{acc.email || "—"}</div>
                <div>
                  <span className="pill" style={{ background: ROLE_CLASS[acc.role] }}>
                    {ROLE_LABEL[acc.role]}
                  </span>
                </div>
                <div style={{ color: "var(--ink-soft)" }}>{acc.username}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="ghostbtn" onClick={() => setEditingId(acc.id)}>
                    Sửa
                  </button>
                  <button type="button" className="ghostbtn" style={{ color: "var(--red)" }} onClick={() => removeAccount(acc.id)}>
                    Xóa
                  </button>
                </div>
              </div>
            )
          )}
        {!loading && accounts.length === 0 && (
          <div style={{ padding: 28, textAlign: "center", color: "var(--ink-soft)", fontSize: 14 }}>Chưa có tài khoản nào.</div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="sec-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || "var(--ink)" }}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

const gridHead: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr 1.3fr 1fr 1fr 1.2fr",
  gap: 12,
  alignItems: "center",
  padding: "12px 20px",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.03em",
  color: "var(--ink-soft)",
  textTransform: "uppercase",
  borderBottom: "1px solid var(--line)",
};

const gridRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr 1.3fr 1fr 1fr 1.2fr",
  gap: 12,
  alignItems: "center",
  padding: "12px 20px",
  fontSize: 13.5,
  borderBottom: "1px solid var(--line-soft)",
};

function EditRow({
  account,
  onCancel,
  onSave,
}: {
  account: Account;
  onCancel: () => void;
  onSave: (a: Account) => void;
}) {
  const [draft, setDraft] = useState(account);
  return (
    <div style={gridRow}>
      <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      <input value={draft.dob || ""} onChange={(e) => setDraft({ ...draft, dob: e.target.value })} />
      <input value={draft.email || ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
      <select
        value={draft.role}
        onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}
        style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid var(--line)" }}
      >
        <option value="DOCTOR">Bác sĩ</option>
        <option value="PATIENT">Bệnh nhân</option>
        <option value="ADMIN">Quản trị viên</option>
      </select>
      <input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} />
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="ghostbtn" onClick={() => onSave(draft)}>
          Xong
        </button>
        <button type="button" className="ghostbtn" onClick={onCancel}>
          Hủy
        </button>
      </div>
    </div>
  );
}
