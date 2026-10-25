# PLAN.md — Onco EMR

Hệ thống quản lý điều trị bệnh nhân ung thư, 3 vai trò (Bác sĩ / Bệnh nhân / Quản trị viên) + màn Đăng nhập, dựa trên mockup đã thiết kế trong Artifact "Form Bệnh Án Oncology".

## 1. Kiến trúc

- **Framework**: Next.js 15 (App Router, TypeScript) — một repo full-stack, deploy thẳng lên Vercel.
- **Database**: PostgreSQL trên Supabase (free tier).
- **ORM**: Prisma.
- **Auth**: tự viết — bảng `User` lưu `username` + `password_hash` (bcrypt), phát hành JWT ký bằng `JWT_SECRET`, lưu trong httpOnly cookie. Middleware đọc cookie, decode JWT, gắn `role` + `userId` vào request.
- **Kiến trúc MVC trong Next.js**:
  - **Model**: `prisma/schema.prisma` + `src/models/*` (truy vấn Prisma, không raw SQL rời rạc).
  - **Controller**: `src/app/api/**/route.ts` — nhận request, gọi service, trả response. Không chứa business logic phức tạp.
  - **Service**: `src/services/*` — business logic thật (kiểm tra tương tác thuốc, tính tuân thủ, RBAC check qua `permissions_matrix`).
  - **View**: `src/app/(doctor|patient|admin)/**/page.tsx` + `src/components/*`.
- **RBAC**: không hard-code theo role trong code — mọi route kiểm tra qua bảng `PermissionMatrix` (module, role, allowed).

## 2. Schema database (tóm tắt — chi tiết trong `prisma/schema.prisma`)

- `User` (id, name, dob, email, phone, username, passwordHash, role: DOCTOR|PATIENT|ADMIN, createdAt)
- `PatientProfile` (userId, mã BN, địa chỉ, người liên hệ khẩn cấp, bác sĩ phụ trách)
- `MedicalRecord` → `Visit` (type: FIRST|FOLLOWUP, ngày) → `TreatmentPlan` (6 mục: surgery/radio/chemo/immuno/targeted/hormone, lưu JSON chi tiết từng mục) → `Prescription` → `PrescriptionItem`
- `DrugInteraction` (drugAId, drugBId, severity: LOW|MEDIUM|HIGH, description)
- `SideEffectReport` (patientId, symptom, ctcaeGrade, site, photoUrl, cycle, status, note, createdAt)
- `Appointment` (patientId, doctorId, type, datetime, location, status)
- `Conversation` + `ConversationParticipant` + `Message`
- `Notification` + `NotificationRecipient`
- `CatalogDrug` (name, group, description)
- `CatalogCancerType` (name, stage, description)
- `CatalogSymptom` (name, group, description)
- `CatalogRegimen` (name, description)
- `PermissionMatrix` (module, role, allowed)

## 3. Lộ trình triển khai

**Giai đoạn 0 — Hạ tầng** (xong)
- [x] Scaffold Next.js + Prisma + cấu trúc thư mục MVC.
- [x] Schema Prisma đầy đủ (chưa chạy migration — cần `DATABASE_URL` thật, xem DEPLOY.md).
- [x] Auth (đăng nhập, JWT cookie, middleware chặn theo role/prefix route).
- [x] Layout 3 vai trò (sidebar, theme teal theo mockup) + trang stub cho các module chưa xây.
- [x] Quản trị viên: Quản lý tài khoản (CRUD), Danh mục (4 loại, CRUD), Ma trận phân quyền (toggle, lưu DB).
- [x] Seed script tạo admin mặc định + ma trận phân quyền mặc định.

**Giai đoạn 1 — Bác sĩ & Bệnh nhân: Hồ sơ bệnh án**
- Form Khám lần đầu / Tái khám, 6 mục phương pháp điều trị, bảng đơn thuốc, cảnh báo tương tác thuốc tự động (tra `DrugInteraction`).
- Trang Hồ sơ bệnh án chỉ xem cho Bệnh nhân.

**Giai đoạn 2 — Thuốc, Tác dụng phụ, Lịch hẹn**
- Đơn đã kê, tuân thủ thuốc, kiểm tra tương tác thuốc.
- Báo cáo tác dụng phụ (upload ảnh lên Supabase Storage), hàng chờ xem xét, so sánh chu kỳ.
- Đặt lịch / duyệt lịch hẹn.

**Giai đoạn 3 — Liên lạc & Thông báo**
- Chat (polling hoặc Supabase Realtime), giới hạn danh bạ theo vai trò.
- Gửi thông báo hàng loạt.

**Giai đoạn 4 — Quản trị viên & Báo cáo**
- CRUD tài khoản, danh mục, ma trận phân quyền (ghi vào `PermissionMatrix`, middleware đọc lại ngay).
- Trang báo cáo thống kê.

## 4. Biến môi trường cần thiết

- `DATABASE_URL` — connection string Supabase Postgres (dùng pooled connection cho serverless).
- `JWT_SECRET` — chuỗi bí mật ký JWT.
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — nếu dùng Supabase Storage cho ảnh tác dụng phụ.

## 5. Trạng thái hiện tại

Xem mục đã tick ở trên. Cập nhật file này mỗi khi hoàn thành một giai đoạn.
