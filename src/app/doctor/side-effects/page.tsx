'use client';

import { useEffect, useState } from 'react';

const GRADES = [0, 1, 2, 3, 4, 5];

const thStyle: React.CSSProperties = {
  textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)',
  padding: '12px 14px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '14px', borderBottom: '1px solid var(--line-soft)', fontSize: 13.5, verticalAlign: 'top',
};

function severityStyle(severity?: string | null): React.CSSProperties {
  if (severity === 'Nặng') return { background: 'var(--red-tint)', color: 'var(--red)' };
  if (severity === 'Trung bình') return { background: 'var(--amber-tint)', color: 'var(--amber)' };
  return { background: 'var(--bg)', color: 'var(--ink-soft)' };
}

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

  async function updateStatus(reportId: string, status: string, ctcaeGrade?: number, doseReduced?: boolean) {
    await fetch('/api/doctor/side-effects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status, ctcaeGrade, doseReduced }),
    });
    loadReports();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Theo dõi tác dụng phụ</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Phân độ CTCAE, ghi xử trí, quyết định hoãn/giảm liều.
        </div>
      </div>

      <section className='sec-card'>
        <div className='sec-head' style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Báo cáo triệu chứng</h2>
          <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{reports.length} báo cáo</span>
        </div>

        {loading ? (
          <div style={{ color: 'var(--ink-soft)', padding: 22 }}>Đang tải...</div>
        ) : reports.length === 0 ? (
          <div style={{ color: 'var(--ink-soft)', padding: 22 }}>Hiện không có báo cáo tác dụng phụ nào.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Bệnh nhân</th>
                  <th style={thStyle}>Ngày</th>
                  <th style={thStyle}>Triệu chứng</th>
                  <th style={thStyle}>Tự đánh giá</th>
                  <th style={thStyle}>CTCAE</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={thStyle}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const resolved = r.status === 'RESOLVED';
                  return (
                    <tr key={r.id}>
                      <td style={tdStyle}>{r.patient?.user?.name || 'Bệnh nhân'}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{new Date(r.createdAt).toISOString().slice(0, 10)}</td>
                      <td style={tdStyle}>
                        <div>{r.symptom}</div>
                        {r.note && <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>&quot;{r.note}&quot;</div>}
                        {r.photoSignedUrl && (
                          <a href={r.photoSignedUrl} target='_blank' rel='noreferrer' style={{ display: 'inline-block', marginTop: 8 }}>
                            <img src={r.photoSignedUrl} alt='Ảnh tác dụng phụ' style={{ maxWidth: 140, maxHeight: 110, borderRadius: 8, border: '1px solid var(--line)', objectFit: 'cover' }} />
                          </a>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span className='pill' style={severityStyle(r.severity)}>{r.severity || 'Nhẹ'}</span>
                      </td>
                      <td style={tdStyle}>
                        <select
                          value={r.ctcaeGrade ?? ''}
                          onChange={(e) => updateStatus(r.id, r.status, Number(e.target.value))}
                          style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '6px 8px', fontSize: 13, background: '#fff' }}
                        >
                          <option value='' disabled>—</option>
                          {GRADES.filter((g) => g > 0).map((g) => (
                            <option key={g} value={g}>Độ {g}</option>
                          ))}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <span
                          className='pill'
                          style={resolved ? { background: 'var(--teal-tint)', color: 'var(--teal-deep)' } : { background: 'var(--amber-tint)', color: 'var(--amber)' }}
                        >
                          {resolved ? 'Đã xử trí' : 'Chờ xử trí'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {!resolved && (
                            <button type='button' className='addbtn' style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => updateStatus(r.id, 'RESOLVED')}>
                              Ghi xử trí
                            </button>
                          )}
                          <button
                            type='button'
                            className='ghostbtn'
                            style={{
                              fontSize: 12, padding: '7px 14px',
                              color: r.doseReduced ? 'var(--red)' : 'var(--ink-soft)',
                              borderColor: r.doseReduced ? 'var(--red)' : 'var(--line)',
                              background: r.doseReduced ? 'var(--red-tint)' : '#fff',
                            }}
                            onClick={() => updateStatus(r.id, r.status, undefined, !r.doseReduced)}
                          >
                            {r.doseReduced ? 'Đã giảm liều' : 'Giảm liều'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
