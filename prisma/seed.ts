import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MODULES, DEFAULT_PERMISSIONS } from "../src/lib/modules";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        name: "Quản trị viên",
        username: "admin",
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log("Đã tạo tài khoản admin mặc định: username=admin, password=admin123");
  } else {
    console.log("Tài khoản admin đã tồn tại, bỏ qua.");
  }

  for (const m of MODULES) {
    const defaults = DEFAULT_PERMISSIONS[m.id];
    for (const role of ["ADMIN", "DOCTOR", "PATIENT"] as const) {
      await prisma.permissionMatrix.upsert({
        where: { module_role: { module: m.id, role } },
        create: { module: m.id, role, allowed: defaults[role] },
        update: {},
      });
    }
  }
  console.log("Đã khởi tạo ma trận phân quyền mặc định.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
