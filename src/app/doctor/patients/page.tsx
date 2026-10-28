'use client';

import { useEffect, useState } from 'react';

type MainTab = 'record' | 'accounts';
type RecordTab = 'first' | 'followup' | 'side';

const METHODS: Array<{ key: string; label: string; drugs: boolean; fields: Array<[string, string]> }> = [
  { key: 'surgery', label: 'Phẫu thuật', drugs: false, fields: [['method', 'Phương pháp phẫu thuật'], ['date', 'Thời gian phẫu thuật'], ['dept', 'Khoa / BS thực hiện']] },
  { key: 'radio', label: 'Xạ trị', drugs: false, fields: [['site', 'Vị trí xạ'], ['purpose', 'Mục đích xạ (triệt căn / bổ trợ / tiền phẫu / giảm nhẹ)'], ['dose', 'Liều xạ'], ['period', 'Thời gian xạ trị']] },
  { key: 'chemo', label: 'Hóa chất', drugs: true, fields: [['regimen', 'Phác đồ'], ['start', 'Thời gian bắt đầu'], ['end', 'Thời gian kết thúc'], ['cycles', 'Các chu kỳ đã điều trị']] },
  { key: 'immuno', label: 'Miễn dịch', drugs: true, fields: [['regimen', 'Phác đồ'], ['start', 'Thời gian bắt đầu'], ['end', 'Thời gian kết thúc'], ['cycles', 'Các chu kỳ đã điều trị']] },
  { key: 'targeted', label: 'Đích', drugs: true, fields: [['regimen', 'Phác đồ'], ['start', 'Thời gian bắt đầu'], ['end', 'Thời gian kết thúc'], ['cycles', 'Các chu kỳ đã điều trị']] },
  { key: 'hormone', label: 'Nội tiết', drugs: true, fields: [['regimen', 'Phác đồ'], ['start', 'Thời gian bắt đầu'], ['end', 'Thời gian kết thúc (có thể để trống)'], ['expected', 'Dự kiến thời gian điều trị']] },
];

type MethodState = { on: boolean; data: Record<string, any>; drugs: any[] };
type MethodsState = Record<string, MethodState>;

const emptyDrug = () => ({ drugName: '', dose: '', frequency: '', quantity: '' });

function emptyMethods(): MethodsState {
  return Object.fromEntries(METHODS.map((m) => [m.key, { on: false, data: {}, drugs: [] as any[] }])) as MethodsState;
}

const emptyFirst = () => ({
  historySmoke: false, historyAlcohol: false, historyFamily: false, historyOther: false, historyNote: '',
  detectedAt: '', symptoms: '', priorTreatment: '', result: '',
  ecog: '', height: '', weight: '', local: '',
  gpb: '', ctmri: '', otherLab: '',
  diagnosis: '', progress: '', nextPlan: '', methods: emptyMethods(),
});

const emptyFollow = () => ({
  examination: '', labResults: '', diagnosis: '', nextPlan: '', note: '', methods: emptyMethods(),
});

