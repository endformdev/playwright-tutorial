import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import {
	type AsyncBatchRemoteCallback,
	type AsyncRemoteCallback,
	drizzle as drizzleProxy,
} from "drizzle-orm/sqlite-proxy";
import { resolveRuntimeDatabaseConfig } from "./config";
import * as schema from "./schema";

dotenv.config();

type QueryMethod = Parameters<AsyncRemoteCallback>[2];
type BatchQuery = Parameters<AsyncBatchRemoteCallback>[0][number];
type ProxyQueryResult = Awaited<ReturnType<AsyncRemoteCallback>>;

const databaseConfig = resolveRuntimeDatabaseConfig();

function getProxyEndpoint(proxyUrl: string, pathname: "/query" | "/batch") {
	return new URL(pathname, ensureTrailingSlash(proxyUrl)).toString();
}

async function executeProxyQuery(
	sql: string,
	params: unknown[],
	method: QueryMethod,
): Promise<ProxyQueryResult> {
	const proxyUrl =
		databaseConfig.mode === "proxy" ? databaseConfig.proxyUrl : undefined;

	if (!proxyUrl) {
		throw new Error("Remote SQLite proxy is not configured for this runtime");
	}

	const response = await fetch(getProxyEndpoint(proxyUrl, "/query"), {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({ sql, params, method }),
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await buildProxyError(response));
	}

	return (await response.json()) as ProxyQueryResult;
}

async function executeProxyBatch(
	queries: BatchQuery[],
): Promise<ProxyQueryResult[]> {
	const proxyUrl =
		databaseConfig.mode === "proxy" ? databaseConfig.proxyUrl : undefined;

	if (!proxyUrl) {
		throw new Error("Remote SQLite proxy is not configured for this runtime");
	}

	const response = await fetch(getProxyEndpoint(proxyUrl, "/batch"), {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({ queries }),
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await buildProxyError(response));
	}

	return (await response.json()) as ProxyQueryResult[];
}

async function buildProxyError(response: Response) {
	const text = await response.text();
	return `Remote SQLite proxy request failed (${response.status} ${response.statusText}): ${text}`;
}

function ensureTrailingSlash(url: string) {
	return url.endsWith("/") ? url : `${url}/`;
}

function createDatabase() {
	if (databaseConfig.mode === "proxy") {
		return drizzleProxy(executeProxyQuery, executeProxyBatch, { schema });
	}

	const client = createClient(
		databaseConfig.mode === "turso"
			? {
					url: databaseConfig.databaseUrl,
					authToken: databaseConfig.authToken,
				}
			: {
					url: databaseConfig.databaseUrl,
				},
	);

	return drizzleLibsql(client, { schema });
}

export const db = createDatabase();
