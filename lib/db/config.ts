import path from "node:path";

export const DEFAULT_DATABASE_PROXY_URL =
	"https://playwright-tutorial-sqlite-db-every-hour-cleanup.endform.dev";

export const DEFAULT_LOCAL_DATABASE_PATH = path.join(
	process.cwd(),
	"local-sqlite-database.db",
);

type DatabaseConfig =
	| {
			mode: "proxy";
			proxyUrl: string;
	  }
	| {
			mode: "turso";
			databaseUrl: string;
			authToken?: string;
	  }
	| {
			mode: "local";
			databaseUrl: string;
	  };

export function resolveRuntimeDatabaseConfig(): DatabaseConfig {
	const databaseUrl = process.env.DATABASE_URL?.trim();
	const authToken = process.env.DATABASE_AUTH_TOKEN?.trim();

	if (!databaseUrl) {
		return {
			mode: "proxy",
			proxyUrl: DEFAULT_DATABASE_PROXY_URL,
		};
	}

	if (databaseUrl.startsWith("libsql://")) {
		return {
			mode: "turso",
			databaseUrl,
			authToken,
		};
	}

	if (databaseUrl.startsWith("https://") || databaseUrl.startsWith("http://")) {
		return {
			mode: "proxy",
			proxyUrl: databaseUrl,
		};
	}

	return {
		mode: "local",
		databaseUrl: normalizeLocalDatabaseUrl(databaseUrl),
	};
}

export function resolveDrizzleKitDatabaseUrl() {
	const databaseUrl = process.env.DATABASE_URL?.trim();

	if (!databaseUrl) {
		return "file:./local-sqlite-database.db";
	}

	if (databaseUrl.startsWith("libsql://")) {
		return databaseUrl;
	}

	if (databaseUrl.startsWith("https://") || databaseUrl.startsWith("http://")) {
		return "file:./local-sqlite-database.db";
	}

	return normalizeLocalDatabaseUrl(databaseUrl);
}

export function getLocalDatabasePath() {
	return DEFAULT_LOCAL_DATABASE_PATH;
}

function normalizeLocalDatabaseUrl(databaseUrl: string) {
	return databaseUrl.startsWith("file:") ? databaseUrl : `file:${databaseUrl}`;
}
