import Sidebar from "@/components/Sidebar";

const items = [
  { href: "/doctor", label: "Dashboard" },
  { href: "/doctor/patients", label: "Bệnh nhân" },
  { href: "/doctor/medications", label: "Thuốc" },
  { href: "/doctor/side-effects", label: "Tác dụng phụ" },
  { href: "/doctor/appointments", label: "Lịch hẹn" },
  { href: "/doctor/messages", label: "Liên lạc" },
  { href: "/doctor/reports", label: "Báo cáo" },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar brandLabel="Onco EMR" items={items} />
      <main style={{ flex: "1 1 0", minWidth: 0, padding: "32px 36px 60px", display: "flex", flexDirection: "column", gap: 22 }}>
        {children}
      </main>
    </div>
  );
}
