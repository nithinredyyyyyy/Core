import { z } from "zod";

// Query parameters must be scalar decimal integers. Coercion alone accepts
// arrays, booleans and empty strings, and SQLite treats LIMIT -1 as unlimited.
const integer = z.union([
  z.number(),
  z.string().regex(/^\d+$/).transform(Number),
]).pipe(z.number().int().safe().nonnegative());

export function paginationSchema({ defaultLimit = 100, maxLimit = 500 } = {}) {
  return z.object({
    limit: integer.refine((value) => value > 0)
      .transform((value) => Math.min(value, maxLimit)).default(defaultLimit),
    skip: integer.pipe(z.number().max(1_000_000)).default(0),
  });
}

export const searchQuerySchema = z.object({
  q: z.string().trim().max(200).default(""),
  limit: paginationSchema({ defaultLimit: 10, maxLimit: 20 }).shape.limit,
});
