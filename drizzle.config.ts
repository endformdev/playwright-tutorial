import type { Config } from "drizzle-kit";
import { resolveDrizzleKitDatabaseUrl } from "./lib/db/config";

const databaseUrl = resolveDrizzleKitDatabaseUrl();
const authToken = process.env.DATABASE_AUTH_TOKEN;

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
