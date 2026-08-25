import { auth } from "@infyra/auth";
import { createMiddleware } from "hono/factory";

import { HttpError } from "@/core/errors";
import type { AppEnv, AuthedEnv } from "@/core/types";

/**
 * Resolves the Better Auth session and puts it on the context without
 * rejecting anonymous requests. Use on routes that behave differently when
 * signed in but do not require it.
 */
export const withSession = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);

  await next();
});

/** Rejects the request unless a valid session is present. */
export const requireAuth = createMiddleware<AuthedEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) throw HttpError.unauthorized();

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
});
