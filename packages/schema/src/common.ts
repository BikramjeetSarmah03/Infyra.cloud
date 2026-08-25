import { z } from "@hono/zod-openapi";

/**
 * Envelope every handler uses to report a failure. Kept in the shared package so
 * the platform can narrow on `code` without duplicating the shape.
 */
export const errorSchema = z
  .object({
    code: z.string().openapi({ example: "BAD_REQUEST" }),
    message: z.string().openapi({ example: "Invalid request payload" }),
    issues: z
      .array(
        z.object({
          path: z.string(),
          message: z.string(),
        }),
      )
      .optional(),
  })
  .openapi("Error");

export type ErrorResponse = z.infer<typeof errorSchema>;
