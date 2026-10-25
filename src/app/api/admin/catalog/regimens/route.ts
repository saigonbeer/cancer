import { z } from "zod";
import { prisma } from "@/lib/db";
import { makeCatalogHandlers } from "@/lib/catalogCrud";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const h = makeCatalogHandlers(prisma.catalogRegimen, schema);
export const GET = h.list;
export const POST = h.create;
