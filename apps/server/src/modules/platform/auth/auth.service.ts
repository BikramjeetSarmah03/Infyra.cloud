import type { MeResponse } from "@infyra/schema";

import type { AuthedEnv } from "@/core/types";

type Ctx = AuthedEnv["Variables"];

/**
 * Domain logic for the auth module. Handlers stay thin by delegating here, and
 * this layer is free of Hono types beyond the resolved session values.
 */
export const authService = {
  /** Projects the raw session onto the shared `MeResponse` contract. */
  me({ user, session }: Ctx): MeResponse {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image ?? null,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      session: {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
      },
    };
  },
};
