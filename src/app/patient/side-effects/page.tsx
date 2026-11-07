'use client';

import { useEffect, useState } from 'react';
import { gradeStyle, gradeLabel } from '@/lib/ctcaeGrade';

const SEVERITIES = ['Nhẹ', 'Trung bình', 'Nặng'];

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('vi-VN');

function severityStyle(severity?: string | null) {
  if (severity === 'Nặng') return { background: 'var(--red-tint)', color: 'var(--red)' };
  if (severity === 'Trung bình') return { background: 'var(--amber-tint)', color: 'var(--amber)' };
  return { background: 'var(--teal-tint)', color: 'var(--teal-deep)' };
}

const ALERT_SEVERITY_STYLE: Record<string, React.CSSProperties> = {
  HIGH: { background: 'var(--red-tint)', color: 'var(--red)' },
  MEDIUM: { background: 'var(--amber-tint)', color: 'var(--amber)' },
  LOW: { background: 'var(--bg)', color: 'var(--ink-soft)' },
};
const ALERT_SEVERITY_LABEL: Record<string, string> = { HIGH: 'Mức cao', MEDIUM: 'Mức trung bình', LOW: 'Mức thấp' };
const ALERT_STATUS_LABEL: Record<string, string> = { PENDING: 'Chờ bác sĩ xác nhận', CONFIRMED: 'Bác sĩ đã xác nhận', DISMISSED: 'Bác sĩ đã xem, không đáng ngại' };

export default function PatientSideEffectsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const [groups, setGroups] = useState<string[]>([]);
  const [group, setGroup] = useState('');
  const [locations, setLocations] = useState<{ id: string; termVi: string; socVi: string | null }[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [location, setLocation] = useState('');
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
    fetch('/api/patient/ctcae/groups')
      .then((r) => r.json())
      .then((data) => setGroups(data.groups || []));
    setAlertsLoading(true);
    fetch('/api/patient/alerts', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setAlerts((data.alerts || []).filter((a: any) => a.status !== 'DISMISSED')))
      .finally(() => setAlertsLoading(false));
  }, []);

  useEffect(() => {
    setLocation('');
    setLocations([]);
    if (!group) return;
    setLoadingLocations(true);
    fetch('/api/patient/ctcae?soc=' + encodeURIComponent(group))
      .then((r) => r.json())
      .then((data) => setLocations(data.items || []))
      .finally(() => setLoadingLocations(false));
  }, [group]);

  async function submit() {
    setError(null);
    setMessage(null);
    if (!group || !location) {
      setError('Vui lòng chọn Khu vực ảnh hưởng và Vị trí ảnh hưởng.');
      return;
    }
    setSending(true);
    const form = new FormData();
    form.append('symptom', location);
    form.append('site', group);
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
    setGroup('');
    setLocation('');
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
        {alertsLoading ? (
          <div style={{ padding: '16px 22px', fontSize: 14, color: 'var(--ink-soft)' }}>Đang tải...</div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '16px 22px', fontSize: 14, color: 'var(--ink-soft)' }}>
            Chưa có cảnh báo nào. Khi hệ thống phát hiện xu hướng bất thường từ các báo cáo của bạn, gợi ý sẽ hiển thị tại đây và chờ bác sĩ xác nhận.
          </div>
        ) : (
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map((a) => (
              <div key={a.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className='pill' style={ALERT_SEVERITY_STYLE[a.severity] || {}}>{ALERT_SEVERITY_LABEL[a.severity] || a.severity}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{ALERT_STATUS_LABEL[a.status] || a.status}</span>
                </div>
                <div style={{ fontSize: 13.5, marginTop: 6 }}>{a.message}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, alignItems: 'start' }}>
        {/* Form ghi nhận */}
        <section className='sec-card'>
          <div className='sec-head' style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Ghi nhận triệu chứng mới</h2>
          </div>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <div>
                <label className='field-label'>Khu vực ảnh hưởng</label>
                <select value={group} onChange={(e) => setGroup(e.target.value)} style={fieldStyle}>
                  <option value=''>Chọn khu vực...</option>
                  {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className='field-label'>Vị trí ảnh hưởng</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={!group || loadingLocations}
                  style={fieldStyle}
                >
                  <option value=''>{!group ? 'Chọn khu vực trước' : loadingLocations ? 'Đang tải...' : 'Chọn vị trí...'}</option>
                  {locations.map((l) => <option key={l.id} value={l.termVi}>{l.termVi}</option>)}
                </select>
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
              <label className='field-label'>Mô tả (tuỳ chọn)</label>
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
            {reports.slice(0, visibleCount).map((r) => {
              const resolved = r.status === 'RESOLVED';
              return (
                <div key={r.id} style={{ border: '1px solid var(--line-soft)', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{r.symptom}</div>
                    {r.ctcaeGrade ? (
                      <span className='pill' style={gradeStyle(r.ctcaeGrade)}>{gradeLabel(r.ctcaeGrade)}</span>
                    ) : (
                      <span className='pill' style={severityStyle(r.severity)}>{r.severity || 'Nhẹ'} (tự đánh giá)</span>
                    )}
                  </div>
                  {r.site && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{r.site}</div>}
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>
                    {fmtDate(r.createdAt)}
                    {r.photoSignedUrl && <span title='Có ảnh đính kèm'> · 📷</span>}
                  </div>
                  {r.note && <div style={{ fontSize: 13.5, marginTop: 6 }}>&quot;{r.note}&quot;</div>}
                  {r.photoSignedUrl && (
                    <a href={r.photoSignedUrl} target='_blank' rel='noreferrer' style={{ display: 'inline-block', marginTop: 8 }}>
                      <img src={r.photoSignedUrl} alt='Ảnh đã gửi' style={{ maxWidth: 180, maxHeight: 140, borderRadius: 8, border: '1px solid var(--line)', objectFit: 'cover' }} />
                    </a>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
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
            {visibleCount < reports.length && (
              <div style={{ textAlign: 'center' }}>
                <button type='button' className='ghostbtn' onClick={() => setVisibleCount((n) => n + 20)}>
                  Tải thêm ({reports.length - visibleCount} báo cáo còn lại)
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
