import { z } from "zod";
import { prisma } from "@/lib/db";
import { makeCatalogHandlers } from "@/lib/catalogCrud";

const schema = z.object({
  name: z.string().min(1),
  order: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : v), z.coerce.number().int().optional()),
  stage: z.string().optional(),
  description: z.string().optional(),
  group: z.string().optional(),
});

const h = makeCatalogHandlers(prisma.catalogCancerType, schema);
export const POST = h.importRows;
