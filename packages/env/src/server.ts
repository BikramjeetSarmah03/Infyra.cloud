import "dotenv/config";
import { z } from "zod";

const schema = z.object({
	DATABASE_URL: z.string().min(1),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.url(),
	CORS_ORIGIN: z.url(),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
});

function readRuntimeEnv() {
	const raw: Record<string, string | undefined> = {};
	for (const key of Object.keys(schema.shape)) {
		const value = process.env[key];
		raw[key] = value === "" ? undefined : value;
	}
	return raw;
}

export const env = process.env.SKIP_ENV_VALIDATION
	? (readRuntimeEnv() as z.infer<typeof schema>)
	: schema.parse(readRuntimeEnv());
