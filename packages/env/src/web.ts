import { z } from "zod";

const schema = z.object({
  VITE_SERVER_URL: z.url(),
});

const rawViteServerUrl = import.meta.env.VITE_SERVER_URL;

export const env = schema.parse({
  VITE_SERVER_URL: rawViteServerUrl === "" ? undefined : rawViteServerUrl,
});
