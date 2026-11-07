import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireModule } from "@/lib/requireRole";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Delegate = {
  findMany: (args?: any) => Promise<unknown[]>;
  count: (args?: any) => Promise<number>;
  create: (args: any) => Promise<unknown>;
  createMany: (args: any) => Promise<{ count: number }>;
  update: (args: any) => Promise<unknown>;
  delete: (args: any) => Promise<unknown>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const PAGE_SIZE = 25;

export function makeCatalogHandlers<T extends z.ZodRawShape>(delegate: Delegate, schema: z.ZodObject<T>) {
  /**
   * Hỗ trợ ?q= (tìm theo tên) và ?page= (phân trang 25/trang). Không truyền q/page
   * thì trả về toàn bộ danh sách như trước (các tab danh mục đơn giản không gửi 2 tham số này).
   */
  async function list(req?: NextRequest) {
    const auth = await requireModule("catalog", "ADMIN");
    if ("response" in auth) return auth.response;

    const q = req?.nextUrl.searchParams.get("q")?.trim();
    const pageParam = req?.nextUrl.searchParams.get("page");

    const where = q ? { name: { contains: q, mode: "insensitive" as const } } : undefined;

    if (!pageParam) {
      const items = await delegate.findMany({ where, orderBy: { name: "asc" } });
      return NextResponse.json({ items, total: items.length });
    }

    const page = Math.max(1, Number(pageParam) || 1);
    const [items, total] = await Promise.all([
      delegate.findMany({ where, orderBy: { name: "asc" }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
      delegate.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE });
  }

  async function create(req: NextRequest) {
    const auth = await requireModule("catalog", "ADMIN");
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
    const auth = await requireModule("catalog", "ADMIN");
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
    const auth = await requireModule("catalog", "ADMIN");
    if ("response" in auth) return auth.response;
    try {
      await delegate.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Không tìm thấy mục." }, { status: 404 });
    }
  }

  /** Import hàng loạt từ các dòng đã được chuẩn hoá phía client (đọc từ Excel). Bỏ qua dòng trùng tên. */
  async function importRows(req: NextRequest) {
    const auth = await requireModule("catalog", "ADMIN");
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => null);
    const parsed = z.object({ rows: z.array(schema).min(1, "Không có dòng dữ liệu hợp lệ nào để import.") }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu import không hợp lệ." }, { status: 400 });
    }

    const result = await delegate.createMany({ data: parsed.data.rows, skipDuplicates: true });
    return NextResponse.json({ ok: true, imported: result.count, skipped: parsed.data.rows.length - result.count });
  }

  return { list, create, update, remove, importRows };
}
