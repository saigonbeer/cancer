'use client';

import { useEffect, useState } from 'react';

type Tab = 'history' | 'new';

const emptyRow = () => ({ drugName: '', dose: '', unit: 'mg', frequency: '', duration: '', quantity: '', reminderTimes: '' });

const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className='field-label'>{label}</label>
      <input type='text' value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function DoctorMedicationsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>('history');
  const [rows, setRows] = useState<any[]>([emptyRow()]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<any[]>([]);

  const selected = patients.find((p) => p.id === selectedId) || null;
  const results = patients
    .filter((p) => {
      const q = query.trim().toLowerCase();
      if (!q) return false;
      return (p.user?.name || '').toLowerCase().includes(q) || (p.patientCode || '').toLowerCase().includes(q);
    })
    .slice(0, 50);

  async function loadPatients() {
    setLoading(true);
    const res = await fetch('/api/doctor/patients', { cache: 'no-store' });
    const data = await res.json();
    setPatients(data.patients || []);
    setLoading(false);
  }

  async function loadPatientData(pid: string) {
    const [rx, vs] = await Promise.all([
      fetch('/api/doctor/medications?patientId=' + pid, { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/doctor/visits?patientId=' + pid, { cache: 'no-store' }).then((r) => r.json()),
    ]);
    setPrescriptions(rx.prescriptions || []);
    setVisits(vs.visits || []);
  }

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    setRows([emptyRow()]);
    setMessage(null);
    setError(null);
    setWarnings([]);
    if (selectedId) loadPatientData(selectedId);
    else {
      setPrescriptions([]);
      setVisits([]);
    }
  }, [selectedId]);

  function updateRow(i: number, field: string, value: string) {
    setRows(rows.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
  }

  async function savePrescription() {
    if (!selected) return;
    setError(null);
    setMessage(null);
    setWarnings([]);
    const items = rows
      .map((r) => ({ ...r, drugName: r.drugName.trim() }))
      .filter((r) => r.drugName);
    if (items.length === 0) {
      setError('Vui lòng nhập ít nhất một thuốc.');
      return;
    }

    // Đơn thuốc phải gắn với một lượt khám; nếu chưa có lượt nào thì tạo lượt tái khám kê đơn.
    let visitId = visits[0]?.id as string | undefined;
    if (!visitId) {
      const vr = await fetch('/api/doctor/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selected.id, type: 'FOLLOWUP', note: 'Kê đơn thuốc' }),
      });
      const vd = await vr.json().catch(() => ({}));
      if (!vr.ok) {
        setError(vd.error || 'Không tạo được lượt khám để gắn đơn thuốc.');
        return;
      }
      visitId = vd.visit.id;
    }

    const res = await fetch('/api/doctor/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitId, items }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Không lưu được đơn thuốc.');
      return;
    }
    if (data.interactions?.length) setWarnings(data.interactions);
    setMessage('Đã lưu đơn thuốc.');
    setRows([emptyRow()]);
    loadPatientData(selected.id);
    setTab('history');
  }

  const tabStyle = (on: boolean): React.CSSProperties => ({
    border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, padding: '12px 4px', cursor: 'pointer',
    borderBottom: on ? '3px solid var(--teal)' : '3px solid transparent', color: on ? 'var(--teal-deep)' : 'var(--ink-soft)',
  });

  return (
    <>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--teal)', textTransform: 'uppercase' }}>Khoa Xạ trị &amp; Ung bướu</div>
        <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700 }}>Thuốc</h1>
      </div>

      <section className='sec-card' style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Tìm bệnh nhân</div>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loading ? 'Đang tải...' : 'Nhập tên hoặc mã BN, ví dụ: Nguyễn hoặc BN-0012'}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)' }}
        />
        {query.trim() !== '' && (
          <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
            {results.length === 0 && <div style={{ padding: 14, fontSize: 13, color: 'var(--ink-soft)' }}>Không tìm thấy bệnh nhân phù hợp.</div>}
            {results.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderTop: '1px solid var(--line-soft)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.user?.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                    {p.patientCode} • {p.user?.dob ? 'Năm sinh ' + p.user.dob : 'Chưa có năm sinh'} • {p.user?.phone || 'Chưa có SĐT'}
                  </div>
                </div>
                <button type='button' className='addbtn' style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => { setSelectedId(p.id); setQuery(''); }}>
                  Chọn
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <>
          <section className='sec-card' style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
            <div><div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>Họ và tên</div><div style={{ fontWeight: 700, fontSize: 15 }}>{selected.user?.name}</div></div>
            <div><div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>Mã BN</div><div style={{ fontWeight: 600, color: 'var(--teal-deep)' }}>{selected.patientCode}</div></div>
            <div><div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>Năm sinh</div><div>{selected.user?.dob || 'Chưa cập nhật'}</div></div>
            <div><div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>Giới tính</div><div>{selected.gender || 'Chưa cập nhật'}</div></div>
            <div><div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>Số điện thoại</div><div>{selected.user?.phone || 'Chưa cập nhật'}</div></div>
          </section>

          <div style={{ display: 'flex', gap: 26, borderBottom: '1px solid var(--line)' }}>
            <button type='button' style={tabStyle(tab === 'history')} onClick={() => setTab('history')}>Lịch sử kê đơn ({prescriptions.length})</button>
            <button type='button' style={tabStyle(tab === 'new')} onClick={() => setTab('new')}>Kê đơn mới</button>
          </div>

          {message && <div style={{ color: 'var(--teal-deep)', fontSize: 13.5, fontWeight: 600 }}>{message}</div>}
          {error && <div style={{ color: 'var(--red)', fontSize: 13.5, fontWeight: 600 }}>{error}</div>}
          {warnings.length > 0 && (
            <div style={{ background: 'var(--red-tint)', border: '1px solid var(--red)', borderRadius: 10, padding: 14 }}>
              <div style={{ color: 'var(--red)', fontWeight: 700 }}>⚠ Phát hiện tương tác thuốc</div>
              {warnings.map((w: any, i: number) => (
                <div key={i} style={{ fontSize: 13, marginTop: 4 }}>
                  • <strong>{w.drugA?.name}</strong> với <strong>{w.drugB?.name}</strong>: {w.description} (Mức độ: {w.severity})
                </div>
              ))}
            </div>
          )}

          {tab === 'history' && (
            <section className='sec-card'>
              {prescriptions.length === 0 && <div style={{ padding: 22, color: 'var(--ink-soft)' }}>Bệnh nhân này chưa có đơn thuốc nào.</div>}
              {prescriptions.map((pr) => (
                <div key={pr.id} style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>Bác sĩ kê: {pr.prescribedBy || 'Bác sĩ điều trị'}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Ngày kê: {fmtDate(pr.prescribedAt)}</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--ink-soft)', fontSize: 12 }}>
                        <th style={{ padding: '6px 4px' }}>STT</th><th>Tên thuốc</th><th>Liều</th><th>Tần suất</th><th>Số lượng</th><th>Giờ nhắc uống</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pr.items?.map((it: any, idx: number) => (
                        <tr key={it.id} style={{ borderTop: '1px solid var(--line-soft)' }}>
                          <td style={{ padding: '6px 4px' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{it.drugName}</td>
                          <td>{[it.dose, it.unit].filter(Boolean).join(' ') || '—'}</td>
                          <td>{it.frequency || '—'}</td>
                          <td>{it.quantity || '—'}</td>
                          <td>{it.reminderTimes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>
          )}

          {tab === 'new' && (
            <section className='sec-card'>
              <div className='sec-head'><h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Kê đơn thuốc mới</h2></div>
              <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {rows.map((r, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.7fr 1fr 1fr 0.8fr 1fr auto', gap: 8, alignItems: 'end' }}>
                    <Field label='Tên thuốc' value={r.drugName} onChange={(v) => updateRow(i, 'drugName', v)} placeholder='VD: Ondansetron' />
                    <Field label='Liều' value={r.dose} onChange={(v) => updateRow(i, 'dose', v)} placeholder='8' />
                    <Field label='Đơn vị' value={r.unit} onChange={(v) => updateRow(i, 'unit', v)} placeholder='mg' />
                    <Field label='Tần suất' value={r.frequency} onChange={(v) => updateRow(i, 'frequency', v)} placeholder='2 lần/ngày' />
                    <Field label='Thời gian dùng' value={r.duration} onChange={(v) => updateRow(i, 'duration', v)} placeholder='7 ngày' />
                    <Field label='Số lượng' value={r.quantity} onChange={(v) => updateRow(i, 'quantity', v)} placeholder='14' />
                    <Field label='Giờ nhắc uống' value={r.reminderTimes} onChange={(v) => updateRow(i, 'reminderTimes', v)} placeholder='08:00, 20:00' />
                    <button type='button' onClick={() => setRows(rows.length > 1 ? rows.filter((_, j) => j !== i) : rows)} style={{ border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16, paddingBottom: 10 }}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button type='button' className='ghostbtn' onClick={() => setRows([...rows, emptyRow()])}>+ Thêm thuốc</button>
                  <button type='button' className='addbtn' onClick={savePrescription}>Lưu đơn thuốc</button>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
