import { NextResponse } from "next/server";
import { getCurrentSession, Role, SessionPayload } from "@/lib/auth";

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
