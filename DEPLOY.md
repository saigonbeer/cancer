# Hướng dẫn deploy Onco EMR lên GitHub + Supabase + Vercel (free)

## Bước 1 — Tạo database trên Supabase

1. Vào https://supabase.com → đăng ký/đăng nhập → **New project**.
2. Đặt tên project, chọn mật khẩu database (ghi lại, sẽ cần dùng), chọn region gần (ví dụ Singapore).
3. Chờ project khởi tạo (1–2 phút).
4. Vào **Project Settings → Database**. Ở mục **Connection string**:
   - Copy chuỗi **Transaction pooler** (port 6543) → dùng cho `DATABASE_URL`.
   - Copy chuỗi **Direct connection** (port 5432) → dùng cho `DIRECT_URL`.
   - Thay `[YOUR-PASSWORD]` trong chuỗi bằng mật khẩu database bạn đã đặt ở bước 2.

## Bước 2 — Tạo repo GitHub

1. Vào https://github.com/new → tạo repo mới (ví dụ `onco-emr`), để **Private** hoặc Public tùy bạn, **không** tick "Add README" (project đã có sẵn).
2. Trong máy bạn, ở thư mục `onco-emr`, chạy:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Onco EMR scaffold"
   git branch -M main
   git remote add origin https://github.com/<your-username>/onco-emr.git
   git push -u origin main
   ```

## Bước 3 — Cấu hình môi trường cục bộ & tạo bảng

1. Copy `.env.example` thành `.env`, điền `DATABASE_URL`, `DIRECT_URL` (từ Supabase) và `JWT_SECRET` (chuỗi ngẫu nhiên bất kỳ, ví dụ chạy `openssl rand -base64 32`).
2. Cài dependencies: `npm install`.
3. Tạo bảng trong Supabase từ schema Prisma:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Tạo tài khoản admin mặc định + ma trận phân quyền:
   ```bash
   npm run db:seed
   ```
   → Tạo tài khoản `admin` / `admin123`. **Đổi mật khẩu này ngay sau khi đăng nhập lần đầu** (sửa qua trang Quản lý tài khoản, hoặc chạy lại script với mật khẩu khác).
5. Chạy thử cục bộ: `npm run dev` → mở http://localhost:3000/login, đăng nhập bằng `admin` / `admin123`.

## Bước 4 — Deploy lên Vercel (free)

1. Vào https://vercel.com → đăng nhập bằng GitHub.
2. **Add New → Project** → chọn repo `onco-emr` vừa push.
3. Ở phần **Environment Variables**, thêm đúng 3 biến từ file `.env` của bạn:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
4. Bấm **Deploy**. Vercel sẽ tự chạy `npm install` (kéo theo `prisma generate` qua hook `postinstall`) và `npm run build`.
5. Sau khi deploy xong, mở domain Vercel cấp (dạng `onco-emr-xxx.vercel.app`) → vào `/login` → đăng nhập bằng tài khoản admin đã seed ở Bước 3.

> Lưu ý: migrate (`prisma migrate dev`) chạy ở máy bạn, nhắm vào database Supabase qua `DIRECT_URL` — Vercel không tự chạy migrate, nên mỗi khi đổi `schema.prisma`, bạn chạy `npx prisma migrate dev` ở máy mình trước khi deploy.

## Bước 5 — Sau khi deploy

- Đăng nhập bằng `admin`, vào **Quản lý tài khoản** để tạo tài khoản Bác sĩ/Bệnh nhân thật, đổi mật khẩu admin.
- Vào **Ma trận phân quyền** để xem/điều chỉnh quyền theo vai trò nếu cần.
- Theo dõi lộ trình các module còn lại trong `PLAN.md`.
