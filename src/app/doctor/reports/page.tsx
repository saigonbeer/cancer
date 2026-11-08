'use client';

import { useEffect, useState } from 'react';

export default function DoctorReportsPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/doctor/reports');
    const data = await res.json();
    setStats(data.stats || null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Báo cáo Thống kê & Phân tích Lâm sàng</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Tổng quan số liệu ca bệnh, lượt khám và tỷ lệ phản ứng phụ
        </div>
      </div>

      {loading ? (
        <div className='sec-card' style={{ padding: 20, color: 'var(--ink-soft)' }}>Đang tổng hợp số liệu...</div>
      ) : !stats ? (
        <div className='sec-card' style={{ padding: 20, color: 'var(--ink-soft)' }}>Không có dữ liệu báo cáo.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className='sec-card' style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Tổng số Bệnh nhân</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--teal)', marginTop: 6 }}>
                {stats.totalPatients}
              </div>
            </div>

            <div className='sec-card' style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Tổng số Lượt khám</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--amber)', marginTop: 6 }}>
                {stats.totalVisits}
              </div>
            </div>

            <div className='sec-card' style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Tổng Đơn thuốc đã kê</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--purple)', marginTop: 6 }}>
                {stats.totalPrescriptions}
              </div>
            </div>

            <div className='sec-card' style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Báo cáo Tác dụng phụ</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--red)', marginTop: 6 }}>
                {stats.totalSideEffects}
              </div>
            </div>
          </div>

          <div className='sec-card' style={{ padding: 22 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px 0' }}>Phân bố bệnh nhân theo Loại ung thư</h2>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 12 }}>
              Tính theo lượt khám lần đầu đã gán Loại ung thư trong danh mục chuẩn.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(!stats.stages || stats.stages.length === 0) && (
                <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Chưa có lượt khám nào gán Loại ung thư theo danh mục.</div>
              )}
              {stats.stages?.map((s: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{s.name}{s.stage ? ` · ${s.stage}` : ''}</span>
                  <span className='pill' style={{ background: 'var(--teal-tint)', color: 'var(--teal)' }}>
                    {s.patientCount} bệnh nhân
                  </span>
                </div>
              ))}
              {stats.firstVisitsWithoutCancerType > 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--amber)', marginTop: 8 }}>
                  {stats.firstVisitsWithoutCancerType} lượt khám lần đầu chưa gán Loại ung thư theo danh mục.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}