import { prisma } from "@/lib/db";
import type { Role } from "@/lib/auth";

/**
 * Tra quyền truy cập 1 module theo vai trò từ bảng PermissionMatrix.
 * Nếu chưa có dòng cấu hình cho (module, role), mặc định KHÔNG cho phép
 * (fail-closed) — admin phải cấu hình rõ qua Ma trận phân quyền.
 */
export async function hasPermission(module: string, role: Role): Promise<boolean> {
  const row = await prisma.permissionMatrix.findUnique({
    where: { module_role: { module, role } },
  });
  return row?.allowed ?? false;
}

export async function assertPermission(module: string, role: Role) {
  const allowed = await hasPermission(module, role);
  if (!allowed) {
    throw new ForbiddenError(`Vai trò ${role} không có quyền truy cập module ${module}`);
  }
}

export class ForbiddenError extends Error {}
