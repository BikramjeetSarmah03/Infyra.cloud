import { createRouter } from "@/core/router";

import { authModule } from "./auth/auth.module";

/**
 * Platform bounded context. Owns the `/auth` sub-router today; further platform
 * modules mount here so the root app only ever knows about the context.
 */
export function platformModule() {
  const router = createRouter();

  router.route("/auth", authModule());

  return router;
}
