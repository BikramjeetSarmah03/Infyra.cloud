import { createDb } from "@infyra/db";
import * as schema from "@infyra/db/schema/auth";
import { env } from "@infyra/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    // Exposes generateOpenAPISchema(); the built-in Scalar page is disabled
    // because the server serves this spec under its own /api/docs routes.
    plugins: [openAPI({ disableDefaultReference: true })],
  });
}

export const auth = createAuth();
