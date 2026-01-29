import { z } from "zod";

/**
 * Schema for validating bucket_value (Fibonacci sequence)
 * Valid values: null (unestimated), 0, 1, 2, 3, 5, 8, 13, 21
 */
export const bucketValueSchema = z
  .union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(5),
    z.literal(8),
    z.literal(13),
    z.literal(21),
    z.null(),
  ])
  .nullable();

/**
 * Schema for validating card creation request body
 * Used in: POST /api/sessions/:sessionId/cards
 */
export const cardCreateSchema = z.object({
  external_id: z.string().min(1, "external_id is required"),
  title: z.string().min(1, "title is required"),
  description: z.string().nullable().optional(),
});

/**
 * Schema for validating query parameters for GET /api/sessions/:sessionId/cards
 * Allows filtering by bucket_value
 */
export const cardsQuerySchema = z.object({
  bucket_value: bucketValueSchema.optional(),
});

/**
 * Schema for validating card update request body
 * Used in: PATCH /api/sessions/:sessionId/cards/:id
 * All fields are optional, but at least one must be provided
 */
export const cardUpdateSchema = z
  .object({
    title: z.string().min(1, "title must not be empty").optional(),
    description: z.string().nullable().optional(),
    bucket_value: bucketValueSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/**
 * Schema for validating sessionId parameter from URL
 * Ensures sessionId is a valid UUID format
 */
export const sessionIdParamSchema = z.string().uuid("Invalid session ID format");

/**
 * Schema for validating card ID parameter from URL
 * Ensures id is a valid UUID format
 */
export const cardIdParamSchema = z.string().uuid("Invalid card ID format");
