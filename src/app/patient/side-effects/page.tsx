'use client';

import { useEffect, useMemo, useState } from 'react';

const SEVERITIES = ['Nhẹ', 'Trung bình', 'Nặng'];

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('vi-VN');

function gradeStyle(grade?: number | null, severity?: string | null) {
  const g = grade ?? (severity === 'Nặng' ? 3 : severity === 'Trung bình' ? 2 : 1);
  if (g >= 3) return { bg: 'var(--red-tint)', fg: 'var(--red)', label: 'Nặng' };
  if (g === 2) return { bg: 'var(--amber-tint)', fg: 'var(--amber)', label: 'Trung bình' };
  return { bg: 'var(--teal-tint)', fg: 'var(--teal-deep)', label: 'Nhẹ' };
}

function weekStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

export default function PatientSideEffectsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState('Nhẹ');
  const [site, setSite] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  const stats = useMemo(() => {
    const total = reports.length;
    const severe = reports.filter((r) => (r.ctcaeGrade ?? 0) >= 3 || r.severity === 'Nặng').length;
    const counts: Record<string, number> = {};
    reports.forEach((r) => { counts[r.symptom] = (counts[r.symptom] || 0) + 1; });
    const types = Object.keys(counts).length;
    const common = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || '—';
    return { total, severe, types, common };
  }, [reports]);

  const weekly = useMemo(() => {
    const now = new Date();
    const thisWeek = weekStart(now);
    const buckets = [3, 2, 1, 0].map((back) => {
      const start = new Date(thisWeek.getTime() - back * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      const count = reports.filter((r) => {
        const t = new Date(r.createdAt).getTime();
        return t >= start.getTime() && t < end.getTime();
      }).length;
      return { label: back === 0 ? 'Tuần này' : `Tuần -${back}`, count };
    });
    const max = Math.max(1, ...buckets.map((b) => b.count));
    return buckets.map((b) => ({ ...b, pct: Math.round((b.count / max) * 100) }));
  }, [reports]);

  async function submit() {
    setError(null);
    setMessage(null);
    if (!symptom.trim()) {
      setError('Vui lòng nhập triệu chứng.');
      return;
    }
    const res = await fetch('/api/patient/side-effects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptom: symptom.trim(), severity, site: site.trim(), note: note.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Không gửi được báo cáo.');
      return;
    }
    setMessage('Đã gửi báo cáo cho bác sĩ.');
    setFormOpen(false);
    setSymptom('');
    setSite('');
    setNote('');
    setSeverity('Nhẹ');
    load();
  }

  const sevButton = (label: string) => {
    const on = severity === label;
    const color = label === 'Nặng' ? 'var(--red)' : label === 'Trung bình' ? 'var(--amber)' : 'var(--teal)';
    const bg = label === 'Nặng' ? 'var(--red-tint)' : label === 'Trung bình' ? 'var(--amber-tint)' : 'var(--teal-tint)';
    return (
      <button
        key={label}
        type='button'
        onClick={() => setSeverity(label)}
        style={{ border: '1px solid ' + (on ? color : 'var(--line)'), background: on ? bg : '#fff', color: on ? color : 'var(--ink-soft)', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--teal)', textTransform: 'uppercase' }}>Khoa Xạ trị &amp; Ung bướu</div>
        <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700 }}>Tác dụng phụ</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14 }}>
        <div className='sec-card' style={{ padding: '16px 18px' }}><div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>Tổng số tác dụng phụ</div><div style={{ fontSize: 24, fontWeight: 700 }}>{stats.total}</div></div>
        <div className='sec-card' style={{ padding: '16px 18px' }}><div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>Mức nặng</div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--red)' }}>{stats.severe}</div></div>
        <div className='sec-card' style={{ padding: '16px 18px' }}><div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>Loại triệu chứng</div><div style={{ fontSize: 24, fontWeight: 700 }}>{stats.types}</div></div>
        <div className='sec-card' style={{ padding: '16px 18px' }}><div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>Triệu chứng phổ biến</div><div style={{ fontSize: 17, fontWeight: 700 }}>{stats.common}</div></div>
        <button type='button' onClick={() => setFormOpen(!formOpen)} style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 18px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>+ Nhập tác dụng phụ mới</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Báo cáo cho bác sĩ</div>
        </button>
      </div>

      {message && <div style={{ color: 'var(--teal-deep)', fontSize: 13.5, fontWeight: 600 }}>{message}</div>}

      {formOpen && (
        <section className='sec-card'>
          <div className='sec-head'><h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Báo cáo tác dụng phụ mới</h2></div>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className='field-label'>Triệu chứng</label>
              <input type='text' value={symptom} onChange={(e) => setSymptom(e.target.value)} placeholder='Ví dụ: Buồn nôn, viêm da, mệt mỏi...' />
            </div>
            <div>
              <label className='field-label'>Mức độ</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{SEVERITIES.map(sevButton)}</div>
            </div>
            <div>
              <label className='field-label'>Vị trí</label>
              <input type='text' value={site} onChange={(e) => setSite(e.target.value)} placeholder='Ví dụ: Vùng cổ, khoang miệng...' />
            </div>
            <div>
              <label className='field-label'>Hình ảnh</label>
              <div style={{ border: '1.5px dashed var(--line)', borderRadius: 10, padding: 20, textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>
                Tải ảnh lên sẽ được bổ sung sau (chưa hỗ trợ)
              </div>
            </div>
            <div>
              <label className='field-label'>Ghi chú</label>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder='Mô tả thêm cho bác sĩ...' style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: 14 }} />
            </div>
            {error && <div style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type='button' className='addbtn' onClick={submit}>Gửi báo cáo cho bác sĩ</button>
            </div>
          </div>
        </section>
      )}

      <section className='sec-card'>
        <div className='sec-head'><h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Lịch sử đã báo cáo</h2></div>
        {loading && <div style={{ padding: 22, color: 'var(--ink-soft)' }}>Đang tải...</div>}
        {!loading && reports.length === 0 && <div style={{ padding: 22, color: 'var(--ink-soft)' }}>Bạn chưa báo cáo tác dụng phụ nào.</div>}
        {reports.map((r) => {
          const g = gradeStyle(r.ctcaeGrade, r.severity);
          return (
            <div key={r.id} style={{ display: 'flex', gap: 14, padding: '14px 22px', borderBottom: '1px solid var(--line-soft)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.symptom}</div>
                  <span className='pill' style={{ background: g.bg, color: g.fg }}>{r.severity || g.label}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 3 }}>
                  Vị trí: {r.site || 'Chưa ghi'} · {fmtDate(r.createdAt)} · {r.status === 'PENDING' ? 'Chờ bác sĩ xem' : 'Bác sĩ đã xử lý'}
                </div>
                {r.note && <div style={{ fontSize: 13.5, marginTop: 4 }}>{r.note}</div>}
              </div>
            </div>
          );
        })}
      </section>

      <section className='sec-card'>
        <div className='sec-head'><h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Biểu đồ tác dụng phụ theo tuần</h2></div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {weekly.map((w) => (
            <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 90, fontSize: 13.5 }}>{w.label}</span>
              <div style={{ flex: 1, height: 10, borderRadius: 999, background: 'var(--line-soft)', overflow: 'hidden' }}>
                <div style={{ width: w.pct + '%', height: '100%', borderRadius: 999, background: 'var(--teal)' }} />
              </div>
              <span className='pill' style={{ background: 'var(--teal-tint)', color: 'var(--teal-deep)' }}>{w.count}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
