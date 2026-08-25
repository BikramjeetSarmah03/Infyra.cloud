import { auth } from "@infyra/auth";
import { createMiddleware } from "hono/factory";

import { HttpError } from "@/core/errors";
import type { OrgEnv } from "@/core/types";

/**
 * Resolves the caller's active organization and puts its id on the context.
 *
 * Every tenant-scoped query filters on this value, so "no active organization"
 * is treated as an error rather than a supported state — code that has to
 * handle a null tenant everywhere is how missing filters slip through. Clients
 * hitting FORBIDDEN here should send the user to /onboarding.
 */
export const requireOrg = createMiddleware<OrgEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) throw HttpError.unauthorized();

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    throw new HttpError(
      "FORBIDDEN",
      "No active organization. Complete onboarding first.",
    );
  }

  c.set("user", session.user);
  c.set("session", session.session);
  c.set("organizationId", organizationId);

  await next();
});
