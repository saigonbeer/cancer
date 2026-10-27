'use client';

import { useEffect, useState } from 'react';

export default function PatientMedicationsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/patient/medications');
    const data = await res.json();
    setPrescriptions(data.prescriptions || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Lịch Uống Thuốc & Đơn Hóa Trị</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Danh sách thuốc cần dùng và hướng dẫn chi tiết từ Bác sĩ điều trị
        </div>
      </div>

      <div className='sec-card' style={{ padding: 20 }}>
        {loading ? (
          <div style={{ color: 'var(--ink-soft)' }}>Đang tải danh sách thuốc...</div>
        ) : prescriptions.length === 0 ? (
          <div style={{ color: 'var(--ink-soft)' }}>Bạn chưa có đơn thuốc nào trong hệ thống.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {prescriptions.map((pr) => (
              <div key={pr.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    Bác sĩ chỉ định: {pr.prescribedBy || 'Bác sĩ điều trị'}
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                    Ngày kê: {new Date(pr.prescribedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pr.items?.map((it: any) => (
                    <div
                      key={it.id}
                      style={{
                        background: 'var(--bg)',
                        padding: 12,
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--teal)' }}>
                          {it.drugName}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>
                          Liều lượng: <strong>{it.dose || '1'}{it.unit || 'viên'}</strong> • Tần suất: <strong>{it.frequency || 'Hàng ngày'}</strong>
                        </div>
                      </div>
                      <span className='pill' style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                        Dùng {it.duration || 'Theo hướng dẫn'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}