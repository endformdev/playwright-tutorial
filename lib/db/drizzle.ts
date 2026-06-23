import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import {
	type AsyncBatchRemoteCallback,
	type AsyncRemoteCallback,
	drizzle as drizzleProxy,
} from "drizzle-orm/sqlite-proxy";
import { withSpan } from "../telemetry";
import { resolveRuntimeDatabaseConfig } from "./config";
import * as schema from "./schema";

dotenv.config();

type QueryMethod = Parameters<AsyncRemoteCallback>[2];
type BatchQuery = Parameters<AsyncBatchRemoteCallback>[0][number];
type ProxyQueryResult = Awaited<ReturnType<AsyncRemoteCallback>>;
type LibsqlClient = ReturnType<typeof createClient>;
type InstrumentableLibsqlClient = {
	execute: (...args: unknown[]) => Promise<unknown>;
	batch: (...args: unknown[]) => Promise<unknown>;
};

const databaseConfig = resolveRuntimeDatabaseConfig();

function getProxyEndpoint(proxyUrl: string, pathname: "/query" | "/batch") {
	return new URL(pathname, ensureTrailingSlash(proxyUrl)).toString();
}

async function executeProxyQuery(
	sql: string,
	params: unknown[],
	method: QueryMethod,
): Promise<ProxyQueryResult> {
	return withDbSpan(sql, method, () =>
		executeProxyQueryUntraced(sql, params, method),
	);
}

async function executeProxyQueryUntraced(
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
	return withSpan(
		"db.batch",
		{
			"db.system": "sqlite",
			"db.operation": "batch",
			"db.statement_count": queries.length,
		},
		async (span) => {
			const operations = [
				...new Set(queries.map((query) => sqlOperation(query.sql))),
			];
			const collections = [
				...new Set(
					queries.map((query) => sqlCollection(query.sql)).filter(Boolean),
				),
			];

			if (operations.length === 1 && operations[0]) {
				span?.setAttribute("db.operation", operations[0]);
			}
			if (collections.length === 1 && collections[0]) {
				span?.setAttribute("db.collection", collections[0]);
			}

			return executeProxyBatchUntraced(queries);
		},
	);
}

async function executeProxyBatchUntraced(
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

function instrumentLibsqlClient(client: LibsqlClient): LibsqlClient {
	const instrumented = client as unknown as InstrumentableLibsqlClient;
	const execute = instrumented.execute.bind(client);
	const batch = instrumented.batch.bind(client);

	instrumented.execute = (...args: unknown[]) => {
		const sql = sqlFromStatement(args[0]);
		return withDbSpan(sql, "execute", () => execute(...args));
	};

	instrumented.batch = (...args: unknown[]) => {
		const statements = Array.isArray(args[0]) ? args[0] : [];

		return withSpan(
			"db.batch",
			{
				"db.system": "sqlite",
				"db.operation": "batch",
				"db.statement_count": statements.length,
			},
			async () => batch(...args),
		);
	};

	return client;
}

function withDbSpan<T>(
	sql: string | undefined,
	method: string,
	fn: () => Promise<T>,
) {
	const operation = sqlOperation(sql) ?? method;
	const collection = sqlCollection(sql);

	return withSpan(
		"db.query",
		{
			"db.system": "sqlite",
			"db.operation": operation,
			...(collection ? { "db.collection": collection } : {}),
		},
		async (span) => {
			if (await shouldInjectDbLatencySpike(operation, collection)) {
				span?.setAttribute("app.result", "latency_spike");
				await sleep(5000);
			}

			return fn();
		},
	);
}

async function shouldInjectDbLatencySpike(
	operation: string,
	collection: string | undefined,
) {
	return (
		operation === "select" &&
		collection === "team_members" &&
		(await isRequestFaultActive("api-team-db-latency-spike"))
	);
}

async function isRequestFaultActive(faultName: string) {
	try {
		const { headers } = await import("next/headers");
		return (await headers()).get("x-faults")?.trim() === faultName;
	} catch {
		return false;
	}
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function sqlFromStatement(statement: unknown): string | undefined {
	if (typeof statement === "string") {
		return statement;
	}
	if (Array.isArray(statement) && typeof statement[0] === "string") {
		return statement[0];
	}
	if (isRecord(statement) && typeof statement.sql === "string") {
		return statement.sql;
	}

	return undefined;
}

function sqlOperation(sql: string | undefined) {
	return sql?.trim().split(/\s+/, 1)[0]?.toLowerCase();
}

function sqlCollection(sql: string | undefined) {
	if (!sql) return undefined;

	const normalized = sql.replace(/["`]/g, " ");
	const match = normalized.match(
		/\b(?:from|into|update|join)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i,
	);

	return match?.[1]?.toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
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

	return drizzleLibsql(instrumentLibsqlClient(client), { schema });
}

export const db = createDatabase();
