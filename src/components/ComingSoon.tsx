export default function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", color: "var(--teal)", textTransform: "uppercase" }}>
          Khoa Xạ trị &amp; Ung bướu
        </div>
        <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 700 }}>{title}</h1>
      </div>
      <div className="sec-card" style={{ padding: 22, fontSize: 14, color: "var(--ink-soft)" }}>
        {note || "Module này đang được xây dựng theo lộ trình trong PLAN.md."}
      </div>
    </>
  );
}
