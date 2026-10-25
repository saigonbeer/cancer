import { getCurrentSession } from "@/lib/auth";

export default async function PatientDashboard() {
  const session = await getCurrentSession();
  return (
    <>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", color: "var(--teal)", textTransform: "uppercase" }}>
          Khoa Xạ trị &amp; Ung bướu
        </div>
        <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 700 }}>Chào {session?.name}</h1>
      </div>
      <div className="sec-card" style={{ padding: 22, fontSize: 14, color: "var(--ink-soft)" }}>
        Module Dashboard (chu kỳ hóa trị tiếp theo, thuốc hôm nay, tuân thủ thuốc, tác dụng phụ) đang được xây dựng theo PLAN.md.
      </div>
    </>
  );
}
