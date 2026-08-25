import { z } from "@hono/zod-openapi";

export const sessionUserSchema = z
  .object({
    id: z.string().openapi({ example: "usr_01H8XY" }),
    email: z.email().openapi({ example: "ada@infyra.dev" }),
    name: z.string().openapi({ example: "Ada Lovelace" }),
    image: z.string().nullable().openapi({ example: null }),
    emailVerified: z.boolean().openapi({ example: true }),
    createdAt: z.coerce.date().openapi({ type: "string", format: "date-time" }),
  })
  .openapi("SessionUser");

export const sessionSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    expiresAt: z.coerce.date().openapi({ type: "string", format: "date-time" }),
  })
  .openapi("Session");

/** Shape returned by `GET /api/platform/auth/me`. */
export const meResponseSchema = z
  .object({
    user: sessionUserSchema,
    session: sessionSchema,
  })
  .openapi("MeResponse");

export type SessionUser = z.infer<typeof sessionUserSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
