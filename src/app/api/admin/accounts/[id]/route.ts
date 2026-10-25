import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { requireRole } from "@/lib/requireRole";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  dob: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["DOCTOR", "PATIENT", "ADMIN"]).optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("ADMIN");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const { password, email, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (email !== undefined) data.email = email || null;
  if (password) data.passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, dob: true, email: true, role: true, username: true, createdAt: true },
    });
    return NextResponse.json({ account: user });
  } catch {
    return NextResponse.json({ error: "Không tìm thấy tài khoản hoặc username đã tồn tại." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("ADMIN");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  }
}
