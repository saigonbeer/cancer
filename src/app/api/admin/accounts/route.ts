import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { requireRole } from "@/lib/requireRole";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if ("response" in auth) return auth.response;

  const users = await prisma.user.findMany({
    select: { id: true, name: true, dob: true, email: true, role: true, username: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ accounts: users });
}

const createSchema = z.object({
  name: z.string().min(1),
  dob: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["DOCTOR", "PATIENT", "ADMIN"]),
  username: z.string().min(3),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const { name, dob, email, role, username, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Username đã tồn tại." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      dob: dob || null,
      email: email || null,
      role,
      username,
      passwordHash,
      ...(role === "DOCTOR" ? { doctorProfile: { create: {} } } : {}),
      ...(role === "PATIENT"
        ? { patientProfile: { create: { patientCode: `BN-${Math.floor(1000 + Math.random() * 9000)}` } } }
        : {}),
    },
    select: { id: true, name: true, dob: true, email: true, role: true, username: true, createdAt: true },
  });

  return NextResponse.json({ account: user }, { status: 201 });
}
