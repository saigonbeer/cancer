'use client';

import { useEffect, useState } from 'react';

export default function PatientSideEffectsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState('Nhẹ');
  const [site, setSite] = useState('');
  const [cycle, setCycle] = useState('1');
  const [note, setNote] = useState('');

  async function loadReports() {
    setLoading(true);
    const res = await fetch('/api/patient/side-effects');
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleSubmit() {
    if (!symptom.trim()) return;
    const res = await fetch('/api/patient/side-effects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptom,
        severity,
        site,
        cycle: parseInt(cycle) || 1,
        note
      })
    });
    if (res.ok) {
      setShowModal(false);
      setSymptom('');
      setNote('');
      loadReports();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Theo dõi Tác dụng Phụ Sau Điều trị</h1>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
            Báo cáo kịp thời cho Bác sĩ điều trị khi có triệu chứng bất thường (buồn nôn, sốt, rụng tóc, tê bì...)
          </div>
        </div>
        <button type='button' className='addbtn' onClick={() => setShowModal(true)}>
          + Gửi Báo cáo Triệu chứng Mới
        </button>
      </div>

      <div className='sec-card' style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0' }}>Lịch sử Báo cáo của Bạn</h2>
        {loading ? (
          <div style={{ color: 'var(--ink-soft)' }}>Đang tải...</div>
        ) : reports.length === 0 ? (
          <div style={{ color: 'var(--ink-soft)' }}>Bạn chưa có báo cáo tác dụng phụ nào.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reports.map((r) => (
              <div
                key={r.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: 16,
                  background: r.severity === 'Nặng' ? 'var(--red-tint)' : '#fff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>
                    {r.symptom} (Chu kỳ {r.cycle || 1})
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span
                      className='pill'
                      style={{
                        background: r.severity === 'Nặng' ? 'var(--red)' : 'var(--amber)',
                        color: '#fff'
                      }}
                    >
                      Mức độ: {r.severity || 'Nhẹ'}
                    </span>
                    <span
                      className='pill'
                      style={{
                        background: r.status === 'RESOLVED' ? 'var(--teal-tint)' : '#f0f0f0',
                        color: r.status === 'RESOLVED' ? 'var(--teal)' : 'var(--ink-soft)'
                      }}
                    >
                      {r.status === 'RESOLVED' ? 'Bác sĩ đã xử trí' : 'Đang chờ bác sĩ xem'}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-soft)' }}>
                  Vị trí: {r.site || 'Toàn thân'} • Thời gian gửi: {new Date(r.createdAt).toLocaleString('vi-VN')}
                </div>
                {r.note && (
                  <div style={{ marginTop: 6, fontSize: 13, background: 'var(--bg)', padding: 8, borderRadius: 6 }}>
                    Ghi chú: {r.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className='sec-card' style={{ width: 500, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>Gửi Báo Cáo Tác Dụng Phụ</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className='field-label'>Triệu chứng gặp phải</label>
                <input
                  type='text'
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  placeholder='VD: Buồn nôn, mệt mỏi, phát ban, tiêu chảy...'
                />
              </div>

              <div>
                <label className='field-label'>Mức độ cảm nhận</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)' }}
                >
                  <option value='Nhẹ'>Nhẹ (Chưa ảnh hưởng nhiều sinh hoạt)</option>
                  <option value='Trung bình'>Trung bình (Ảnh hưởng ăn uống, sinh hoạt)</option>
                  <option value='Nặng'>Nặng (Rất khó chịu, sốt cao, cần cấp cứu ngay)</option>
                </select>
              </div>

              <div>
                <label className='field-label'>Vị trí triệu chứng</label>
                <input type='text' value={site} onChange={(e) => setSite(e.target.value)} placeholder='VD: Bụng, da tay chân, miệng...' />
              </div>

              <div>
                <label className='field-label'>Chu kỳ hóa trị vừa truyền</label>
                <input type='text' value={cycle} onChange={(e) => setCycle(e.target.value)} placeholder='1' />
              </div>

              <div>
                <label className='field-label'>Mô tả chi tiết thêm</label>
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder='Bắt đầu từ khi nào, đã uống thuốc giảm đau hay chưa...' />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type='button' className='ghostbtn' onClick={() => setShowModal(false)}>Hủy</button>
                <button type='button' className='addbtn' onClick={handleSubmit}>Gửi Báo Cáo Cho Bác Sĩ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}