import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { MODULES, DEFAULT_PERMISSIONS } from "@/lib/modules";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if ("response" in auth) return auth.response;

  const rows = await prisma.permissionMatrix.findMany();
  const byKey = new Map(rows.map((r) => [`${r.module}:${r.role}`, r.allowed]));

  const matrix = MODULES.map((m) => ({
    module: m.id,
    label: m.label,
    ADMIN: byKey.get(`${m.id}:ADMIN`) ?? DEFAULT_PERMISSIONS[m.id].ADMIN,
    DOCTOR: byKey.get(`${m.id}:DOCTOR`) ?? DEFAULT_PERMISSIONS[m.id].DOCTOR,
    PATIENT: byKey.get(`${m.id}:PATIENT`) ?? DEFAULT_PERMISSIONS[m.id].PATIENT,
  }));

  return NextResponse.json({ matrix });
}

const toggleSchema = z.object({
  module: z.string().min(1),
  role: z.enum(["ADMIN", "DOCTOR", "PATIENT"]),
  allowed: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const { module, role, allowed } = parsed.data;
  await prisma.permissionMatrix.upsert({
    where: { module_role: { module, role } },
    create: { module, role, allowed },
    update: { allowed },
  });

  return NextResponse.json({ ok: true });
}
