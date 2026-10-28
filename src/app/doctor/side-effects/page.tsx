'use client';

import { useEffect, useState } from 'react';

export default function DoctorSideEffectsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    setLoading(true);
    const res = await fetch('/api/doctor/side-effects');
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function updateStatus(reportId: string, status: string, ctcaeGrade?: number) {
    await fetch('/api/doctor/side-effects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status, ctcaeGrade })
    });
    loadReports();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Hàng đợi Xử trí Tác dụng Phụ</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Theo dõi và đánh giá phân độ CTCAE v5.0 từ báo cáo của bệnh nhân
        </div>
      </div>

      <div className='sec-card' style={{ padding: 20 }}>
        {loading ? (
          <div style={{ color: 'var(--ink-soft)', padding: 12 }}>Đang tải...</div>
        ) : reports.length === 0 ? (
          <div style={{ color: 'var(--ink-soft)', padding: 12 }}>Hiện không có báo cáo tác dụng phụ nào cần xử trí.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reports.map((r) => {
              const isUrgent = (r.ctcaeGrade && r.ctcaeGrade >= 3) || r.severity === 'Nặng';
              return (
                <div
                  key={r.id}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    padding: 16,
                    background: isUrgent && r.status === 'PENDING' ? 'var(--red-tint)' : '#fff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: 15 }}>{r.patient?.user?.name || 'Bệnh nhân'}</strong>
                      <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginLeft: 8 }}>
                        SĐT: {r.patient?.user?.phone || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span
                        className='pill'
                        style={{
                          background: isUrgent ? 'var(--red)' : 'var(--amber)',
                          color: '#fff'
                        }}
                      >
                        CTCAE Độ {r.ctcaeGrade || 1} ({r.severity || 'Nhẹ'})
                      </span>
                      <span
                        className='pill'
                        style={{
                          background: r.status === 'RESOLVED' ? 'var(--teal-tint)' : '#f0f0f0',
                          color: r.status === 'RESOLVED' ? 'var(--teal)' : 'var(--ink-soft)'
                        }}
                      >
                        {r.status === 'RESOLVED' ? 'Đã xử trí' : 'Chờ xử trí'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.5 }}>
                    <strong>Triệu chứng:</strong> {r.symptom}<br />
                    <strong>Vị trí xuất hiện:</strong> {r.site || 'Toàn thân'}<br />
                    <strong>Chu kỳ hóa trị:</strong> Chu kỳ {r.cycle || 1}<br />
                    <strong>Ghi chú từ bệnh nhân:</strong> {r.note || 'Không có'}<br />
                    <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      Thời gian báo cáo: {new Date(r.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  {r.photoSignedUrl && (
                    <a href={r.photoSignedUrl} target='_blank' rel='noreferrer' style={{ display: 'inline-block', marginTop: 10 }}>
                      <img src={r.photoSignedUrl} alt='Ảnh tác dụng phụ' style={{ maxWidth: 220, maxHeight: 180, borderRadius: 8, border: '1px solid var(--line)', objectFit: 'cover' }} />
                    </a>
                  )}

                  {r.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        type='button'
                        className='addbtn'
                        style={{ fontSize: 12 }}
                        onClick={() => updateStatus(r.id, 'RESOLVED')}
                      >
                        Đánh dấu Đã xử trí
                      </button>
                      <button
                        type='button'
                        className='ghostbtn'
                        style={{ fontSize: 12, color: 'var(--red)', borderColor: 'var(--red)' }}
                        onClick={() => updateStatus(r.id, 'PENDING', 3)}
                      >
                        Nâng lên CTCAE Độ 3 (Khẩn cấp)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}