"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export interface SidebarItem {
  href: string;
  label: string;
  /** Tên trường trong kết quả notificationsEndpoint dùng làm số badge cho mục này, ví dụ "unreadMessages". */
  badgeKey?: string;
}

const POLL_MS = 30000;

export default function Sidebar({
  brandLabel,
  items,
  notificationsEndpoint,
}: {
  brandLabel: string;
  items: SidebarItem[];
  /** API trả về { [badgeKey]: number }, được gọi khi tải trang và lặp lại định kỳ. */
  notificationsEndpoint?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!notificationsEndpoint) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(notificationsEndpoint!, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCounts(data);
      } catch {
        // im lặng bỏ qua lỗi mạng tạm thời, không làm phiền người dùng vì một badge
      }
    }

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [notificationsEndpoint]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside
      style={{
        width: 232,
        flex: "none",
        background: "var(--sidebar)",
        padding: "26px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 30,
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 19, textAlign: "center" }}>{brandLabel}</div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item) => {
          const badgeValue = item.badgeKey ? counts[item.badgeKey] : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span>{item.label}</span>
              {!!badgeValue && (
                <span
                  style={{
                    background: "var(--red)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 999,
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  {badgeValue > 99 ? "99+" : badgeValue}
                </span>
              )}
            </Link>
          );
        })}
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
