# PLAN.md — Onco EMR

Hệ thống quản lý điều trị bệnh nhân ung thư, 3 vai trò (Bác sĩ / Bệnh nhân / Quản trị viên) + Màn đăng nhập, dựa trên mockup đã thiết kế trong Artifact " Form Bệnh Án Oncology\.

## 1. Kiến trúc

- **Framework**: Next.js 15/16 (App Router, TypeScript) — một repo full-stack, deploy thẳng lên Vercel.
- **Database**: PostgreSQL trên Supabase.
- **ORM**: Prisma.
- **Auth**: tự viết — bảng User lưu username + password_hash (bcrypt), phát hành JWT ký bằng JWT_SECRET, lưu trong httpOnly cookie. Middleware đọc cookie, decode JWT, gắn ole + userId vào request.
- **Kiến trúc MVC trong Next.js**:
 - **Model**: prisma/schema.prisma + Prisma query helpers.
 - **Controller**: src/app/api/**/route.ts — nhận request, gọi service, trả response. Không chứa business logic phức tạp.
 - **Service**: src/services/* — business logic thật (kiểm tra tương tác thuốc, tính tuân thủ, RBAC check qua permissions_matrix).
 - **View**: src/app/(doctor|patient|admin)/**/page.tsx + src/components/*.
- **RBAC**: không hard-code theo role trong code — mọi route kiểm tra qua bảng PermissionMatrix (module, role, allowed).

## 2. Trạng thái Triển khai (HOÀN TẤT)

- [x] **Giai đoạn 0 — Hạ tầng & Quản trị**:
 - [x] Scaffold Next.js + Prisma + kiến trúc MVC.
 - [x] Database Supabase + Migrations + Seed admin mặc định & ma trận phân quyền.
 - [x] Auth (Đăng nhập, JWT cookie, middleware chặn theo role).
 - [x] Phân hệ Quản trị viên: Quản lý tài khoản (CRUD), Danh mục (4 loại: Thuốc, Ung thư, Triệu chứng, Phác đồ), Ma trận phân quyền động.

- [x] **Giai đoạn 1 & 2 — Bác sĩ & Lâm sàng**:
 - [x] Dashboard Bác sĩ: 4 ô chỉ số (Bệnh nhân điều trị, Cảnh báo khẩn, Lịch hẹn hôm nay, Hóa trị tuần này).
 - [x] Hồ sơ bệnh án & Danh sách bệnh nhân phụ trách.
 - [x] Tạo lượt khám mới (Khám lần đầu / Tái khám, 6 phương pháp điều trị: Hóa trị, Phẫu thuật, Xạ trị...).
 - [x] Kê đơn thuốc điện tử & Kiểm tra tương tác thuốc 2 chiều tự động.
 - [x] Hàng đợi xem xét tác dụng phụ theo phân độ CTCAE v5.0 (Cảnh báo khẩn Độ ≥ 3).
 - [x] Quản lý & duyệt lịch hẹn bệnh nhân.
 - [x] Báo cáo thống kê lâm sàng & phân bố giai đoạn bệnh.

- [x] **Giai đoạn 3 — Cổng Thông tin Bệnh nhân (Patient Portal)**:
 - [x] Dashboard Bệnh nhân với thông tin bác sĩ điều trị và chỉ số sức khỏe.
 - [x] Tra cứu Hồ sơ bệnh án điện tử, diễn biến bệnh qua các lượt khám.
 - [x] Lịch uống thuốc chi tiết theo đơn đã kê.
 - [x] Báo cáo tác dụng phụ sau điều trị gửi trực tiếp cho bác sĩ.
 - [x] Đăng ký & theo dõi lịch hẹn tái khám / truyền hóa chất.
 - [x] Kênh nhắn tin bảo mật trực tiếp với Bác sĩ điều trị.
 - [x] Cẩm nang giáo dục sức khỏe, dinh dưỡng và an toàn hóa trị.

## 3. Xác nhận Build & Kiểm thử
- Toàn bộ 43/43 routes (Pages & API endpoints) đã compile thành công 100% không có lỗi TypeScript hay cú pháp.