import { z } from "zod";
import { prisma } from "@/lib/db";
import { makeCatalogHandlers } from "@/lib/catalogCrud";

const schema = z.object({
  name: z.string().min(1),
  group: z.string().optional(),
  subGroup: z.string().optional(),
  abbreviation: z.string().optional(),
  alternateNames: z.string().optional(),
  primarySite: z.string().optional(),
  histology: z.string().optional(),
  description: z.string().optional(),
  note: z.string().optional(),
  source: z.string().optional(),
});

const h = makeCatalogHandlers(prisma.catalogDrug, schema);
export const POST = h.importRows;
