# Onco EMR

Hệ thống quản lý điều trị bệnh nhân ung thư — 3 vai trò (Bác sĩ / Bệnh nhân / Quản trị viên) + màn Đăng nhập, xây bằng Next.js + Prisma + PostgreSQL (Supabase), deploy free trên Vercel.

- Kiến trúc & lộ trình: xem [`PLAN.md`](./PLAN.md)
- Quy ước code: xem [`CLAUDE.md`](./CLAUDE.md)
- Hướng dẫn deploy GitHub/Supabase/Vercel: xem [`DEPLOY.md`](./DEPLOY.md)

## Chạy cục bộ

```bash
cp .env.example .env   # điền DATABASE_URL, DIRECT_URL, JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run db:seed        # tạo tài khoản admin/admin123 mặc định
npm run dev
```

Mở http://localhost:3000/login.

## Trạng thái hiện tại

Đã hoàn thành: Đăng nhập (JWT + cookie, RBAC theo vai trò), toàn bộ **Quản trị viên** (Quản lý tài khoản, Danh mục, Ma trận phân quyền).

Các module lâm sàng (Hồ sơ bệnh án, Thuốc, Tác dụng phụ, Lịch hẹn, Liên lạc, Báo cáo, Thông tin giáo dục) đang hiển thị trang tạm "đang xây dựng" — xem lộ trình chi tiết trong `PLAN.md`.
