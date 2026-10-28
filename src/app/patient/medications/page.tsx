'use client';

import { useEffect, useMemo, useState } from 'react';

type Tab = 'today' | 'rx';
type Status = 'pending' | 'taken' | 'missed';

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('vi-VN');

function activeDays(duration?: string | null): number | null {
  const m = (duration || '').match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function isActiveToday(prescribedAt: string, duration?: string | null) {
  const start = new Date(prescribedAt);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (today < start) return false;
  const days = activeDays(duration);
  if (days === null) return true;
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return today < end;
}

function timesOf(reminderTimes?: string | null) {
  const list = (reminderTimes || '').split(',').map((t) => t.trim()).filter(Boolean);
  return list.length > 0 ? list : ['08:00'];
}

export default function PatientMedicationsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('today');
  // Trạng thái uống thuốc chỉ giữ trên trang này, chưa lưu lên máy chủ.
  const [status, setStatus] = useState<Record<string, Status>>({});

  async function load() {
    setLoading(true);
    const res = await fetch('/api/patient/medications', { cache: 'no-store' });
    const data = await res.json();
    setPrescriptions(data.prescriptions || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const doses = useMemo(() => {
    const list: Array<{ key: string; time: string; name: string; dose: string }> = [];
    for (const pr of prescriptions) {
      for (const it of pr.items || []) {
        if (!isActiveToday(pr.prescribedAt, it.duration)) continue;
        for (const time of timesOf(it.reminderTimes)) {
          list.push({
            key: `${it.id}-${time}`,
            time,
            name: it.drugName,
            dose: [it.dose, it.unit].filter(Boolean).join(' ') + (it.frequency ? ' • ' + it.frequency : ''),
          });
        }
      }
    }
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [prescriptions]);

  const takenCount = doses.filter((d) => status[d.key] === 'taken').length;
  const missedCount = doses.filter((d) => status[d.key] === 'missed').length;
  const pendingCount = doses.length - takenCount - missedCount;
  const adherence = doses.length > 0 ? Math.round((takenCount / doses.length) * 100) : 0;

  const tabStyle = (on: boolean): React.CSSProperties => ({
    border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, padding: '12px 4px', cursor: 'pointer',
    borderBottom: on ? '3px solid var(--teal)' : '3px solid transparent', color: on ? 'var(--teal-deep)' : 'var(--ink-soft)',
  });

  const stat = (label: string, value: React.ReactNode, color?: string) => (
    <div className='sec-card' style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || 'var(--ink)' }}>{value}</div>
    </div>
  );

  return (
    <>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--teal)', textTransform: 'uppercase' }}>Khoa Xạ trị &amp; Ung bướu</div>
        <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700 }}>Thuốc</h1>
      </div>

      <div style={{ display: 'flex', gap: 26, borderBottom: '1px solid var(--line)' }}>
        <button type='button' style={tabStyle(tab === 'today')} onClick={() => setTab('today')}>Thuốc uống hôm nay</button>
        <button type='button' style={tabStyle(tab === 'rx')} onClick={() => setTab('rx')}>Đơn thuốc</button>
      </div>

      {loading && <div className='sec-card' style={{ padding: 20, color: 'var(--ink-soft)' }}>Đang tải...</div>}

      {!loading && tab === 'today' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14 }}>
            {stat('Tuân thủ uống thuốc', adherence + '%', 'var(--teal-deep)')}
            {stat('Đã uống', takenCount)}
            {stat('Bỏ lỡ', missedCount, 'var(--red)')}
            {stat('Chờ uống', pendingCount, 'var(--amber)')}
            {stat('Lịch uống thuốc', doses.length + ' liều')}
          </div>

          <section className='sec-card'>
            <div className='sec-head'><h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Lịch uống thuốc hôm nay</h2></div>
            {doses.length === 0 && <div style={{ padding: 22, color: 'var(--ink-soft)' }}>Hôm nay bạn không có thuốc cần uống.</div>}
            {doses.map((d) => {
              const st = status[d.key] || 'pending';
              return (
                <div key={d.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '14px 22px', borderBottom: '1px solid var(--line-soft)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{d.time} · {d.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>{d.dose}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type='button'
                      onClick={() => setStatus({ ...status, [d.key]: 'taken' })}
                      style={{ border: '1px solid ' + (st === 'taken' ? 'var(--teal)' : 'var(--line)'), background: st === 'taken' ? 'var(--teal-tint)' : '#fff', color: st === 'taken' ? 'var(--teal-deep)' : 'var(--ink-soft)', borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Đã uống
                    </button>
                    <button
                      type='button'
                      onClick={() => setStatus({ ...status, [d.key]: 'missed' })}
                      style={{ border: '1px solid ' + (st === 'missed' ? 'var(--red)' : 'var(--line)'), background: st === 'missed' ? 'var(--red-tint)' : '#fff', color: st === 'missed' ? 'var(--red)' : 'var(--ink-soft)', borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Bỏ lỡ
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      )}

      {!loading && tab === 'rx' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {prescriptions.length === 0 && <div className='sec-card' style={{ padding: 22, color: 'var(--ink-soft)' }}>Bạn chưa có đơn thuốc nào.</div>}
          {prescriptions.map((pr) => (
            <section key={pr.id} className='sec-card'>
              <div className='sec-head' style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Đơn thuốc ngày {fmtDate(pr.prescribedAt)}</h2>
                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Kê bởi {pr.prescribedBy || 'Bác sĩ điều trị'}</span>
              </div>
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(pr.items || []).map((it: any, idx: number) => (
                  <div key={it.id} style={{ border: '1px solid var(--line-soft)', borderRadius: 10, padding: 14, background: 'var(--bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--teal-deep)' }}>{idx + 1}. {it.drugName}</div>
                      <span className='pill' style={{ background: 'var(--teal-tint)', color: 'var(--teal-deep)' }}>
                        {it.duration || 'Theo hướng dẫn'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 10, fontSize: 13 }}>
                      <div><div style={{ color: 'var(--ink-soft)', fontWeight: 600, fontSize: 12 }}>Liều</div>{[it.dose, it.unit].filter(Boolean).join(' ') || '—'}</div>
                      <div><div style={{ color: 'var(--ink-soft)', fontWeight: 600, fontSize: 12 }}>Tần suất</div>{it.frequency || '—'}</div>
                      <div><div style={{ color: 'var(--ink-soft)', fontWeight: 600, fontSize: 12 }}>Số lượng</div>{it.quantity || '—'}</div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ color: 'var(--ink-soft)', fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Uống theo giờ mỗi ngày</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {timesOf(it.reminderTimes).map((t) => (
                          <span key={t} className='chk-pill on'>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
