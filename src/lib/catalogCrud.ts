import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/requireRole";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Delegate = {
  findMany: (args?: any) => Promise<unknown[]>;
  create: (args: any) => Promise<unknown>;
  update: (args: any) => Promise<unknown>;
  delete: (args: any) => Promise<unknown>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export function makeCatalogHandlers<T extends z.ZodRawShape>(delegate: Delegate, schema: z.ZodObject<T>) {
  async function list() {
    const auth = await requireRole("ADMIN");
    if ("response" in auth) return auth.response;
    const items = await delegate.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ items });
  }

  async function create(req: NextRequest) {
    const auth = await requireRole("ADMIN");
    if ("response" in auth) return auth.response;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." }, { status: 400 });
    }
    try {
      const item = await delegate.create({ data: parsed.data });
      return NextResponse.json({ item }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "Tên đã tồn tại trong danh mục." }, { status: 409 });
    }
  }

  async function update(req: NextRequest, id: string) {
    const auth = await requireRole("ADMIN");
    if ("response" in auth) return auth.response;
    const body = await req.json().catch(() => null);
    const parsed = schema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    }
    try {
      const item = await delegate.update({ where: { id }, data: parsed.data });
      return NextResponse.json({ item });
    } catch {
      return NextResponse.json({ error: "Không tìm thấy mục." }, { status: 404 });
    }
  }

  async function remove(id: string) {
    const auth = await requireRole("ADMIN");
    if ("response" in auth) return auth.response;
    try {
      await delegate.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Không tìm thấy mục." }, { status: 404 });
    }
  }

  return { list, create, update, remove };
}
