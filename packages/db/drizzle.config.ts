import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
	path: "../../apps/server/.env",
});

export default defineConfig({
	schema: "./src/schema",
	out: "./src/migrations",
	dialect: "postgresql",
	dbCredentials: {
		// drizzle-kit's CLI (push/generate/migrate) connects over plain
		// Postgres wire protocol, which hangs/fails against Neon's pooled
		// endpoint. The app itself keeps using the pooled DATABASE_URL via
		// @neondatabase/serverless (packages/db/src/index.ts) — only CLI
		// tooling needs the direct, unpooled connection.
		url: process.env.DATABASE_URL_DIRECT || "",
	},
});
