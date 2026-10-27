import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function PatientDashboard() {
  const session = await getCurrentSession();

  const profile = session
    ? await prisma.patientProfile.findUnique({
        where: { userId: session.userId },
        include: {
          doctor: { include: { user: { select: { name: true, phone: true } } } },
          visits: { orderBy: { visitDate: 'desc' }, take: 1 },
          sideEffectReports: { orderBy: { createdAt: 'desc' }, take: 3 }
        }
      })
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--teal)', textTransform: 'uppercase' }}>
          Cổng Thông Tin Bệnh Nhân
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700 }}>Chào {session?.name}</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Mã bệnh nhân: <strong>{profile?.patientCode || 'Chưa cấp'}</strong> • Bác sĩ điều trị: <strong>{profile?.doctor?.user?.name || 'Đang cập nhật'}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className='sec-card' style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>Lần khám gần nhất</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--teal)', marginTop: 8 }}>
            {profile?.visits?.[0] ? new Date(profile.visits[0].visitDate).toLocaleDateString('vi-VN') : 'Chưa có'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
            {profile?.visits?.[0]?.diagnosis || 'Theo dõi định kỳ'}
          </div>
        </div>

        <div className='sec-card' style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>Báo cáo phản ứng phụ</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--amber)', marginTop: 8 }}>
            {profile?.sideEffectReports?.length || 0} lần
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Đã ghi nhận trong hồ sơ</div>
        </div>

        <div className='sec-card' style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>Đường dây hỗ trợ khẩn cấp</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)', marginTop: 8 }}>
            {profile?.doctor?.user?.phone || '1900 6868'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Khoa Xạ trị & Ung bướu</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        <div className='sec-card' style={{ padding: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 16px 0' }}>Tiện ích cho bệnh nhân</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href='/patient/record' className='addbtn' style={{ fontSize: 13 }}>
              Xem Hồ sơ Bệnh án
            </Link>
            <Link href='/patient/side-effects' className='ghostbtn' style={{ fontSize: 13, color: 'var(--red)', borderColor: 'var(--red)' }}>
              + Báo cáo Tác dụng phụ
            </Link>
            <Link href='/patient/medications' className='ghostbtn' style={{ fontSize: 13 }}>
              Đơn thuốc cần uống
            </Link>
            <Link href='/patient/schedule' className='ghostbtn' style={{ fontSize: 13 }}>
              Đặt lịch hẹn khám
            </Link>
            <Link href='/patient/messages' className='ghostbtn' style={{ fontSize: 13 }}>
              Nhắn tin với Bác sĩ
            </Link>
            <Link href='/patient/education' className='ghostbtn' style={{ fontSize: 13 }}>
              Cẩm nang dinh dưỡng & ung thư
            </Link>
          </div>
        </div>

        <div className='sec-card' style={{ padding: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px 0' }}>Lưu ý an toàn quan trọng</h2>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            • Nếu sốt ≥ 38°C hoặc nôn ói nhiều không thể uống nước, hãy liên hệ ngay với Bác sĩ hoặc đến viện cấp cứu.<br />
            • Uống thuốc đủ liều, đúng giờ theo phác đồ hướng dẫn.<br />
            • Thông báo với bác sĩ mọi triệu chứng bất thường sau mỗi chu kỳ hóa trị.
          </div>
        </div>
      </div>
    </div>
  );
}