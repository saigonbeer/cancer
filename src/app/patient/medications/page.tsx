'use client';

import { useEffect, useState } from 'react';

type DoseStatus = 'TAKEN' | 'MISSED' | null;

type ActiveItem = {
  id: string;
  drugName: string;
  dose: string | null;
  unit: string | null;
  frequency: string | null;
  times: string[];
  takenQuantity: number;
  totalQuantity: number | null;
};

type TodayDose = {
  itemId: string;
  drugName: string;
  dose: string;
  time: string;
  scheduledAt: string;
  status: DoseStatus;
  due: boolean;
};

type HistoryRow = { id: string; scheduledAt: string; drugName: string; status: 'TAKEN' | 'MISSED' };

type MedicationView = {
  activeItems: ActiveItem[];
  today: TodayDose[];
  adherence: { taken: number; expected: number; percent: number | null };
  history: HistoryRow[];
};

const EMPTY: MedicationView = { activeItems: [], today: [], adherence: { taken: 0, expected: 0, percent: null }, history: [] };

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const card: React.CSSProperties = { background: '#fff' };

function StatusPill({ status }: { status: 'TAKEN' | 'MISSED' }) {
  const taken = status === 'TAKEN';
  return (
    <span
      className='pill'
      style={{
        background: taken ? 'var(--teal-tint)' : 'var(--red-tint)',
        color: taken ? 'var(--teal-deep)' : 'var(--red)',
      }}
    >
      ● {taken ? 'Đã uống' : 'Bỏ lỡ'}
    </span>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)',
  padding: '10px 14px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = { padding: '12px 14px', borderBottom: '1px solid var(--line-soft)', fontSize: 13.5, verticalAlign: 'middle' };

export default function PatientMedicationsPage() {
  const [view, setView] = useState<MedicationView>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/patient/medications', { cache: 'no-store' });
    const data = await res.json();
    if (res.ok) {
      setView({ ...EMPTY, ...data });
    } else {
      setView(EMPTY);
      setError('Không tải được dữ liệu thuốc. Vui lòng thử lại sau.');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function record(dose: TodayDose, status: 'TAKEN' | 'MISSED') {
    const key = `${dose.itemId}|${dose.scheduledAt}`;
    setSaving(key);
    setError(null);
    const res = await fetch('/api/patient/medications/doses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: dose.itemId, scheduledAt: dose.scheduledAt, status }),
    });
    setSaving(null);
    if (!res.ok) {
      setError('Không ghi nhận được. Vui lòng thử lại.');
      return;
    }
    await load();
  }

  const takenToday = view.today.filter((d) => d.status === 'TAKEN').length;

  return (
    <>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Quản lý thuốc &amp; nhắc uống thuốc</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Xác nhận liều, theo dõi tuần thủ. Hôm nay đã uống {takenToday}/{view.today.length} liều.
        </div>
      </div>

      {error && <div className='sec-card' style={{ ...card, padding: 14, color: 'var(--red)' }}>{error}</div>}

      {/* Đơn thuốc hiện hành */}
      <section className='sec-card'>
        <div className='sec-head' style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Đơn thuốc hiện hành</h2>
        </div>
        {loading ? (
          <div style={{ padding: 22, color: 'var(--ink-soft)' }}>Đang tải...</div>
        ) : view.activeItems.length === 0 ? (
          <div style={{ padding: 22, color: 'var(--ink-soft)' }}>Hiện bạn không có thuốc đang dùng.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Thuốc</th>
                  <th style={thStyle}>Liều/lần</th>
                  <th style={thStyle}>Số lần/ngày</th>
                  <th style={thStyle}>Giờ dùng</th>
                  <th style={thStyle}>Cách dùng</th>
                  <th style={thStyle}>Đã uống / tổng số lượng</th>
                </tr>
              </thead>
              <tbody>
                {view.activeItems.map((it) => (
                  <tr key={it.id}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{it.drugName}</td>
                    <td style={tdStyle}>{[it.dose, it.unit].filter(Boolean).join(' ') || '—'}</td>
                    <td style={tdStyle}>{it.times.length} lần/ngày</td>
                    <td style={{ ...tdStyle, fontFamily: 'ui-monospace, monospace' }}>{it.times.join(', ')}</td>
                    <td style={tdStyle}>{it.frequency || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {it.takenQuantity}/{it.totalQuantity ?? '—'}
                      {it.unit ? ` ${it.unit}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, alignItems: 'start' }}>
        {/* Xác nhận liều hôm nay */}
        <section className='sec-card'>
          <div className='sec-head' style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Xác nhận liều hôm nay</h2>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!loading && view.today.length === 0 && (
              <div style={{ color: 'var(--ink-soft)', padding: 6 }}>Hôm nay bạn không có liều nào cần xác nhận.</div>
            )}
            {view.today.map((d) => {
              const key = `${d.itemId}|${d.scheduledAt}`;
              return (
                <div
                  key={key}
                  style={{ border: '1px solid var(--line-soft)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.drugName}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2, fontFamily: 'ui-monospace, monospace' }}>
                      {fmtDate(d.scheduledAt)} {d.time}
                      {d.dose ? ` · ${d.dose}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {d.status ? (
                      <StatusPill status={d.status} />
                    ) : d.due ? (
                      <>
                        <button
                          type='button'
                          className='addbtn'
                          style={{ fontSize: 12, padding: '6px 12px' }}
                          disabled={saving === key}
                          onClick={() => record(d, 'TAKEN')}
                        >
                          Đã uống
                        </button>
                        <button
                          type='button'
                          className='ghostbtn'
                          style={{ fontSize: 12, padding: '6px 12px', color: 'var(--red)', borderColor: 'var(--red)' }}
                          disabled={saving === key}
                          onClick={() => record(d, 'MISSED')}
                        >
                          Bỏ lỡ
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Chưa đến giờ</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tỷ lệ tuân thủ + lịch sử */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className='sec-card'>
            <div className='sec-head'>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Tỷ lệ tuân thủ</h2>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--teal-deep)' }}>
                {view.adherence.percent === null ? '—' : `${view.adherence.percent}%`}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                Tuần này · liều đã uống {view.adherence.taken} / tổng liều chỉ định {view.adherence.expected}
              </div>
            </div>
          </section>

          <section className='sec-card'>
            <div className='sec-head'>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Lịch sử dùng thuốc</h2>
            </div>
            {view.history.length === 0 ? (
              <div style={{ padding: 18, color: 'var(--ink-soft)' }}>Chưa có lịch sử.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Ngày</th>
                      <th style={thStyle}>Giờ</th>
                      <th style={thStyle}>Thuốc</th>
                      <th style={thStyle}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.history.map((h) => (
                      <tr key={h.id}>
                        <td style={{ ...tdStyle, fontFamily: 'ui-monospace, monospace' }}>{fmtDate(h.scheduledAt)}</td>
                        <td style={{ ...tdStyle, fontFamily: 'ui-monospace, monospace' }}>{fmtTime(h.scheduledAt)}</td>
                        <td style={tdStyle}>{h.drugName}</td>
                        <td style={tdStyle}><StatusPill status={h.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
