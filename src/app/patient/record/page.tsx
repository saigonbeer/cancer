'use client';

import { useEffect, useState } from 'react';

const TREATMENTS: Array<[string, string]> = [
  ['radioOn', 'Xạ trị'],
  ['chemoOn', 'Hóa chất'],
  ['immunoOn', 'Miễn dịch'],
  ['targetedOn', 'Đích'],
  ['hormoneOn', 'Nội tiết'],
  ['surgeryOn', 'Phẫu thuật'],
];

function ReadBlock({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 4 }}>{label}</div>
      <div className='readtext'>{value || 'Chưa cập nhật'}</div>
    </div>
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

function FirstVisitSections({ v }: { v: any }) {
  const plan = v.treatmentPlans?.[0];
  return (
    <>
      <Section n={1} title='Tiền sử'>
        <ReadBlock label='Tiền sử bản thân & gia đình' value={v.history} />
      </Section>
      <Section n={2} title='Bệnh sử'>
        <ReadBlock label='Triệu chứng lâm sàng & diễn biến bệnh' value={v.illness} />
        <ReadBlock label='Khám lâm sàng' value={v.examination} />
      </Section>
      <Section n={3} title='Xét nghiệm'>
        <ReadBlock label='Kết quả xét nghiệm & chẩn đoán hình ảnh' value={v.labResults} />
      </Section>
      <Section n={4} title='Chẩn đoán'>
        <ReadBlock label='Chẩn đoán xác định' value={v.diagnosis} />
      </Section>
      <Section n={5} title='Phương pháp điều trị'>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TREATMENTS.map(([key, label]) => (
            <span key={key} className={plan?.[key] ? 'chk-pill on' : 'chk-pill'}>
              {plan?.[key] ? '✓ ' : ''}{label}
            </span>
          ))}
        </div>
      </Section>
      <Section n={6} title='Diễn biến và kết quả điều trị'>
        <ReadBlock label='Diễn biến & kết quả' value={v.progress} />
      </Section>
      <Section n={7} title='Hướng điều trị tiếp theo' amber>
        <ReadBlock label='Kế hoạch điều trị' value={v.nextPlan} />
      </Section>
    </>
  );
}

function FollowupCard({ v, n }: { v: any; n: number }) {
  return (
    <section className='sec-card'>
      <div className='sec-head' style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className='badge'>{n}</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Tái khám</h2>
        </div>
        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{new Date(v.visitDate).toLocaleDateString('vi-VN')}</span>
      </div>
      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ReadBlock label='Lâm sàng' value={v.examination || v.illness} />
        <ReadBlock label='Xét nghiệm' value={v.labResults} />
        <ReadBlock label='Kết luận' value={v.diagnosis} />
        <ReadBlock label='Kế hoạch điều trị tiếp' value={v.nextPlan} />
        {v.note && <ReadBlock label='Ghi chú' value={v.note} />}
      </div>
    </section>
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

  if (loading && !profile) {
    return <div className='sec-card' style={{ padding: 20, color: 'var(--ink-soft)' }}>Đang tải hồ sơ...</div>;
  }
  if (!profile) {
    return <div className='sec-card' style={{ padding: 20, color: 'var(--ink-soft)' }}>Chưa có thông tin hồ sơ.</div>;
  }

  const visits: any[] = profile.visits || [];
  const firstVisit = [...visits].reverse().find((v) => v.type === 'FIRST');
  const followups = visits.filter((v) => v.type === 'FOLLOWUP');
  const year = profile.user?.dob && /^\d{4}$/.test(profile.user.dob) ? Number(profile.user.dob) : null;
  const age = year !== null ? new Date().getFullYear() - year : null;
  const emergency = profile.emergencyContactName
    ? `${profile.emergencyContactName}${profile.emergencyContactPhone ? ' — ' + profile.emergencyContactPhone : ''}`
    : 'Chưa cập nhật';

  return (
    <>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--teal)', textTransform: 'uppercase' }}>
          Khoa Xạ trị &amp; Ung bướu
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700 }}>Hồ sơ bệnh án</h1>
        <div style={{ marginTop: 2, fontSize: 13.5, color: 'var(--ink-soft)' }}>Dữ liệu do bác sĩ ghi nhận — chỉ xem</div>
      </div>

      <div style={{ display: 'flex', gap: 26, borderBottom: '1px solid var(--line)' }}>
        <button type='button' className={tab === 'personal' ? 'tabbtn active' : 'tabbtn'} onClick={() => setTab('personal')}>
          Thông tin cá nhân
        </button>
        <button type='button' className={tab === 'medical' ? 'tabbtn active' : 'tabbtn'} onClick={() => setTab('medical')}>
          Thông tin bệnh
        </button>
        <button type='button' className='ghostbtn' style={{ marginLeft: 'auto', alignSelf: 'center' }} onClick={load}>
          Cập nhật
        </button>
      </div>

      {tab === 'personal' && (
        <section className='sec-card'>
          <div className='sec-head'>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Thông tin cá nhân</h2>
          </div>
          <dl className='info-grid'>
            <div className='info-item'><dt>Họ và tên</dt><dd>{profile.user?.name || 'Chưa cập nhật'}</dd></div>
            <div className='info-item'><dt>Năm sinh</dt><dd>{year ? `${year}${age !== null ? ` (${age} tuổi)` : ''}` : 'Chưa cập nhật'}</dd></div>
            <div className='info-item'><dt>Email</dt><dd>{profile.user?.email || 'Chưa cập nhật'}</dd></div>
            <div className='info-item'><dt>Số điện thoại</dt><dd>{profile.user?.phone || 'Chưa cập nhật'}</dd></div>
            <div className='info-item'><dt>Địa chỉ</dt><dd>{profile.address || 'Chưa cập nhật'}</dd></div>
            <div className='info-item'><dt>Người liên hệ khẩn cấp</dt><dd>{emergency}</dd></div>
            <div className='info-item'><dt>Mã bệnh án</dt><dd>{profile.patientCode}</dd></div>
            <div className='info-item'><dt>Bác sĩ điều trị</dt><dd>{profile.doctor?.user?.name || 'Chưa chỉ định'}</dd></div>
          </dl>
        </section>
      )}

      {tab === 'medical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {!firstVisit && followups.length === 0 && (
            <div className='sec-card' style={{ padding: 22, color: 'var(--ink-soft)' }}>Bác sĩ chưa ghi nhận lượt khám nào.</div>
          )}
          {firstVisit && <FirstVisitSections v={firstVisit} />}
          {followups.map((v, idx) => (
            <FollowupCard key={v.id} v={v} n={followups.length - idx} />
          ))}
        </div>
      )}
    </>
  );
}
