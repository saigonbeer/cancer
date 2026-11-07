'use client';

import { useEffect, useState } from 'react';

type Profile = {
  name: string;
  dob: string | null;
  email: string | null;
  phone: string | null;
  username: string;
  doctorProfile: { department: string | null } | null;
};

const fieldStyle: React.CSSProperties = {
  width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', background: '#fff',
};

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/doctor/profile')
      .then((r) => r.json())
      .then((data) => setProfile(data.profile))
      .finally(() => setLoading(false));
  }, []);

  async function submitPasswordChange() {
    setPwError(null);
    setPwMessage(null);
    if (!currentPassword.trim() || !newPassword.trim()) {
      setPwError('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Mật khẩu mới cần tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Xác nhận mật khẩu mới không khớp.');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/doctor/profile/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setPwError(data.error || 'Không đổi được mật khẩu.');
      return;
    }
    setPwMessage('Đã đổi mật khẩu thành công.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Hồ sơ cá nhân</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Thông tin tài khoản của bạn. Liên hệ quản trị viên nếu cần cập nhật các trường bên dưới.
        </div>
      </div>

      <section className='sec-card'>
        <div className='sec-head'>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Thông tin tài khoản</h2>
        </div>
        {loading ? (
          <div style={{ padding: 22, color: 'var(--ink-soft)' }}>Đang tải...</div>
        ) : (
          <dl className='info-grid'>
            <div className='info-item'><dt>Họ và tên</dt><dd>{profile?.name || 'Chưa cập nhật'}</dd></div>
            <div className='info-item'><dt>Năm sinh</dt><dd>{profile?.dob || 'Chưa cập nhật'}</dd></div>
            <div className='info-item'><dt>Email</dt><dd>{profile?.email || 'Chưa cập nhật'}</dd></div>
            <div className='info-item'><dt>Số điện thoại</dt><dd>{profile?.phone || 'Chưa cập nhật'}</dd></div>
            <div className='info-item'><dt>Khoa/Chuyên khoa</dt><dd>{profile?.doctorProfile?.department || 'Chưa cập nhật'}</dd></div>
            <div className='info-item'><dt>Tên đăng nhập</dt><dd>{profile?.username}</dd></div>
          </dl>
        )}
      </section>

      <section className='sec-card'>
        <div className='sec-head'>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Đổi mật khẩu</h2>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 360 }}>
          <div>
            <label className='field-label'>Mật khẩu hiện tại</label>
            <input type='password' value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label className='field-label'>Mật khẩu mới (tối thiểu 6 ký tự)</label>
            <input type='password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label className='field-label'>Xác nhận mật khẩu mới</label>
            <input type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={fieldStyle} />
          </div>
          {pwError && <div style={{ color: 'var(--red)', fontSize: 13 }}>{pwError}</div>}
          {pwMessage && <div style={{ color: 'var(--teal-deep)', fontSize: 13, fontWeight: 600 }}>{pwMessage}</div>}
          <div>
            <button type='button' className='addbtn' onClick={submitPasswordChange} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
