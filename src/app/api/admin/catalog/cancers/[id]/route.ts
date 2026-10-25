import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { makeCatalogHandlers } from "@/lib/catalogCrud";

const schema = z.object({
  name: z.string().min(1),
  stage: z.string().optional(),
  description: z.string().optional(),
});

const h = makeCatalogHandlers(prisma.catalogCancerType, schema);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return h.update(req, id);
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return h.remove(id);
}
