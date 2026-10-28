"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLE_HOME: Record<string, string> = {
  DOCTOR: "/doctor",
  PATIENT: "/patient",
  ADMIN: "/admin",
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đăng nhập thất bại.");
        return;
      }
      const home = ROLE_HOME[data.user.role] || "/login";
      window.location.href = home;
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--teal-deep)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src="/logo-108.png" alt="Logo Bệnh viện Trung ương Quân đội 108" style={{ width: 48, height: 48, objectFit: "contain" }} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 700 }}>Onco EMR</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-soft)", textAlign: "center" }}>
            Khoa Xạ trị &amp; Ung bướu — Hệ thống quản lý điều trị
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="sec-card"
          style={{ padding: 26, display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div>
            <label className="field-label">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
            />
          </div>
          <div>
            <label className="field-label">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "var(--red)" }}>{error}</div>
          )}

          <button type="submit" className="addbtn" style={{ justifyContent: "center" }} disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink-soft)" }}>
          © 2026 Onco EMR · Khoa Xạ trị &amp; Ung bướu
        </div>
      </div>
    </div>
  );
}
