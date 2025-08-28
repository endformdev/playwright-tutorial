import type { Config } from "drizzle-kit";

const databaseUrl =
	process.env.DATABASE_URL || "file:./local-sqlite-database.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

// For Turso connections, we need to include the auth token
const dbCredentials =
	databaseUrl.startsWith("libsql://") && authToken
		? { url: databaseUrl, authToken }
		: { url: databaseUrl };

const isTurso = databaseUrl.startsWith("libsql://");

export default {
	schema: "./lib/db/schema.ts",
	out: "./lib/db/migrations",
	dialect: isTurso ? "turso" : "sqlite",
	dbCredentials,
} satisfies Config;
