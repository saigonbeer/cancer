"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export interface SidebarItem {
  href: string;
  label: string;
}

export default function Sidebar({
  brandLabel,
  items,
}: {
  brandLabel: string;
  items: SidebarItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside
      style={{
        width: 232,
        flex: "none",
        background: "var(--teal-deep)",
        padding: "26px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 30,
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px" }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "#fff",
            color: "var(--teal-deep)",
            fontWeight: 700,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          OE
        </div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{brandLabel}</div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href ? "active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        style={{
          marginTop: "auto",
          border: "none",
          background: "none",
          color: "#cfe6e2",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          textAlign: "left",
          padding: "10px 14px",
        }}
      >
        Đăng xuất
      </button>
    </aside>
  );
}
