'use client';

import { useEffect, useState } from 'react';

export default function DoctorMedicationsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPatients() {
    setLoading(true);
    const res = await fetch('/api/doctor/patients');
    const data = await res.json();
    const list = data.patients || [];
    setPatients(list);
    if (list.length > 0) {
      setSelectedPatientId(list[0].id);
      loadPrescriptions(list[0].id);
    }
    setLoading(false);
  }

  async function loadPrescriptions(pid: string) {
    if (!pid) return;
    const res = await fetch('/api/doctor/medications?patientId=' + pid);
    const data = await res.json();
    setPrescriptions(data.prescriptions || []);
  }

  useEffect(() => {
    loadPatients();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Quản lý Đơn thuốc & Phác đồ Dược</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Theo dõi lịch sử kê đơn, danh mục thuốc đã cấp và kiểm tra tương tác thuốc
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div className='sec-card' style={{ padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Chọn Bệnh nhân</div>
          {loading ? (
            <div style={{ color: 'var(--ink-soft)' }}>Đang tải...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {patients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    loadPrescriptions(p.id);
                  }}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: selectedPatientId === p.id ? 'var(--teal-tint)' : '#fff',
                    border: '1px solid var(--line)',
                    fontWeight: 600,
                    fontSize: 13.5
                  }}
                >
                  {p.user?.name} ({p.patientCode})
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='sec-card' style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0' }}>Lịch sử Đơn thuốc</h2>
          {prescriptions.length === 0 ? (
            <div style={{ color: 'var(--ink-soft)' }}>Bệnh nhân này chưa có đơn thuốc nào.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {prescriptions.map((pr) => (
                <div key={pr.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      Bác sĩ kê: {pr.prescribedBy || 'Bác sĩ điều trị'}
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                      Ngày kê: {new Date(pr.prescribedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 8 }}>
                    {pr.items?.map((it: any) => (
                      <div key={it.id} style={{ fontSize: 13, padding: '4px 0' }}>
                        • <strong>{it.drugName}</strong>: {it.dose || ''} {it.unit || ''} | {it.frequency || 'Hàng ngày'} | {it.duration || 'Theo chỉ định'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}