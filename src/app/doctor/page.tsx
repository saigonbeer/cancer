import { getCurrentSession } from '@/lib/auth';
import { getDoctorDashboardStats } from '@/services/doctor.service';
import Link from 'next/link';

export default async function DoctorDashboard() {
  const session = await getCurrentSession();
  const stats = session
    ? await getDoctorDashboardStats(session.userId)
    : { activePatients: 0, urgentAlerts: 0, todayAppointments: 0, weeklyChemo: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--teal)', textTransform: 'uppercase' }}>
          Khoa Xạ trị & Ung bướu
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700 }}>Chào Bác sĩ {session?.name}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className='sec-card' style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>Bệnh nhân đang điều trị</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--teal)', marginTop: 8 }}>{stats.activePatients}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Phụ trách trực tiếp</div>
        </div>

        <div className='sec-card' style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>Cảnh báo tác dụng phụ</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: stats.urgentAlerts > 0 ? 'var(--red)' : 'var(--teal)', marginTop: 8 }}>
            {stats.urgentAlerts}
          </div>
          <div style={{ fontSize: 12, color: stats.urgentAlerts > 0 ? 'var(--red)' : 'var(--ink-soft)', marginTop: 4 }}>
            {stats.urgentAlerts > 0 ? 'Cần xử trí CTCAE Độ ≥ 3' : 'Không có ca khẩn'}
          </div>
        </div>

        <div className='sec-card' style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>Lịch hẹn hôm nay</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--amber)', marginTop: 8 }}>{stats.todayAppointments}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Khám & hội chẩn</div>
        </div>

        <div className='sec-card' style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>Hóa trị tuần này</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--purple)', marginTop: 8 }}>{stats.weeklyChemo}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Theo phác đồ</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        <div className='sec-card' style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Hành động lâm sàng nhanh</h2>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href='/doctor/patients' className='addbtn' style={{ fontSize: 13 }}>
              Hồ sơ bệnh nhân
            </Link>
            <Link href='/doctor/side-effects' className='ghostbtn' style={{ fontSize: 13 }}>
              Hàng đợi tác dụng phụ ({stats.urgentAlerts})
            </Link>
            <Link href='/doctor/appointments' className='ghostbtn' style={{ fontSize: 13 }}>
              Xem lịch hẹn
            </Link>
            <Link href='/doctor/messages' className='ghostbtn' style={{ fontSize: 13 }}>
              Trao đổi bệnh nhân
            </Link>
          </div>
        </div>

        <div className='sec-card' style={{ padding: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px 0' }}>An toàn lâm sàng & Quy chuẩn</h2>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            • Hệ thống tự động kiểm tra tương tác thuốc 2 chiều trước khi phát hành đơn.<br />
            • Cảnh báo CTCAE v6.0 mức độ nặng được đẩy tự động lên hàng đợi ưu tiên.<br />
            • Bảo vệ dữ liệu y tế nhạy cảm (Nghị định 13/2023/NĐ-CP).
          </div>
        </div>
      </div>
    </div>
  );
}