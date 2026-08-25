import { createRoute } from "@hono/zod-openapi";
import { errorSchema, meResponseSchema } from "@infyra/schema";

const TAGS = ["Auth"];

/**
 * Route contracts for the auth module. Definitions live apart from handlers so
 * the OpenAPI document and the platform client read from one description.
 */
export const meRoute = createRoute({
  method: "get",
  path: "/me",
  tags: TAGS,
  summary: "Current session",
  description: "Returns the signed-in user and their active session.",
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: "The active session.",
      content: { "application/json": { schema: meResponseSchema } },
    },
    401: {
      description: "No valid session.",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});
