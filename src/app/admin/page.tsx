"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast, useConfirm } from "@/components/UIFeedback";

type Role = "DOCTOR" | "PATIENT" | "ADMIN";

interface Account {
  id: string;
  name: string;
  dob: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
  username: string;
  doctorProfile?: { department: string | null } | null;
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

const fieldStyle: React.CSSProperties = {
  width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: "9px 11px", fontSize: 13.5, fontFamily: "inherit", background: "#fff",
};

const EMPTY_FORM = {
  name: "", dob: "", email: "", phone: "", department: "",
  role: "PATIENT" as Role, username: "", password: "",
};
type FormState = typeof EMPTY_FORM;

function formFrom(acc: Account): FormState {
  return {
    name: acc.name, dob: acc.dob || "", email: acc.email || "", phone: acc.phone || "",
    department: acc.doctorProfile?.department || "", role: acc.role, username: acc.username, password: "",
  };
}

export default function AdminAccountsPage() {
  const toast = useToast();
  const confirmFn = useConfirm();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/accounts");
    const data = await res.json().catch(() => ({ accounts: [] }));
    setAccounts(data.accounts || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) => a.name.toLowerCase().includes(q) || a.username.toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q)
    );
  }, [accounts, search]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalMode("create");
  }

  function openEdit(acc: Account) {
    setForm(formFrom(acc));
    setEditingId(acc.id);
    setFormError(null);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
  }

  async function save() {
    setFormError(null);
    if (!form.name.trim() || !form.username.trim() || (modalMode === "create" && !form.password.trim())) {
      setFormError("Vui lòng nhập Họ tên, Username và Mật khẩu.");
      return;
    }
    setSaving(true);
    const body: Record<string, unknown> = {
      name: form.name, dob: form.dob || undefined, email: form.email || "", phone: form.phone || "",
      department: form.department, role: form.role, username: form.username,
    };
    if (form.password.trim()) body.password = form.password.trim();

    const res = modalMode === "create"
      ? await fetch("/api/admin/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch(`/api/admin/accounts/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setFormError(data.error || "Không lưu được.");
      return;
    }
    toast.success(modalMode === "create" ? "Đã thêm tài khoản." : "Đã lưu thay đổi.");
    closeModal();
    load();
  }

  async function removeAccount(acc: Account) {
    const ok = await confirmFn(`Xác nhận xóa tài khoản "${acc.name}"?`, "Hành động này không thể hoàn tác.");
    if (!ok) return;
    const res = await fetch(`/api/admin/accounts/${acc.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Không xóa được tài khoản.");
      return;
    }
    toast.success("Đã xóa tài khoản.");
    load();
  }

  const totalAccounts = accounts.length;
  const doctorCount = accounts.filter((a) => a.role === "DOCTOR").length;
  const patientCount = accounts.filter((a) => a.role === "PATIENT").length;

  return (
    <>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", color: "var(--teal)", textTransform: "uppercase" }}>
          108|Future
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

      <section className="sec-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--line-soft)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Danh sách ({filtered.length.toLocaleString("vi-VN")})</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, username, email..." style={{ ...fieldStyle, width: 240 }} />
            <button type="button" className="addbtn" onClick={openCreate}>Thêm tài khoản</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr 1fr 1fr auto", gap: 12, padding: "12px 20px", fontSize: 12, fontWeight: 700, letterSpacing: "0.03em", color: "var(--ink-soft)", textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>
          <div>Họ và tên</div>
          <div>Vai trò</div>
          <div>Khoa / Username</div>
          <div>Liên hệ</div>
          <div>Hành động</div>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ink-soft)" }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 28, textAlign: "center", color: "var(--ink-soft)", fontSize: 14 }}>Chưa có tài khoản nào.</div>
        ) : (
          filtered.map((acc) => (
            <div key={acc.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr 1fr 1fr auto", gap: 12, alignItems: "center", padding: "12px 20px", fontSize: 13.5, borderBottom: "1px solid var(--line-soft)" }}>
              <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acc.name}</div>
              <div>
                <span className="pill" style={{ background: ROLE_CLASS[acc.role] }}>{ROLE_LABEL[acc.role]}</span>
              </div>
              <div style={{ color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {acc.role === "DOCTOR" && acc.doctorProfile?.department ? `${acc.doctorProfile.department} · ` : ""}
                {acc.username}
              </div>
              <div style={{ color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {acc.phone || acc.email || "—"}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="ghostbtn" onClick={() => openEdit(acc)}>Sửa</button>
                <button type="button" className="ghostbtn" style={{ color: "var(--red)" }} onClick={() => removeAccount(acc)}>Xóa</button>
              </div>
            </div>
          ))
        )}
      </section>

      {modalMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1050, padding: 20 }}>
          <div className="sec-card" style={{ width: 560, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", padding: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 0 }}>{modalMode === "create" ? "Thêm tài khoản" : "Sửa tài khoản"}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="field-label">Họ và tên</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nguyễn Văn A" style={fieldStyle} />
              </div>
              <div>
                <label className="field-label">Năm sinh</label>
                <input value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} placeholder="19.." style={fieldStyle} />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@domain.com" style={fieldStyle} />
              </div>
              <div>
                <label className="field-label">Số điện thoại</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09xxxxxxxx" style={fieldStyle} />
              </div>
              <div>
                <label className="field-label">Vai trò</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} style={fieldStyle}>
                  <option value="DOCTOR">Bác sĩ</option>
                  <option value="PATIENT">Bệnh nhân</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </div>
              {form.role === "DOCTOR" && (
                <div>
                  <label className="field-label">Khoa / Chuyên khoa</label>
                  <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Xạ trị - Xạ phẫu" style={fieldStyle} />
                </div>
              )}
              <div>
                <label className="field-label">Username</label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" style={fieldStyle} />
              </div>
              <div>
                <label className="field-label">{modalMode === "create" ? "Mật khẩu" : "Mật khẩu mới (để trống nếu không đổi)"}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" style={fieldStyle} />
              </div>
            </div>
            {formError && <div style={{ color: "var(--red)", fontSize: 13, marginTop: 12 }}>{formError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button type="button" className="ghostbtn" onClick={closeModal}>Hủy</button>
              <button type="button" className="addbtn" onClick={save} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
            </div>
          </div>
        </div>
      )}
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
