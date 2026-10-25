# CLAUDE.md — Quy ước dự án Onco EMR

## Cấu trúc thư mục

```
src/
  app/
    (auth)/login/page.tsx
    (doctor)/dashboard|patients|medications|side-effects|appointments|messages|reports/page.tsx
    (patient)/dashboard|record|medications|side-effects|schedule|messages|education/page.tsx
    (admin)/accounts|catalog|permissions/page.tsx
    api/**/route.ts        <- Controller layer only
  services/                <- Business logic (KHÔNG đặt trong route.ts)
  models/                  <- Prisma query helpers theo entity
  components/              <- UI tái dùng theo mockup (sidebar, pill, stat card, modal...)
  lib/
    auth.ts                <- hash/verify password, sign/verify JWT
    rbac.ts                <- check permission qua PermissionMatrix
    db.ts                  <- Prisma client singleton
```

## Nguyên tắc code

- **Không đặt business logic trong `route.ts`**. Route chỉ: parse request → gọi service → trả JSON. Logic thật (tính tuân thủ thuốc, check tương tác, CTCAE…) nằm ở `src/services/*`.
- **RBAC luôn tra `PermissionMatrix` trong DB**, không hard-code `if (role === 'DOCTOR')` để chặn/mở chức năng. Có thể hard-code để điều hướng UI, nhưng chặn ở server luôn qua bảng phân quyền.
- **Không log dữ liệu y tế cá nhân (PHI)** ra console/log provider — chỉ log id, không log tên/triệu chứng/nội dung chat.
- **Mật khẩu**: luôn hash bằng bcrypt (`cost >= 10`), không bao giờ trả `passwordHash` ra API response.
- **Validation**: dùng Zod cho mọi input ở route layer trước khi vào service.
- **Giao diện**: bám đúng màu/spacing/copy tiếng Việt đã có trong artifact gốc (teal `#0E6E66` / `#0A534D`, nền `#F5F7F6`, pill trạng thái, sidebar cố định). Không tự đổi câu chữ tiếng Việt đã thiết kế.
- **Mỗi module xong phải có**: ít nhất 1 test cho service logic nhạy cảm (tương tác thuốc, RBAC, tính tuân thủ) trước khi coi là "done" trong PLAN.md.

## Quy trình khi thêm module mới

1. Cập nhật `prisma/schema.prisma` nếu cần, tạo migration.
2. Viết service trước (có test), rồi route gọi service.
3. Viết UI gọi route qua fetch/React Query.
4. Review lại: RBAC đã chặn đúng chưa, lỗi input đã validate chưa, PHI có bị log không.
5. Tick vào `PLAN.md`.

## Lệnh thường dùng

```bash
npm run dev
npx prisma migrate dev --name <ten>
npx prisma studio
npm run build
```