const emptyAccount = {
  id: '', name: '', dob: '', gender: '', phone: '', email: '', address: '',
  emergencyContactName: '', emergencyContactPhone: '', username: '', password: '',
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

function Area({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className='field-label'>{label}</label>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Line({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className='field-label'>{label}</label>
      <input type='text' value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={checked ? 'chk-pill on' : 'chk-pill'} style={{ cursor: 'pointer' }}>
      <input type='checkbox' checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: 'var(--teal)' }} />
      {label}
    </label>
  );
}

function Section({ n, title, amber, children }: { n: number; title: string; amber?: boolean; children: React.ReactNode }) {
  return (
    <section className='sec-card'>
      <div className='sec-head'>
        <span className={amber ? 'badge amber' : 'badge'}>{n}</span>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h2>
      </div>
      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </section>
  );
}

function MethodsEditor({ value, onChange }: { value: MethodsState; onChange: (v: MethodsState) => void }) {
  const patch = (key: string, p: Partial<MethodState>) => onChange({ ...value, [key]: { ...value[key], ...p } });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {METHODS.map((m, i) => {
        const cur = value[m.key];
        return (
          <div key={m.key} style={{ border: '1px solid var(--line-soft)', borderRadius: 10, background: '#fff' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14.5 }}>
              <input type='checkbox' checked={cur.on} onChange={(e) => patch(m.key, { on: e.target.checked })} style={{ accentColor: 'var(--teal)' }} />
              {i + 1}. {m.label}
            </label>
            {cur.on && (
              <div style={{ padding: 16, borderTop: '1px solid var(--line-soft)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {m.fields.map(([k, label]) => (
                  <Line key={k} label={label} value={cur.data[k] || ''} onChange={(v) => patch(m.key, { data: { ...cur.data, [k]: v } })} />
                ))}
                {m.key === 'radio' && (
                  <Check label='Có kèm hóa chất' checked={!!cur.data.withChemo} onChange={(v) => patch(m.key, { data: { ...cur.data, withChemo: v } })} />
                )}
                {m.drugs && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)' }}>Đơn thuốc</div>
                    {cur.drugs.map((d: any, idx: number) => {
                      const setDrug = (field: string, v: string) =>
                        patch(m.key, { drugs: cur.drugs.map((x: any, j: number) => (j === idx ? { ...x, [field]: v } : x)) });
                      return (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 0.8fr auto', gap: 8, alignItems: 'center' }}>
                          <input type='text' placeholder='Tên thuốc' value={d.drugName} onChange={(e) => setDrug('drugName', e.target.value)} />
                          <input type='text' placeholder='Liều lượng' value={d.dose} onChange={(e) => setDrug('dose', e.target.value)} />
                          <input type='text' placeholder='Tần suất' value={d.frequency} onChange={(e) => setDrug('frequency', e.target.value)} />
                          <input type='text' placeholder='Số lượng' value={d.quantity} onChange={(e) => setDrug('quantity', e.target.value)} />
                          <button type='button' onClick={() => patch(m.key, { drugs: cur.drugs.filter((_: any, j: number) => j !== idx) })} style={{ border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                        </div>
                      );
                    })}
                    <button type='button' className='ghostbtn' style={{ alignSelf: 'flex-start' }} onClick={() => patch(m.key, { drugs: [...cur.drugs, emptyDrug()] })}>+ Thêm thuốc</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function buildTreatmentPlan(methods: MethodsState) {
  const plan: Record<string, any> = {};
  for (const m of METHODS) {
    const cur = methods[m.key];
    plan[m.key + 'On'] = cur.on;
    plan[m.key + 'Data'] = cur.on ? { ...cur.data, drugs: cur.drugs.filter((d) => d.drugName.trim()) } : null;
  }
  return plan;
}

function collectDrugs(methods: MethodsState) {
  return METHODS.filter((m) => methods[m.key].on).flatMap((m) =>
    methods[m.key].drugs
      .filter((d) => d.drugName.trim())
      .map((d) => ({ drugName: d.drugName.trim(), dose: d.dose, frequency: d.frequency, quantity: d.quantity }))
  );
}

function VisitSummary({ v }: { v: any }) {
  const plan = v.treatmentPlans?.[0];
  const tags = METHODS.filter((m) => plan?.[m.key + 'On']).map((m) => m.label);
  const rows: Array<[string, string | null | undefined]> = [
    ['Tiền sử', v.history], ['Bệnh sử', v.illness], ['Khám', v.examination], ['Xét nghiệm', v.labResults],
    ['Chẩn đoán', v.diagnosis], ['Diễn biến & kết quả', v.progress], ['Hướng điều trị tiếp theo', v.nextPlan], ['Ghi chú', v.note],
  ];
  const items = (v.prescriptions || []).flatMap((p: any) => p.items || []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.filter(([, val]) => val).map(([label, val]) => (
        <div key={label}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>{label}</div>
          <div className='readtext'>{val}</div>
        </div>
      ))}
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 4 }}>Phương pháp điều trị</div>
        {tags.length === 0 ? <div style={{ fontSize: 14 }}>Chưa chọn</div> : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{tags.map((t) => <span key={t} className='chk-pill on'>{t}</span>)}</div>
        )}
      </div>
      {items.length > 0 && (
        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 10, fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Đơn thuốc</div>
          {items.map((it: any) => (
            <div key={it.id}>• {it.drugName} — {it.dose || ''} {it.frequency || ''} {it.quantity ? '· SL ' + it.quantity : ''}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DoctorPatientsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('record');
  const [recordTab, setRecordTab] = useState<RecordTab>('first');

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [visits, setVisits] = useState<any[]>([]);
  const [sideEffects, setSideEffects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<any[]>([]);

  const [first, setFirst] = useState<any>(emptyFirst());
  const [follow, setFollow] = useState<any>(emptyFollow());

  const [query, setQuery] = useState('');
  const [accountModal, setAccountModal] = useState<'create' | 'edit' | null>(null);
  const [accountForm, setAccountForm] = useState<any>(emptyAccount);
  const [accountError, setAccountError] = useState<string | null>(null);

  const selected = patients.find((p) => p.id === selectedId) || null;
  const firstVisit = visits.find((v) => v.type === 'FIRST') || null;
  const followups = visits
    .filter((v) => v.type === 'FOLLOWUP')
    .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());

  async function loadPatients() {
    setLoading(true);
    const res = await fetch('/api/doctor/patients', { cache: 'no-store' });
    const data = await res.json();
    const list: any[] = data.patients || [];
    setPatients(list);
    setLoading(false);
    return list;
  }

  async function loadRecord(profileId: string) {
    const [v, s] = await Promise.all([
      fetch('/api/doctor/visits?patientId=' + profileId, { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/doctor/side-effects', { cache: 'no-store' }).then((r) => r.json()),
    ]);
    setVisits(v.visits || []);
    setSideEffects((s.reports || []).filter((r: any) => r.patientId === profileId));
  }

  useEffect(() => {
    loadPatients().then((list) => {
      if (list.length > 0) setSelectedId((cur) => cur || list[0].id);
    });
  }, []);

  useEffect(() => {
    setFirst(emptyFirst());
    setFollow(emptyFollow());
    setWarnings([]);
    setMessage(null);
    setError(null);
    if (selectedId) loadRecord(selectedId);
    else {
      setVisits([]);
      setSideEffects([]);
    }
  }, [selectedId]);

  function firstFields() {
    const f = first;
    const history = [
      f.historySmoke && 'Hút thuốc',
      f.historyAlcohol && 'Uống rượu',
      f.historyFamily && 'Gia đình có tiền sử',
      f.historyOther && 'Khác',
      f.historyNote && 'Ghi chú: ' + f.historyNote,
    ].filter(Boolean).join('; ');
    return {
      history,
      illness: [
        f.detectedAt && 'Thời gian phát hiện: ' + f.detectedAt,
        f.symptoms && 'Triệu chứng: ' + f.symptoms,
        f.priorTreatment && 'Đã điều trị trước: ' + f.priorTreatment,
        f.result && 'Kết quả điều trị: ' + f.result,
      ].filter(Boolean).join('\n'),
      examination: [
        f.ecog && 'ECOG: ' + f.ecog,
        f.height && 'Chiều cao: ' + f.height + ' cm',
        f.weight && 'Cân nặng: ' + f.weight + ' kg',
        f.local && 'Tại chỗ: ' + f.local,
      ].filter(Boolean).join('\n'),
      labResults: [
        f.gpb && 'GPB: ' + f.gpb,
        f.ctmri && 'CT/MRI: ' + f.ctmri,
        f.otherLab && 'Xét nghiệm khác: ' + f.otherLab,
      ].filter(Boolean).join('\n'),
      diagnosis: f.diagnosis,
      progress: f.progress,
      nextPlan: f.nextPlan,
    };
  }

  async function saveVisit(type: 'FIRST' | 'FOLLOWUP') {
    if (!selected) return;
    setError(null);
    setMessage(null);
    setWarnings([]);
    const fields = type === 'FIRST'
      ? firstFields()
      : { examination: follow.examination, labResults: follow.labResults, diagnosis: follow.diagnosis, nextPlan: follow.nextPlan, note: follow.note };
    const methods: MethodsState = type === 'FIRST' ? first.methods : follow.methods;

    const res = await fetch('/api/doctor/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: selected.id, type, ...fields, treatmentPlan: buildTreatmentPlan(methods) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Không lưu được lượt khám.');
      return;
    }

    const items = collectDrugs(methods);
    if (items.length > 0) {
      const rx = await fetch('/api/doctor/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId: data.visit.id, items }),
      });
      const rxData = await rx.json().catch(() => ({}));
      if (rx.ok && rxData.interactions?.length) setWarnings(rxData.interactions);
    }
    setMessage(type === 'FIRST' ? 'Đã lưu khám lần đầu.' : 'Đã lưu lượt tái khám.');
    if (type === 'FIRST') setFirst(emptyFirst());
    else setFollow(emptyFollow());
    loadRecord(selected.id);
  }

  function openCreateAccount() {
    setAccountForm(emptyAccount);
    setAccountError(null);
    setAccountModal('create');
  }

  function openEditAccount(p: any) {
    setAccountForm({
      id: p.id,
      name: p.user?.name || '',
      dob: p.user?.dob || '',
      gender: p.gender || '',
      phone: p.user?.phone || '',
      email: p.user?.email || '',
      address: p.address || '',
      emergencyContactName: p.emergencyContactName || '',
      emergencyContactPhone: p.emergencyContactPhone || '',
      username: '',
      password: '',
    });
    setAccountError(null);
    setAccountModal('edit');
  }

  async function saveAccount() {
    setAccountError(null);
    const f = accountForm;
    const body: any = {
      name: f.name, dob: f.dob, gender: f.gender, phone: f.phone, email: f.email, address: f.address,
      emergencyContactName: f.emergencyContactName, emergencyContactPhone: f.emergencyContactPhone,
    };
    const res = accountModal === 'create'
      ? await fetch('/api/doctor/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, username: f.username, password: f.password }) })
      : await fetch('/api/doctor/patients/' + f.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAccountError(data.error || 'Không lưu được.');
      return;
    }
    setAccountModal(null);
    const list = await loadPatients();
    if (accountModal === 'create' && data.patient?.id) setSelectedId(data.patient.id);
    if (accountModal === 'edit' && list.some((p: any) => p.id === f.id)) setSelectedId(f.id);
  }

  async function deleteAccount(p: any) {
    if (!window.confirm('Xóa bệnh nhân ' + p.user?.name + '? Toàn bộ hồ sơ bệnh án sẽ bị xóa.')) return;
    const res = await fetch('/api/doctor/patients/' + p.id, { method: 'DELETE' });
    if (res.ok) {
      if (selectedId === p.id) setSelectedId('');
      loadPatients();
    }
  }

  const filtered = patients.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [p.patientCode, p.user?.name, p.user?.phone, p.user?.email].some((v) => (v || '').toLowerCase().includes(q));
  });

  const tabStyle = (on: boolean): React.CSSProperties => ({
    border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, padding: '12px 4px', cursor: 'pointer',
    borderBottom: on ? '3px solid var(--teal)' : '3px solid transparent',
    color: on ? 'var(--teal-deep)' : 'var(--ink-soft)',
  });

  return (
    <>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--teal)', textTransform: 'uppercase' }}>Khoa Xạ trị &amp; Ung bướu</div>
        <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700 }}>Bệnh nhân</h1>
      </div>

      <div style={{ display: 'flex', gap: 26, borderBottom: '1px solid var(--line)' }}>
        <button type='button' style={tabStyle(mainTab === 'record')} onClick={() => setMainTab('record')}>Hồ sơ bệnh án</button>
        <button type='button' style={tabStyle(mainTab === 'accounts')} onClick={() => setMainTab('accounts')}>Quản lý tài khoản BN</button>
      </div>

      {mainTab === 'accounts' && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type='text'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Tìm theo mã BN, họ tên, SĐT hoặc email...'
              style={{ flex: 1, minWidth: 260, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)' }}
            />
            <button type='button' className='addbtn' onClick={openCreateAccount}>+ Thêm bệnh nhân</button>
          </div>
          <section className='sec-card' style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: 'var(--bg)', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                  {['Mã BN', 'Họ và tên', 'Năm sinh', 'Giới tính', 'Số điện thoại', 'Email', 'Địa chỉ', 'Người liên hệ khẩn cấp', 'SĐT liên hệ khẩn cấp', 'Hành động'].map((h) => (
                    <th key={h} style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={10} style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>Đang tải...</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={10} style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>Chưa có bệnh nhân nào.</td></tr>}
                {filtered.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--teal-deep)' }}>{p.patientCode}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{p.user?.name}</td>
                    <td style={{ padding: '10px 14px' }}>{p.user?.dob || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{p.gender || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{p.user?.phone || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{p.user?.email || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{p.address || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{p.emergencyContactName || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{p.emergencyContactPhone || '—'}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <button type='button' className='ghostbtn' style={{ marginRight: 6 }} onClick={() => openEditAccount(p)}>Sửa</button>
                      <button type='button' className='ghostbtn' style={{ color: 'var(--red)' }} onClick={() => deleteAccount(p)}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {mainTab === 'record' && (
        <>
          <div className='sec-card' style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ minWidth: 280, flex: 1 }}>
              <label className='field-label'>Chọn bệnh nhân</label>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)' }}>
                {patients.length === 0 && (
                  <option value=''>{loading ? 'Đang tải...' : 'Chưa có bệnh nhân — thêm ở tab Quản lý tài khoản BN'}</option>
                )}
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.patientCode} — {p.user?.name}</option>
                ))}
              </select>
            </div>
            {selected && (
              <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--ink)' }}>{selected.user?.name}</strong>
                {' • '}{selected.user?.dob ? 'Năm sinh ' + selected.user.dob : 'Chưa có năm sinh'}
                {' • '}{selected.gender || 'Chưa có giới tính'}
                {' • '}Mã BN: {selected.patientCode}
              </div>
            )}
          </div>

          {selected && (
            <>
              <div style={{ display: 'flex', gap: 26, borderBottom: '1px solid var(--line)' }}>
                <button type='button' style={tabStyle(recordTab === 'first')} onClick={() => setRecordTab('first')}>Khám lần đầu</button>
                <button type='button' style={tabStyle(recordTab === 'followup')} onClick={() => setRecordTab('followup')}>Tái khám ({followups.length})</button>
                <button type='button' style={tabStyle(recordTab === 'side')} onClick={() => setRecordTab('side')}>Theo dõi tác dụng phụ ({sideEffects.length})</button>
              </div>

              {error && <div style={{ color: 'var(--red)', fontSize: 13.5, fontWeight: 600 }}>{error}</div>}
              {message && <div style={{ color: 'var(--teal-deep)', fontSize: 13.5, fontWeight: 600 }}>{message}</div>}
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

              {recordTab === 'first' && (firstVisit ? (
                <section className='sec-card'>
                  <div className='sec-head' style={{ justifyContent: 'space-between' }}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Khám lần đầu</h2>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Đã lưu ngày {fmtDate(firstVisit.visitDate)}</span>
                  </div>
                  <div style={{ padding: '18px 22px' }}><VisitSummary v={firstVisit} /></div>
                </section>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <Section n={1} title='Tiền sử'>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      <Check label='Hút thuốc' checked={first.historySmoke} onChange={(v) => setFirst({ ...first, historySmoke: v })} />
                      <Check label='Uống rượu' checked={first.historyAlcohol} onChange={(v) => setFirst({ ...first, historyAlcohol: v })} />
                      <Check label='Gia đình' checked={first.historyFamily} onChange={(v) => setFirst({ ...first, historyFamily: v })} />
                      <Check label='Khác' checked={first.historyOther} onChange={(v) => setFirst({ ...first, historyOther: v })} />
                    </div>
                    <Line label='Ghi chú tiền sử khác' value={first.historyNote} onChange={(v) => setFirst({ ...first, historyNote: v })} />
                  </Section>
                  <Section n={2} title='Bệnh sử'>
                    <Line label='Thời gian phát hiện bệnh' value={first.detectedAt} onChange={(v) => setFirst({ ...first, detectedAt: v })} />
                    <Area label='Triệu chứng lâm sàng' value={first.symptoms} onChange={(v) => setFirst({ ...first, symptoms: v })} rows={3} />
                    <Area label='Các phương pháp đã điều trị' value={first.priorTreatment} onChange={(v) => setFirst({ ...first, priorTreatment: v })} rows={3} />
                    <Area label='Kết quả điều trị' value={first.result} onChange={(v) => setFirst({ ...first, result: v })} />
                  </Section>
                  <Section n={3} title='Khám'>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14 }}>
                      <Line label='ECOG' value={first.ecog} onChange={(v) => setFirst({ ...first, ecog: v })} placeholder='0–4' />
                      <Line label='Chiều cao (cm)' value={first.height} onChange={(v) => setFirst({ ...first, height: v })} />
                      <Line label='Cân nặng (kg)' value={first.weight} onChange={(v) => setFirst({ ...first, weight: v })} />
                    </div>
                    <Area label='Tại chỗ' value={first.local} onChange={(v) => setFirst({ ...first, local: v })} rows={3} />
                  </Section>
                  <Section n={4} title='Xét nghiệm'>
                    <Area label='GPB (Giải phẫu bệnh)' value={first.gpb} onChange={(v) => setFirst({ ...first, gpb: v })} />
                    <Area label='CT / MRI' value={first.ctmri} onChange={(v) => setFirst({ ...first, ctmri: v })} />
                    <Area label='Xét nghiệm khác' value={first.otherLab} onChange={(v) => setFirst({ ...first, otherLab: v })} />
                  </Section>
                  <Section n={5} title='Chẩn đoán'>
                    <Area label='Chẩn đoán xác định' value={first.diagnosis} onChange={(v) => setFirst({ ...first, diagnosis: v })} />
                  </Section>
                  <Section n={6} title='Phương pháp điều trị'>
                    <MethodsEditor value={first.methods} onChange={(v) => setFirst({ ...first, methods: v })} />
                  </Section>
                  <Section n={7} title='Diễn biến và kết quả điều trị'>
                    <Area label='Diễn biến & kết quả' value={first.progress} onChange={(v) => setFirst({ ...first, progress: v })} rows={3} />
                  </Section>
                  <Section n={8} title='Hướng điều trị tiếp theo' amber>
                    <Area label='Kế hoạch điều trị' value={first.nextPlan} onChange={(v) => setFirst({ ...first, nextPlan: v })} rows={3} />
                  </Section>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type='button' className='addbtn' onClick={() => saveVisit('FIRST')}>Lưu hồ sơ khám lần đầu</button>
                  </div>
                </div>
              ))}

              {recordTab === 'followup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {!firstVisit && (
                    <div className='sec-card' style={{ padding: 18, color: 'var(--ink-soft)' }}>Hãy lưu khám lần đầu trước khi thêm tái khám.</div>
                  )}
                  {followups.map((v, idx) => (
                    <section key={v.id} className='sec-card'>
                      <div className='sec-head' style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className='badge'>{idx + 1}</span>
                          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Tái khám #{idx + 1}</h2>
                        </div>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{fmtDate(v.visitDate)}</span>
                      </div>
                      <div style={{ padding: '18px 22px' }}><VisitSummary v={v} /></div>
                    </section>
                  ))}
                  {firstVisit && (
                    <section className='sec-card'>
                      <div className='sec-head'><h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Thêm lượt tái khám</h2></div>
                      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <Area label='Lâm sàng' value={follow.examination} onChange={(v) => setFollow({ ...follow, examination: v })} rows={3} />
                        <Area label='Xét nghiệm' value={follow.labResults} onChange={(v) => setFollow({ ...follow, labResults: v })} rows={3} />
                        <Area label='Kết luận' value={follow.diagnosis} onChange={(v) => setFollow({ ...follow, diagnosis: v })} />
                        <div>
                          <label className='field-label'>Phương pháp điều trị</label>
                          <MethodsEditor value={follow.methods} onChange={(v) => setFollow({ ...follow, methods: v })} />
                        </div>
                        <Area label='Kế hoạch điều trị tiếp' value={follow.nextPlan} onChange={(v) => setFollow({ ...follow, nextPlan: v })} rows={3} />
                        <Area label='Ghi chú thêm về kế hoạch điều trị' value={follow.note} onChange={(v) => setFollow({ ...follow, note: v })} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button type='button' className='addbtn' onClick={() => saveVisit('FOLLOWUP')}>Lưu lượt tái khám</button>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              )}

              {recordTab === 'side' && (
                <section className='sec-card'>
                  <div className='sec-head'><h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Báo cáo tác dụng phụ từ bệnh nhân</h2></div>
                  {sideEffects.length === 0 && <div style={{ padding: 22, color: 'var(--ink-soft)' }}>Bệnh nhân chưa có báo cáo nào.</div>}
                  {sideEffects.map((r: any) => (
                    <div key={r.id} style={{ padding: '14px 22px', borderBottom: '1px solid var(--line-soft)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 600 }}>{r.symptom}</div>
                        <span
                          className='pill'
                          style={{
                            background: r.ctcaeGrade >= 3 ? 'var(--red-tint)' : r.ctcaeGrade === 2 ? 'var(--amber-tint)' : 'var(--teal-tint)',
                            color: r.ctcaeGrade >= 3 ? 'var(--red)' : r.ctcaeGrade === 2 ? 'var(--amber)' : 'var(--teal-deep)',
                          }}
                        >
                          CTCAE Độ {r.ctcaeGrade ?? '—'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 3 }}>
                        Vị trí: {r.site || '—'} · Chu kỳ {r.cycle ?? '—'} · {fmtDate(r.createdAt)} · {r.status === 'PENDING' ? 'Chờ xem xét' : 'Đã xử lý'}
                      </div>
                      {r.note && <div style={{ fontSize: 13.5, marginTop: 4 }}>{r.note}</div>}
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </>
      )}

      {accountModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div className='sec-card' style={{ width: 640, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>{accountModal === 'create' ? 'Thêm bệnh nhân' : 'Sửa thông tin bệnh nhân'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Line label='Họ và tên *' value={accountForm.name} onChange={(v) => setAccountForm({ ...accountForm, name: v })} />
              <Line label='Năm sinh' value={accountForm.dob} onChange={(v) => setAccountForm({ ...accountForm, dob: v })} placeholder='1978' />
              <div>
                <label className='field-label'>Giới tính</label>
                <select value={accountForm.gender} onChange={(e) => setAccountForm({ ...accountForm, gender: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)' }}>
                  <option value=''>— Chọn —</option>
                  <option value='Nam'>Nam</option>
                  <option value='Nữ'>Nữ</option>
                </select>
              </div>
              <Line label='Số điện thoại' value={accountForm.phone} onChange={(v) => setAccountForm({ ...accountForm, phone: v })} />
              <Line label='Email' value={accountForm.email} onChange={(v) => setAccountForm({ ...accountForm, email: v })} />
              <div style={{ gridColumn: '1 / -1' }}>
                <Line label='Địa chỉ' value={accountForm.address} onChange={(v) => setAccountForm({ ...accountForm, address: v })} />
              </div>
              <Line label='Người liên hệ khẩn cấp' value={accountForm.emergencyContactName} onChange={(v) => setAccountForm({ ...accountForm, emergencyContactName: v })} />
              <Line label='SĐT người liên hệ khẩn cấp' value={accountForm.emergencyContactPhone} onChange={(v) => setAccountForm({ ...accountForm, emergencyContactPhone: v })} />
              {accountModal === 'create' && (
                <>
                  <Line label='Username *' value={accountForm.username} onChange={(v) => setAccountForm({ ...accountForm, username: v })} />
                  <div>
                    <label className='field-label'>Mật khẩu * (tối thiểu 6 ký tự)</label>
                    <input type='password' value={accountForm.password} onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })} />
                  </div>
                </>
              )}
            </div>
            {accountError && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{accountError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type='button' className='ghostbtn' onClick={() => setAccountModal(null)}>Hủy</button>
              <button type='button' className='addbtn' onClick={saveAccount}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
