import { NextResponse } from "next/server";
import { getCurrentSession, Role, SessionPayload } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function requireRole(
  ...roles: Role[]
): Promise<{ session: SessionPayload } | { response: NextResponse }> {
  const session = await getCurrentSession();
  if (!session || !roles.includes(session.role)) {
    return {
      response: NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 }),
    };
  }
  return { session };
}

/**
 * Giống requireRole, nhưng tra thêm Ma trận phân quyền (PermissionMatrix) cho module này.
 * Dùng cho các route mà UI "Ma trận phân quyền" hứa là "áp dụng ngay vào kiểm tra ở server".
 */
export async function requireModule(
  moduleId: string,
  ...roles: Role[]
): Promise<{ session: SessionPayload } | { response: NextResponse }> {
  const auth = await requireRole(...roles);
  if ("response" in auth) return auth;

  const allowed = await hasPermission(moduleId, auth.session.role);
  if (!allowed) {
    return {
      response: NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 }),
    };
  }
  return auth;
}
