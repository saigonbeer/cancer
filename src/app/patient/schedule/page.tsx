'use client';

import { useEffect, useState } from 'react';

export default function PatientSchedulePage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [type, setType] = useState('Tái khám định kỳ');
  const [datetime, setDatetime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/patient/appointments');
    const data = await res.json();
    setAppointments(data.appointments || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function cancelAppointment(id: string) {
    if (!confirm('Bạn có chắc muốn hủy lịch hẹn này?')) return;
    await fetch('/api/patient/appointments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: id })
    });
    load();
  }

  async function handleSubmit() {
    if (!datetime || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/patient/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, datetime, reason })
      });
      if (res.ok) {
        setShowModal(false);
        setDatetime('');
        setReason('');
        load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Lịch Hẹn Khám & Truyền Dịch</h1>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
            Theo dõi trạng thái lịch hẹn và chủ động đăng ký tái khám với Bác sĩ
          </div>
        </div>
        <button type='button' className='addbtn' onClick={() => setShowModal(true)}>
          + Đặt Lịch Hẹn Mới
        </button>
      </div>

      <div className='sec-card' style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0' }}>Lịch Hẹn Của Bạn</h2>
        {loading ? (
          <div style={{ color: 'var(--ink-soft)' }}>Đang tải lịch hẹn...</div>
        ) : appointments.length === 0 ? (
          <div style={{ color: 'var(--ink-soft)' }}>Bạn chưa có lịch hẹn nào.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {appointments.map((a) => (
              <div
                key={a.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>
                    {a.type} • Bác sĩ {a.doctor?.name || 'phụ trách'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
                    Thời gian: {a.datetime ? new Date(a.datetime).toLocaleString('vi-VN') : 'Chưa định ngày'} • Địa điểm: {a.location || 'Khoa Ung Bướu'}
                  </div>
                  {a.reason && (
                    <div style={{ fontSize: 12.5, color: 'var(--ink)', marginTop: 4 }}>
                      Lý do hẹn: {a.reason}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className='pill'
                    style={{
                      background:
                        a.status === 'APPROVED'
                          ? 'var(--teal-tint)'
                          : a.status === 'REJECTED'
                          ? 'var(--red-tint)'
                          : 'var(--amber-tint)',
                      color:
                        a.status === 'APPROVED'
                          ? 'var(--teal)'
                          : a.status === 'REJECTED'
                          ? 'var(--red)'
                          : 'var(--amber)'
                    }}
                  >
                    {a.status === 'APPROVED'
                      ? 'Bác sĩ đã xác nhận'
                      : a.status === 'REJECTED'
                      ? 'Bị từ chối'
                      : 'Đang chờ bác sĩ duyệt'}
                  </span>
                  {a.status === 'PENDING' && (
                    <button
                      type='button'
                      className='ghostbtn'
                      style={{ fontSize: 12, padding: '5px 12px', color: 'var(--red)', borderColor: 'var(--red)' }}
                      onClick={() => cancelAppointment(a.id)}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className='sec-card' style={{ width: 480, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>Đăng Ký Lịch Hẹn</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className='field-label'>Loại lịch hẹn</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)' }}
                >
                  <option value='Tái khám định kỳ'>Tái khám định kỳ</option>
                  <option value='Truyền hóa chất chu kỳ tiếp'>Truyền hóa chất chu kỳ tiếp</option>
                  <option value='Khám khi có triệu chứng lạ'>Khám khi có triệu chứng lạ</option>
                  <option value='Tư vấn kết quả xét nghiệm'>Tư vấn kết quả xét nghiệm</option>
                </select>
              </div>

              <div>
                <label className='field-label'>Ngày và giờ mong muốn</label>
                <input
                  type='datetime-local'
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)' }}
                />
              </div>

              <div>
                <label className='field-label'>Ghi chú / Lý do khám</label>
                <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder='Mô tả mong muốn hoặc vấn đề cần trao đổi...' />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type='button' className='ghostbtn' onClick={() => setShowModal(false)}>Hủy</button>
                <button type='button' className='addbtn' onClick={handleSubmit} disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Hẹn'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}