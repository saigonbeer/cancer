'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Tab = 'personal' | 'first' | 'followup';

const TREATMENTS: Array<[string, string]> = [
  ['surgeryOn', 'Phẫu thuật'],
  ['radioOn', 'Xạ trị'],
  ['chemoOn', 'Hóa chất'],
  ['immunoOn', 'Miễn dịch'],
  ['targetedOn', 'Đích'],
  ['hormoneOn', 'Nội tiết'],
];

const emptyPersonal = {
  name: '', dob: '', email: '', phone: '', username: '', password: '',
  address: '', emergencyContactName: '', emergencyContactPhone: '',
};

const emptyVisit = {
  history: '', illness: '', examination: '', labResults: '', diagnosis: '', progress: '', nextPlan: '', note: '',
};

function TextArea({ label, value, onChange, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className='field-label'>{label}</label>
      <textarea rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TreatmentChecks({ value, onChange }: { value: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void }) {
  return (
    <div>
      <label className='field-label'>Phương pháp điều trị</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {TREATMENTS.map(([key, label]) => (
          <label key={key} className={value[key] ? 'chk-pill on' : 'chk-pill'} style={{ cursor: 'pointer' }}>
            <input
              type='checkbox'
              checked={!!value[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
              style={{ accentColor: 'var(--teal)' }}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function NewPatientPage() {
  const [tab, setTab] = useState<Tab>('personal');
  const [personal, setPersonal] = useState<any>(emptyPersonal);
  const [patient, setPatient] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [firstVisit, setFirstVisit] = useState<any>(emptyVisit);
  const [firstTreatments, setFirstTreatments] = useState<Record<string, boolean>>({});
  const [firstSaved, setFirstSaved] = useState(false);

  const [followups, setFollowups] = useState<any[]>([]);
  const [followForm, setFollowForm] = useState<any>(emptyVisit);
  const [followTreatments, setFollowTreatments] = useState<Record<string, boolean>>({});

  async function loadVisits(profileId: string) {
    const res = await fetch('/api/doctor/visits?patientId=' + profileId, { cache: 'no-store' });
    const data = await res.json();
    const all: any[] = data.visits || [];
    setFirstSaved(all.some((v) => v.type === 'FIRST'));
    setFollowups(all.filter((v) => v.type === 'FOLLOWUP').sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()));
  }

  useEffect(() => {
    if (patient?.id) loadVisits(patient.id);
  }, [patient?.id]);

  async function savePersonal() {
    setError(null);
    setMessage(null);
    if (patient) {
      setTab('first');
      return;
    }
    const res = await fetch('/api/doctor/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personal),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Không tạo được bệnh nhân.');
      return;
    }
    setPatient(data.patient);
    setMessage('Đã tạo bệnh nhân. Mã BN: ' + data.patient.patientCode);
    setTab('first');
  }

  async function postVisit(type: 'FIRST' | 'FOLLOWUP', fields: any, treatments: Record<string, boolean>) {
    const res = await fetch('/api/doctor/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.id, type, ...fields, treatmentPlan: treatments }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Không lưu được lượt khám.');
      return false;
    }
    return true;
  }

  async function saveFirstVisit() {
    setError(null);
    setMessage(null);
    if (!patient) return;
    if (await postVisit('FIRST', firstVisit, firstTreatments)) {
      setMessage('Đã lưu khám lần đầu.');
      setFirstSaved(true);
      setTab('followup');
    }
  }

  async function saveFollowup() {
    setError(null);
    setMessage(null);
    if (!patient) return;
    if (await postVisit('FOLLOWUP', followForm, followTreatments)) {
      setMessage('Đã lưu lượt tái khám.');
      setFollowForm(emptyVisit);
      setFollowTreatments({});
      loadVisits(patient.id);
    }
  }

  const tabStyle = (active: boolean, disabled?: boolean): React.CSSProperties => ({
    border: 'none',
    background: 'none',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
    padding: '12px 4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    borderBottom: active ? '3px solid var(--teal)' : '3px solid transparent',
    color: active ? 'var(--teal-deep)' : 'var(--ink-soft)',
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--teal)', textTransform: 'uppercase' }}>
            Khoa Xạ trị &amp; Ung bướu
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700 }}>
            {patient ? 'Hồ sơ bệnh án — ' + patient.name : 'Tạo hồ sơ bệnh nhân mới'}
          </h1>
          {patient && <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 2 }}>Mã BN: {patient.patientCode}</div>}
        </div>
        <Link href='/doctor/patients' className='ghostbtn'>← Quay lại danh sách</Link>
      </div>

      <div style={{ display: 'flex', gap: 26, borderBottom: '1px solid var(--line)' }}>
        <button type='button' style={tabStyle(tab === 'personal')} onClick={() => setTab('personal')}>Thông tin cá nhân</button>
        <button type='button' style={tabStyle(tab === 'first', !patient)} disabled={!patient} onClick={() => setTab('first')}>Khám lần đầu</button>
        <button type='button' style={tabStyle(tab === 'followup', !patient || !firstSaved)} disabled={!patient || !firstSaved} onClick={() => setTab('followup')}>Tái khám</button>
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 13.5, fontWeight: 600 }}>{error}</div>}
      {message && <div style={{ color: 'var(--teal-deep)', fontSize: 13.5, fontWeight: 600 }}>{message}</div>}

      {tab === 'personal' && (
        <section className='sec-card'>
          <div className='sec-head'><h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Thông tin cá nhân</h2></div>
          <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {[
              ['name', 'Họ và tên *', 'Nguyễn Văn A'],
              ['dob', 'Năm sinh', '1978'],
              ['phone', 'Số điện thoại', '090...'],
              ['email', 'Email', 'email@domain.com'],
              ['username', 'Username *', 'username'],
              ['password', 'Mật khẩu *', 'Tối thiểu 6 ký tự'],
              ['address', 'Địa chỉ', ''],
              ['emergencyContactName', 'Người liên hệ khẩn cấp', ''],
              ['emergencyContactPhone', 'SĐT người liên hệ khẩn cấp', ''],
            ].map(([key, label, ph]) => (
              <div key={key}>
                <label className='field-label'>{label}</label>
                <input
                  type={key === 'password' ? 'password' : 'text'}
                  value={personal[key]}
                  placeholder={ph}
                  disabled={!!patient}
                  onChange={(e) => setPersonal({ ...personal, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div style={{ padding: '0 22px 22px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type='button' className='addbtn' onClick={savePersonal}>
              {patient ? 'Tiếp tục: Khám lần đầu' : 'Lưu thông tin cá nhân'}
            </button>
          </div>
        </section>
      )}

      {tab === 'first' && patient && (
        <section className='sec-card'>
          <div className='sec-head'><h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Khám lần đầu</h2></div>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TextArea label='Tiền sử bản thân & gia đình' value={firstVisit.history} onChange={(v) => setFirstVisit({ ...firstVisit, history: v })} />
            <TextArea label='Bệnh sử & triệu chứng lâm sàng' value={firstVisit.illness} onChange={(v) => setFirstVisit({ ...firstVisit, illness: v })} />
            <TextArea label='Khám lâm sàng (ECOG, chiều cao, cân nặng, tại chỗ)' value={firstVisit.examination} onChange={(v) => setFirstVisit({ ...firstVisit, examination: v })} />
            <TextArea label='Kết quả xét nghiệm & chẩn đoán hình ảnh' value={firstVisit.labResults} onChange={(v) => setFirstVisit({ ...firstVisit, labResults: v })} />
            <TextArea label='Chẩn đoán xác định' value={firstVisit.diagnosis} rows={2} onChange={(v) => setFirstVisit({ ...firstVisit, diagnosis: v })} />
            <TreatmentChecks value={firstTreatments} onChange={setFirstTreatments} />
            <TextArea label='Diễn biến và kết quả điều trị' value={firstVisit.progress} onChange={(v) => setFirstVisit({ ...firstVisit, progress: v })} />
            <TextArea label='Hướng điều trị tiếp theo' value={firstVisit.nextPlan} onChange={(v) => setFirstVisit({ ...firstVisit, nextPlan: v })} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {firstSaved && <button type='button' className='ghostbtn' onClick={() => setTab('followup')}>Sang tab Tái khám</button>}
              <button type='button' className='addbtn' onClick={saveFirstVisit} disabled={firstSaved}>
                {firstSaved ? 'Đã lưu khám lần đầu' : 'Lưu khám lần đầu'}
              </button>
            </div>
          </div>
        </section>
      )}

      {tab === 'followup' && patient && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {followups.map((v, idx) => (
            <section key={v.id} className='sec-card'>
              <div className='sec-head' style={{ justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Tái khám #{idx + 1}</h2>
                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{new Date(v.visitDate).toLocaleDateString('vi-VN')}</span>
              </div>
              <div style={{ padding: '14px 22px', fontSize: 13.5, lineHeight: 1.6 }}>
                <strong>Lâm sàng:</strong> {v.examination || v.illness || 'Chưa ghi'}<br />
                <strong>Xét nghiệm:</strong> {v.labResults || 'Chưa ghi'}<br />
                <strong>Kết luận:</strong> {v.diagnosis || 'Chưa ghi'}<br />
                <strong>Kế hoạch tiếp theo:</strong> {v.nextPlan || 'Chưa ghi'}
              </div>
            </section>
          ))}

          <section className='sec-card'>
            <div className='sec-head'><h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Thêm lượt tái khám</h2></div>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TextArea label='Lâm sàng' value={followForm.examination} onChange={(v) => setFollowForm({ ...followForm, examination: v })} />
              <TextArea label='Xét nghiệm' value={followForm.labResults} onChange={(v) => setFollowForm({ ...followForm, labResults: v })} />
              <TextArea label='Kết luận' value={followForm.diagnosis} rows={2} onChange={(v) => setFollowForm({ ...followForm, diagnosis: v })} />
              <TreatmentChecks value={followTreatments} onChange={setFollowTreatments} />
              <TextArea label='Kế hoạch điều trị tiếp' value={followForm.nextPlan} onChange={(v) => setFollowForm({ ...followForm, nextPlan: v })} />
              <TextArea label='Ghi chú thêm' value={followForm.note} rows={2} onChange={(v) => setFollowForm({ ...followForm, note: v })} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Link href='/doctor/patients' className='ghostbtn'>Hoàn tất</Link>
                <button type='button' className='addbtn' onClick={saveFollowup}>Lưu tái khám</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
