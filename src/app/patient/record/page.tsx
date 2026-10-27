'use client';

import { useEffect, useState } from 'react';

const SECTION_LABELS: Array<[string, string]> = [
  ['history', 'Tiền sử'],
  ['illness', 'Bệnh sử'],
  ['examination', 'Khám'],
  ['labResults', 'Xét nghiệm'],
  ['diagnosis', 'Chẩn đoán'],
  ['progress', 'Diễn biến và kết quả điều trị'],
  ['nextPlan', 'Hướng điều trị tiếp theo'],
];

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14.5, whiteSpace: 'pre-line' }}>{value || 'Chưa cập nhật'}</div>
    </div>
  );
}

function treatmentTags(plan: any) {
  if (!plan) return [];
  const tags: Array<[string, string, string]> = [];
  if (plan.chemoOn) tags.push(['Hóa trị', 'var(--purple-tint)', 'var(--purple)']);
  if (plan.surgeryOn) tags.push(['Phẫu thuật', 'var(--amber-tint)', 'var(--amber)']);
  if (plan.radioOn) tags.push(['Xạ trị', 'var(--teal-tint)', 'var(--teal)']);
  if (plan.immunoOn) tags.push(['Miễn dịch', 'var(--purple-tint)', 'var(--purple)']);
  if (plan.targetedOn) tags.push(['Điều trị đích', 'var(--teal-tint)', 'var(--teal)']);
  if (plan.hormoneOn) tags.push(['Nội tiết', 'var(--amber-tint)', 'var(--amber)']);
  return tags;
}

function VisitDetail({ visit }: { visit: any }) {
  const plan = visit.treatmentPlans?.[0];
  const tags = treatmentTags(plan);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {SECTION_LABELS.map(([key, label]) => (
          <Field key={key} label={label} value={visit[key]} />
        ))}
      </div>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 6 }}>Phương pháp điều trị</div>
        {tags.length === 0 ? (
          <div style={{ fontSize: 14.5 }}>Chưa cập nhật</div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tags.map(([t, bg, fg]) => (
              <span key={t} className='pill' style={{ background: bg, color: fg }}>{t}</span>
            ))}
          </div>
        )}
      </div>
      {visit.note && <Field label='Ghi chú' value={visit.note} />}
    </div>
  );
}

export default function PatientRecordPage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'personal' | 'medical'>('personal');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/patient/record', { cache: 'no-store' });
    const data = await res.json();
    setProfile(data.profile || null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    border: 'none',
    background: 'none',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
    padding: '12px 4px',
    cursor: 'pointer',
    borderBottom: active ? '3px solid var(--teal)' : '3px solid transparent',
    color: active ? 'var(--teal-deep)' : 'var(--ink-soft)',
  });

  if (loading && !profile) {
    return <div className='sec-card' style={{ padding: 20, color: 'var(--ink-soft)' }}>Đang tải hồ sơ...</div>;
  }
  if (!profile) {
    return <div className='sec-card' style={{ padding: 20, color: 'var(--ink-soft)' }}>Chưa có thông tin hồ sơ.</div>;
  }

  const visits: any[] = profile.visits || [];
  const firstVisit = [...visits].reverse().find((v) => v.type === 'FIRST');
  const followups = visits.filter((v) => v.type === 'FOLLOWUP');
  const age = profile.user?.dob && /^\d{4}$/.test(profile.user.dob) ? new Date().getFullYear() - Number(profile.user.dob) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Hồ sơ bệnh án</h1>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Dữ liệu do bác sĩ ghi nhận — chỉ xem</div>
        </div>
        <button type='button' className='ghostbtn' onClick={load}>Cập nhật</button>
      </div>

      <div style={{ display: 'flex', gap: 26, borderBottom: '1px solid var(--line)' }}>
        <button type='button' style={tabStyle(tab === 'personal')} onClick={() => setTab('personal')}>Thông tin cá nhân</button>
        <button type='button' style={tabStyle(tab === 'medical')} onClick={() => setTab('medical')}>Thông tin bệnh</button>
      </div>

      {tab === 'personal' && (
        <section className='sec-card'>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Thông tin cá nhân</h2>
          </div>
          <div style={{ padding: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            <Field label='Họ và tên' value={profile.user?.name} />
            <Field label='Năm sinh' value={profile.user?.dob ? `${profile.user.dob}${age !== null ? ` (${age} tuổi)` : ''}` : null} />
            <Field label='Email' value={profile.user?.email} />
            <Field label='Số điện thoại' value={profile.user?.phone} />
            <Field label='Địa chỉ' value={profile.address} />
            <Field
              label='Người liên hệ khẩn cấp'
              value={profile.emergencyContactName ? `${profile.emergencyContactName}${profile.emergencyContactPhone ? ' — ' + profile.emergencyContactPhone : ''}` : null}
            />
            <Field label='Mã bệnh án' value={profile.patientCode} />
            <Field label='Bác sĩ điều trị' value={profile.doctor?.user?.name} />
          </div>
        </section>
      )}

      {tab === 'medical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {!firstVisit && followups.length === 0 && (
            <div className='sec-card' style={{ padding: 22, color: 'var(--ink-soft)' }}>
              Bác sĩ chưa ghi nhận lượt khám nào.
            </div>
          )}

          {firstVisit && (
            <section className='sec-card'>
              <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Khám lần đầu</h2>
                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{new Date(firstVisit.visitDate).toLocaleDateString('vi-VN')}</span>
              </div>
              <div style={{ padding: 22 }}>
                <VisitDetail visit={firstVisit} />
              </div>
            </section>
          )}

          {followups.map((v, idx) => (
            <section key={v.id} className='sec-card'>
              <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Tái khám #{followups.length - idx}</h2>
                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{new Date(v.visitDate).toLocaleDateString('vi-VN')}</span>
              </div>
              <div style={{ padding: 22 }}>
                <VisitDetail visit={v} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
