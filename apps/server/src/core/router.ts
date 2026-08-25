import { OpenAPIHono } from "@hono/zod-openapi";

import { HttpError } from "./errors";
import type { AppEnv } from "./types";

/**
 * Factory for every module router. Routing through one factory keeps the
 * generic env and the validation-error shape identical across modules, so
 * sub-routers mount onto the root app without type friction.
 */
export function createRouter<E extends AppEnv = AppEnv>() {
  return new OpenAPIHono<E>({
    defaultHook: (result, c) => {
      if (result.success) return;

      return c.json(
        {
          code: "VALIDATION_ERROR" as const,
          message: "Request validation failed",
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        HttpError.statusFor("VALIDATION_ERROR"),
      );
    },
  });
}

export type AppRouter = ReturnType<typeof createRouter>;
