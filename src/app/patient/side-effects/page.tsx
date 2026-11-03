'use client';

import { useEffect, useState } from 'react';
import { gradeStyle, gradeLabel } from '@/lib/ctcaeGrade';

const COMMON_SYMPTOMS = ['Buồn nôn', 'Sốt', 'Mệt mỏi', 'Tiêu chảy', 'Táo bón', 'Đau', 'Ho', 'Viêm da', 'Chán ăn'];
const SEVERITIES = ['Nhẹ', 'Trung bình', 'Nặng'];

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('vi-VN');

function severityStyle(severity?: string | null) {
  if (severity === 'Nặng') return { background: 'var(--red-tint)', color: 'var(--red)' };
  if (severity === 'Trung bình') return { background: 'var(--amber-tint)', color: 'var(--amber)' };
  return { background: 'var(--teal-tint)', color: 'var(--teal-deep)' };
}

export default function PatientSideEffectsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [symptom, setSymptom] = useState(COMMON_SYMPTOMS[0]);
  const [symptomQuery, setSymptomQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; termVi: string; socVi: string | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [severity, setSeverity] = useState('Nhẹ');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/patient/side-effects', { cache: 'no-store' });
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!symptomQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch('/api/patient/ctcae?q=' + encodeURIComponent(symptomQuery.trim()));
      const data = await res.json().catch(() => ({ items: [] }));
      setSuggestions(data.items || []);
    }, 300);
    return () => clearTimeout(handle);
  }, [symptomQuery]);

  async function submit() {
    setError(null);
    setMessage(null);
    setSending(true);
    const form = new FormData();
    form.append('symptom', symptom);
    form.append('severity', severity);
    form.append('note', note.trim());
    if (photo) form.append('photo', photo);
    const res = await fetch('/api/patient/side-effects', { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data.error || 'Không gửi được báo cáo.');
      return;
    }
    setMessage('Đã gửi báo cáo cho bác sĩ.');
    setSeverity('Nhẹ');
    setNote('');
    setPhoto(null);
    load();
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px',
    fontSize: 14, fontFamily: 'inherit', background: '#fff',
  };

  return (
    <>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Theo dõi tác dụng phụ</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Ghi nhận triệu chứng và tự đánh giá mức độ.
        </div>
      </div>

      {/* Cảnh báo sớm bằng AI: hiển thị ở đầu trang */}
      <section className='sec-card'>
        <div className='sec-head' style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Cảnh báo sớm bằng AI</h2>
          <span className='pill' style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}>Gợi ý, chờ BS xác nhận</span>
        </div>
        <div style={{ padding: '16px 22px', fontSize: 14, color: 'var(--ink-soft)' }}>
          Chưa có cảnh báo nào. Khi hệ thống phát hiện xu hướng bất thường từ các báo cáo của bạn, gợi ý sẽ hiển thị tại đây và chờ bác sĩ xác nhận.
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, alignItems: 'start' }}>
        {/* Form ghi nhận */}
        <section className='sec-card'>
          <div className='sec-head' style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Ghi nhận triệu chứng mới</h2>
          </div>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className='field-label'>Triệu chứng đang chọn: <strong style={{ color: 'var(--teal-deep)' }}>{symptom}</strong></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {COMMON_SYMPTOMS.map((s) => (
                  <button
                    key={s}
                    type='button'
                    onClick={() => { setSymptom(s); setSymptomQuery(''); setShowSuggestions(false); }}
                    className='pill'
                    style={{
                      cursor: 'pointer', border: 'none',
                      background: symptom === s ? 'var(--teal)' : 'var(--bg)',
                      color: symptom === s ? '#fff' : 'var(--ink-soft)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type='text'
                  value={symptomQuery}
                  onChange={(e) => { setSymptomQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder='Hoặc tìm trong danh mục 850 triệu chứng (VD: tê bì, rụng tóc...)'
                  style={fieldStyle}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4,
                    background: '#fff', border: '1px solid var(--line)', borderRadius: 8, maxHeight: 220, overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}>
                    {suggestions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => { setSymptom(s.termVi); setSymptomQuery(''); setShowSuggestions(false); setSuggestions([]); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13.5, borderBottom: '1px solid var(--line-soft)' }}
                      >
                        <div style={{ fontWeight: 600 }}>{s.termVi}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{s.socVi}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
              <div>
                <label className='field-label'>Mức độ tự đánh giá</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={fieldStyle}>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className='field-label'>Ghi chú (tuỳ chọn)</label>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder='Mô tả thêm...' style={{ ...fieldStyle, resize: 'vertical' }} />
            </div>

            <div>
              <label className='field-label'>Đính kèm ảnh</label>
              <input
                type='file'
                accept='image/jpeg,image/png,image/webp'
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                style={{ fontSize: 13 }}
              />
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: 'var(--ink-soft)' }}>
              Mức tự đánh giá không thay thế phân độ CTCAE do bác sĩ thực hiện.
            </div>

            {error && <div style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>}
            {message && <div style={{ color: 'var(--teal-deep)', fontSize: 13, fontWeight: 600 }}>{message}</div>}

            <div>
              <button type='button' className='addbtn' onClick={submit} disabled={sending}>
                {sending ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        </section>

        {/* Lịch sử triệu chứng */}
        <section className='sec-card'>
          <div className='sec-head' style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Lịch sử triệu chứng</h2>
          </div>
          {loading && <div style={{ padding: 22, color: 'var(--ink-soft)' }}>Đang tải...</div>}
          {!loading && reports.length === 0 && (
            <div style={{ padding: 22, color: 'var(--ink-soft)' }}>Bạn chưa báo cáo tác dụng phụ nào.</div>
          )}
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reports.map((r) => {
              const resolved = r.status === 'RESOLVED';
              return (
                <div key={r.id} style={{ border: '1px solid var(--line-soft)', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{r.symptom}</div>
                    <span className='pill' style={severityStyle(r.severity)}>{r.severity || 'Nhẹ'}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>
                    {fmtDate(r.createdAt)}
                  </div>
                  {r.note && <div style={{ fontSize: 13.5, marginTop: 6 }}>&quot;{r.note}&quot;</div>}
                  {r.photoSignedUrl && (
                    <a href={r.photoSignedUrl} target='_blank' rel='noreferrer' style={{ display: 'inline-block', marginTop: 8 }}>
                      <img src={r.photoSignedUrl} alt='Ảnh đã gửi' style={{ maxWidth: 180, maxHeight: 140, borderRadius: 8, border: '1px solid var(--line)', objectFit: 'cover' }} />
                    </a>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                    <span className='pill' style={gradeStyle(r.ctcaeGrade)}>{gradeLabel(r.ctcaeGrade)}</span>
                    <span
                      className='pill'
                      style={resolved ? { background: 'var(--teal-tint)', color: 'var(--teal-deep)' } : { background: 'var(--bg)', color: 'var(--ink-soft)' }}
                    >
                      {resolved ? 'Đã xử trí' : 'Đã gửi'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
