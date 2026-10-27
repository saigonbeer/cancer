export default function PatientEducationPage() {
  const articles = [
    {
      title: 'Chế độ dinh dưỡng trong quá trình hóa trị',
      tag: 'Dinh dưỡng',
      summary: 'Ăn chín uống sôi, chia nhỏ 5-6 bữa mỗi ngày, bổ sung đạm lành mạnh từ ức gà, cá, trứng và uống đủ 2 lít nước mỗi ngày.',
      tips: [
        'Tránh đồ tái sống, sushi, gỏi hoặc đồ lên men chưa tiệt trùng',
        'Nếu nhạt miệng, có thể dùng kẹo chanh gừng trước bữa ăn',
        'Không dùng thực phẩm chức năng lạ khi chưa hỏi ý kiến Bác sĩ'
      ]
    },
    {
      title: 'Cách giảm cảm giác buồn nôn và nôn ói',
      tag: 'Xử trí tác dụng phụ',
      summary: 'Uống thuốc chống nôn đúng giờ quy định của bác sĩ trước khi ăn, tránh mùi thức ăn chiên rán nặng dầu mỡ.',
      tips: [
        'Uống nước từng ngụm nhỏ, dùng trà gừng ấm hoặc nước chanh tươi',
        'Nghỉ ngơi đầu cao 30-45 phút sau khi ăn',
        'Thông báo với Bác sĩ nếu nôn quá 3 lần/ngày'
      ]
    },
    {
      title: 'Phòng ngừa nhiễm trùng khi bạch cầu giảm',
      tag: 'An toàn hóa trị',
      summary: 'Giai đoạn từ ngày thứ 7 đến ngày 14 sau truyền hóa chất, sức đề kháng cơ thể thường hạ thấp nhất.',
      tips: [
        'Đo nhiệt độ cơ thể 2 lần/ngày sáng và chiều',
        'Nếu sốt >= 38°C kèm run lạnh, cần đến viện ngay lập tức (không tự uống thuốc hạ sốt ở nhà)',
        'Đeo khẩu trang y tế và rửa tay sát khuẩn thường xuyên'
      ]
    },
    {
      title: 'Chăm sóc răng miệng và vết loét niêm mạc',
      tag: 'Chăm sóc bản thân',
      summary: 'Dùng bàn chải lông siêu mềm, súc miệng nước muối sinh lý 0.9% sau mỗi bữa ăn và trước khi ngủ.',
      tips: [
        'Tránh nước súc miệng có cồn vì gây xót rát niêm mạc',
        'Dùng kem bôi niêm mạc miệng theo chỉ định của bác sĩ điều trị'
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Cẩm Nang Giáo Dục & Dinh Dưỡng Ung Thư</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Hướng dẫn y khoa chuẩn mực hỗ trợ bệnh nhân và gia đình trong suốt liệu trình điều trị
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
        {articles.map((a, idx) => (
          <div key={idx} className='sec-card' style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className='pill' style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                {a.tag}
              </span>
            </div>

            <h2 style={{ fontSize: 16.5, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              {a.title}
            </h2>

            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              {a.summary}
            </div>

            <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Lời khuyên quan trọng:</div>
              {a.tips.map((t, tidx) => (
                <div key={tidx} style={{ fontSize: 12.5, color: 'var(--ink)', padding: '2px 0' }}>
                  • {t}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}