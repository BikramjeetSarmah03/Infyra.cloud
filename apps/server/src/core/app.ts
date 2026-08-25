import { auth } from "@infyra/auth";
import { env } from "@infyra/env/server";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { HttpError } from "./errors";
import { createRouter } from "./router";

const OPENAPI_DOC_PATH = "/api/openapi.json";
const DOCS_PATH = "/api/docs";
const AUTH_OPENAPI_DOC_PATH = "/api/auth-openapi.json";
const AUTH_DOCS_PATH = "/api/docs/auth";

/**
 * Builds the root application: shared middleware, the auth passthrough handler,
 * the OpenAPI document and the Scalar reference UI. Modules are mounted by the
 * caller so this file never needs to know which modules exist.
 */
export function createApp() {
  const app = createRouter();

  app.use(logger());
  // Scoped to the API surface rather than "/*" so the docs pages and the
  // OpenAPI documents they fetch stay same-origin. A blanket CORS layer would
  // answer those same-origin fetches without an allow-origin header (the
  // browser sends this server's own origin, which is not CORS_ORIGIN) and
  // Scalar would fail to load the document.
  app.use(
    "/api/platform/*",
    cors({
      origin: env.CORS_ORIGIN,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  // Better Auth owns its own routes; it is mounted before the modules so the
  // module routers never shadow /api/auth/*.
  app.use(
    "/api/auth/*",
    cors({
      origin: env.CORS_ORIGIN,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );
  app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  app.onError((err, c) => {
    if (err instanceof HttpError) {
      return c.json({ code: err.code, message: err.message }, err.status);
    }

    console.error(err);
    return c.json(
      { code: "INTERNAL" as const, message: "Internal server error" },
      HttpError.statusFor("INTERNAL"),
    );
  });

  app.notFound((c) =>
    c.json(
      { code: "NOT_FOUND" as const, message: "Route not found" },
      HttpError.statusFor("NOT_FOUND"),
    ),
  );

  return app;
}

/**
 * Attaches the generated OpenAPI document and the Scalar reference UI. Call
 * this after all modules are mounted so every route appears in the document.
 */
export function mountDocs(app: ReturnType<typeof createApp>) {
  app.openAPIRegistry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "better-auth.session_token",
  });

  app.doc(OPENAPI_DOC_PATH, {
    openapi: "3.1.0",
    info: {
      version: "0.1.0",
      title: "Infyra API",
      description: "HTTP API for the Infyra platform.",
    },
    servers: [{ url: env.BETTER_AUTH_URL, description: env.NODE_ENV }],
  });

  // Better Auth generates its own 3.1.1 spec covering the /api/auth/* routes.
  // It is served as a separate document rather than merged: the two specs have
  // independent `servers` bases, so merging would require rewriting every path.
  app.get(AUTH_OPENAPI_DOC_PATH, async (c) =>
    c.json(await auth.api.generateOpenAPISchema()),
  );

  // Both documents are listed as sources on each page, so the Scalar sidebar
  // can switch between them and either URL is a valid entry point.
  const sources = [
    { title: "Infyra API", url: OPENAPI_DOC_PATH, default: true },
    { title: "Authentication", url: AUTH_OPENAPI_DOC_PATH },
  ];

  app.get(DOCS_PATH, Scalar({ sources, pageTitle: "Infyra API" }));

  app.get(
    AUTH_DOCS_PATH,
    Scalar({
      sources: [
        { title: "Authentication", url: AUTH_OPENAPI_DOC_PATH, default: true },
        { title: "Infyra API", url: OPENAPI_DOC_PATH },
      ],
      pageTitle: "Infyra API — Authentication",
    }),
  );

  return app;
}
