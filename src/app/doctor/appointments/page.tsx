'use client';

import { useEffect, useState } from 'react';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  SCHEDULED: 'Đã xếp lịch',
  COMPLETED: 'Đã khám xong',
  CANCELLED: 'Đã hủy',
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  PENDING: { background: 'var(--amber-tint)', color: 'var(--amber)' },
  APPROVED: { background: 'var(--teal-tint)', color: 'var(--teal)' },
  REJECTED: { background: 'var(--red-tint)', color: 'var(--red)' },
  SCHEDULED: { background: 'var(--teal-tint)', color: 'var(--teal)' },
  COMPLETED: { background: 'var(--purple-tint)', color: 'var(--purple)' },
  CANCELLED: { background: 'var(--bg)', color: 'var(--ink-soft)' },
};

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/doctor/appointments');
    const data = await res.json();
    setAppointments(data.appointments || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(appointmentId: string, status: string) {
    await fetch('/api/doctor/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, status })
    });
    load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Quản lý Lịch hẹn & Hội chẩn</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Duyệt hoặc xếp lịch tái khám, truyền hóa chất cho bệnh nhân
        </div>
      </div>

      <div className='sec-card' style={{ padding: 20 }}>
        {loading ? (
          <div style={{ color: 'var(--ink-soft)' }}>Đang tải...</div>
        ) : appointments.length === 0 ? (
          <div style={{ color: 'var(--ink-soft)' }}>Chưa có lịch hẹn nào.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {appointments.map((a) => (
              <div
                key={a.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {a.patient?.name} ({a.type})
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                    Thời gian: {a.datetime ? new Date(a.datetime).toLocaleString('vi-VN') : 'Chưa định ngày'} • Địa điểm: {a.location || 'Khoa Ung Bướu'}
                  </div>
                  {a.reason && (
                    <div style={{ fontSize: 12.5, color: 'var(--ink)', marginTop: 4 }}>
                      Lý do: {a.reason}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className='pill' style={STATUS_STYLE[a.status as string] || STATUS_STYLE.PENDING}>
                    {STATUS_LABEL[a.status as string] || 'Chờ duyệt'}
                  </span>

                  {a.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type='button'
                        className='addbtn'
                        style={{ fontSize: 12, padding: '6px 12px' }}
                        onClick={() => updateStatus(a.id, 'APPROVED')}
                      >
                        Duyệt
                      </button>
                      <button
                        type='button'
                        className='ghostbtn'
                        style={{ fontSize: 12, padding: '6px 12px', color: 'var(--red)' }}
                        onClick={() => updateStatus(a.id, 'REJECTED')}
                      >
                        Từ chối
                      </button>
                    </div>
                  )}

                  {a.status === 'APPROVED' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type='button'
                        className='addbtn'
                        style={{ fontSize: 12, padding: '6px 12px' }}
                        onClick={() => updateStatus(a.id, 'COMPLETED')}
                      >
                        Đánh dấu đã khám
                      </button>
                      <button
                        type='button'
                        className='ghostbtn'
                        style={{ fontSize: 12, padding: '6px 12px', color: 'var(--red)' }}
                        onClick={() => updateStatus(a.id, 'CANCELLED')}
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}