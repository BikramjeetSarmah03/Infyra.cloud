import { createRouter } from "@/core/router";
import type { AuthedEnv } from "@/core/types";

import { requireAuth } from "./auth.middleware";
import { meRoute } from "./auth.routes";
import { authService } from "./auth.service";

/**
 * Auth module router. Mounted by the platform module, which owns the
 * `/api/platform` prefix.
 */
export function authModule() {
  const router = createRouter<AuthedEnv>();

  router.use("/me", requireAuth);

  router.openapi(meRoute, (c) =>
    c.json(
      authService.me({ user: c.get("user"), session: c.get("session") }),
      200,
    ),
  );

  return router;
}
