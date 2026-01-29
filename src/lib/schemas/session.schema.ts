import { z } from "zod";

/**
 * Validation schema for POST /api/sessions request payload
 */
export const SessionCreateSchema = z.object({
  context: z.string().nullable().optional(),
});

/**
 * Validation schema for GET /api/sessions query parameters
 */
export const SessionsQuerySchema = z.object({
  is_active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (val === "true") return true;
      if (val === "false") return false;
      throw new Error("Must be 'true' or 'false'");
    }),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .default("0")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0)),
});

/**
 * Validation schema for session ID path parameter
 */
export const SessionIdSchema = z.string().uuid();

/**
 * Validation schema for PATCH /api/sessions/:id request payload
 */
export const SessionUpdateSchema = z
  .object({
    context: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
