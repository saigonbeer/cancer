'use client';

import { useEffect, useState } from 'react';

export default function PatientRecordPage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/patient/record');
    const data = await res.json();
    setProfile(data.profile || null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Hồ sơ Bệnh án Điện tử</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Tra cứu thông tin chẩn đoán, diễn biến bệnh và lịch sử các đợt khám
        </div>
      </div>

      {loading ? (
        <div className='sec-card' style={{ padding: 20, color: 'var(--ink-soft)' }}>Đang tải hồ sơ...</div>
      ) : !profile ? (
        <div className='sec-card' style={{ padding: 20, color: 'var(--ink-soft)' }}>Chưa có thông tin hồ sơ.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className='sec-card' style={{ padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>Thông tin Hành chính & Điều trị</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, fontSize: 13.5 }}>
              <div><strong>Họ và tên:</strong> {profile.user?.name}</div>
              <div><strong>Mã bệnh nhân:</strong> {profile.patientCode}</div>
              <div><strong>Ngày sinh:</strong> {profile.user?.dob || 'Chưa cập nhật'}</div>
              <div><strong>Số điện thoại:</strong> {profile.user?.phone || 'Chưa cập nhật'}</div>
              <div><strong>Bác sĩ điều trị:</strong> {profile.doctor?.user?.name || 'Chưa chỉ định'}</div>
              <div><strong>Liên hệ khẩn cấp:</strong> {profile.emergencyContactName || 'Gia đình'} ({profile.emergencyContactPhone || 'N/A'})</div>
            </div>
          </div>

          <div className='sec-card' style={{ padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0' }}>Lịch sử Khám bệnh & Diễn biến Điều trị</h2>
            {profile.visits?.length === 0 ? (
              <div style={{ color: 'var(--ink-soft)' }}>Chưa có lượt khám nào được ghi nhận.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {profile.visits.map((v: any) => (
                  <div key={v.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className='pill' style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                        {v.type === 'FIRST' ? 'Khám Lần Đầu' : 'Tái Khám'}
                      </span>
                      <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                        Ngày khám: {new Date(v.visitDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                      <strong>Chẩn đoán:</strong> {v.diagnosis || 'Đang cập nhật'}<br />
                      <strong>Bệnh sử & Triệu chứng:</strong> {v.illness || v.history || 'Không có ghi nhận đặc biệt'}<br />
                      <strong>Kết quả cận lâm sàng:</strong> {v.labResults || 'Chưa có xét nghiệm'}<br />
                      <strong>Hướng điều trị:</strong> {v.nextPlan || 'Tiếp tục theo dõi'}
                    </div>

                    {v.treatmentPlans && v.treatmentPlans.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {v.treatmentPlans[0].chemoOn && (
                          <span className='pill' style={{ background: 'var(--purple-tint)', color: 'var(--purple)' }}>Phác đồ Hóa trị</span>
                        )}
                        {v.treatmentPlans[0].surgeryOn && (
                          <span className='pill' style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}>Phẫu thuật</span>
                        )}
                        {v.treatmentPlans[0].radioOn && (
                          <span className='pill' style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>Xạ trị</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}