import Sidebar from "@/components/Sidebar";
import { UIFeedbackProvider } from "@/components/UIFeedback";

const items = [
  { href: "/doctor", label: "Dashboard" },
  { href: "/doctor/patients", label: "Bệnh nhân" },
  { href: "/doctor/medications", label: "Thuốc" },
  { href: "/doctor/side-effects", label: "Tác dụng phụ", badgeKey: "pendingAlerts" },
  { href: "/doctor/appointments", label: "Lịch hẹn", badgeKey: "pendingAppointments" },
  { href: "/doctor/messages", label: "Liên lạc", badgeKey: "unreadMessages" },
  { href: "/doctor/reports", label: "Báo cáo" },
  { href: "/doctor/profile", label: "Hồ sơ cá nhân" },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <UIFeedbackProvider>
      <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
        <Sidebar brandLabel="108|Future" items={items} notificationsEndpoint="/api/doctor/notifications" />
        <main style={{ flex: "1 1 0", minWidth: 0, padding: "32px 36px 60px", display: "flex", flexDirection: "column", gap: 22 }}>
          {children}
        </main>
      </div>
    </UIFeedbackProvider>
  );
}
