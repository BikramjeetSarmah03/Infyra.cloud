import { z } from "zod";

const schema = z.object({
	VITE_SERVER_URL: z.url(),
});

function readRuntimeEnv() {
	const raw: Record<string, string | undefined> = {};
	for (const key of Object.keys(schema.shape)) {
		const value = import.meta.env[key];
		raw[key] = value === "" ? undefined : value;
	}
	return raw;
}

export const env = schema.parse(readRuntimeEnv());
