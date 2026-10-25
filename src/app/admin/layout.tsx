import Sidebar from "@/components/Sidebar";

const items = [
  { href: "/admin", label: "Quản lý tài khoản" },
  { href: "/admin/catalog", label: "Danh mục" },
  { href: "/admin/permissions", label: "Ma trận phân quyền" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar brandLabel="Quản trị hệ thống" items={items} />
      <main style={{ flex: "1 1 0", minWidth: 0, padding: "32px 36px 60px", display: "flex", flexDirection: "column", gap: 22 }}>
        {children}
      </main>
    </div>
  );
}
