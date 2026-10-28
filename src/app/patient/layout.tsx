import Sidebar from "@/components/Sidebar";

const items = [
  { href: "/patient", label: "Dashboard" },
  { href: "/patient/record", label: "Hồ sơ bệnh án" },
  { href: "/patient/medications", label: "Thuốc và lịch uống" },
  { href: "/patient/side-effects", label: "Tác dụng phụ" },
  { href: "/patient/schedule", label: "Lịch" },
  { href: "/patient/messages", label: "Liên lạc" },
  { href: "/patient/education", label: "Thông tin giáo dục" },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar brandLabel="Cổng bệnh nhân" items={items} />
      <main style={{ flex: "1 1 0", minWidth: 0, padding: "32px 36px 60px", display: "flex", flexDirection: "column", gap: 22 }}>
        {children}
      </main>
    </div>
  );
}
