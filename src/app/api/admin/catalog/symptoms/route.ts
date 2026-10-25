import { z } from "zod";
import { prisma } from "@/lib/db";
import { makeCatalogHandlers } from "@/lib/catalogCrud";

const schema = z.object({
  name: z.string().min(1),
  group: z.string().optional(),
  description: z.string().optional(),
});

const h = makeCatalogHandlers(prisma.catalogSymptom, schema);
export const GET = h.list;
export const POST = h.create;
