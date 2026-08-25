import type { auth } from "@infyra/auth";

type Auth = typeof auth;

/**
 * Variables every request carries. `user`/`session` are populated by the
 * `requireAuth` middleware and stay null on public routes.
 */
export type AppVariables = {
  user: Auth["$Infer"]["Session"]["user"] | null;
  session: Auth["$Infer"]["Session"]["session"] | null;
};

export type AppEnv = {
  Variables: AppVariables;
};

/** Variables guaranteed non-null once `requireAuth` has run. */
export type AuthedEnv = {
  Variables: {
    user: NonNullable<AppVariables["user"]>;
    session: NonNullable<AppVariables["session"]>;
  };
};
