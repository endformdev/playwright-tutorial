import { DurableObject } from "cloudflare:workers";

const HOUR_MS = 60 * 60 * 1000;
const SHARED_OBJECT_NAME = "shared-demo";

const CORS_HEADERS = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET,POST,OPTIONS",
	"access-control-allow-headers": "content-type",
};

const MIGRATIONS = [
	{
		id: "0000_late_mastermind",
		sql: `
			CREATE TABLE activity_logs (
				id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
				team_id integer NOT NULL,
				user_id integer,
				action text NOT NULL,
				timestamp integer NOT NULL,
				ip_address text,
				FOREIGN KEY (team_id) REFERENCES teams(id) ON UPDATE no action ON DELETE no action,
				FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action
			);
			CREATE TABLE invitations (
				id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
				team_id integer NOT NULL,
				email text NOT NULL,
				role text NOT NULL,
				invited_by integer NOT NULL,
				invited_at integer NOT NULL,
				status text DEFAULT 'pending' NOT NULL,
				FOREIGN KEY (team_id) REFERENCES teams(id) ON UPDATE no action ON DELETE no action,
				FOREIGN KEY (invited_by) REFERENCES users(id) ON UPDATE no action ON DELETE no action
			);
			CREATE TABLE payments (
				id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
				team_id integer NOT NULL,
				card_number text NOT NULL,
				card_holder_name text NOT NULL,
				expiry_date text NOT NULL,
				cvv text NOT NULL,
				billing_address text NOT NULL,
				city text NOT NULL,
				state text NOT NULL,
				zip_code text NOT NULL,
				country text NOT NULL,
				plan_name text NOT NULL,
				amount integer NOT NULL,
				currency text DEFAULT 'USD' NOT NULL,
				created_at integer NOT NULL,
				FOREIGN KEY (team_id) REFERENCES teams(id) ON UPDATE no action ON DELETE no action
			);
			CREATE TABLE team_members (
				id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
				user_id integer NOT NULL,
				team_id integer NOT NULL,
				role text NOT NULL,
				joined_at integer NOT NULL,
				FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action,
				FOREIGN KEY (team_id) REFERENCES teams(id) ON UPDATE no action ON DELETE no action
			);
			CREATE TABLE teams (
				id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
				name text NOT NULL,
				created_at integer NOT NULL,
				updated_at integer NOT NULL,
				plan_name text,
				subscription_status text
			);
			CREATE TABLE users (
				id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
				name text,
				email text NOT NULL,
				password_hash text NOT NULL,
				role text DEFAULT 'member' NOT NULL,
				created_at integer NOT NULL,
				updated_at integer NOT NULL,
				deleted_at integer
			);
			CREATE UNIQUE INDEX users_email_unique ON users (email);
		`,
	},
	{
		id: "0001_heavy_mentor",
		sql: `
			PRAGMA foreign_keys=OFF;
			CREATE TABLE __new_activity_logs (
				id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
				team_id integer NOT NULL,
				user_id integer,
				action text NOT NULL,
				timestamp integer NOT NULL,
				ip_address text,
				FOREIGN KEY (team_id) REFERENCES teams(id) ON UPDATE no action ON DELETE no action,
				FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
			);
			INSERT INTO __new_activity_logs(id, team_id, user_id, action, timestamp, ip_address)
			SELECT id, team_id, user_id, action, timestamp, ip_address FROM activity_logs;
			DROP TABLE activity_logs;
			ALTER TABLE __new_activity_logs RENAME TO activity_logs;
			PRAGMA foreign_keys=ON;
		`,
	},
];

function json(data, init) {
	const responseInit = typeof init === "number" ? { status: init } : init || {};

	return new Response(JSON.stringify(data), {
		...responseInit,
		headers: {
			"content-type": "application/json",
			...CORS_HEADERS,
			...(responseInit.headers || {}),
		},
	});
}

function badRequest(message) {
	return json({ error: message }, 400);
}

function nextCleanupTime(now = Date.now()) {
	return now - (now % HOUR_MS) + HOUR_MS;
}

function normalizeParams(params) {
	return Array.isArray(params) ? params : [];
}

function isValidMethod(method) {
	return ["run", "all", "values", "get"].includes(method);
}

function toRawRows(cursor) {
	return cursor.raw().toArray();
}

export class SqliteProxyDurableObject extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
		this.sql = ctx.storage.sql;
		this.ready = ctx.blockConcurrencyWhile(async () => {
			this.initialize();
			await this.ensureAlarm();
		});
	}

	initialize() {
		this.sql.exec(`
			CREATE TABLE IF NOT EXISTS _proxy_migrations (
				id TEXT PRIMARY KEY NOT NULL,
				applied_at INTEGER NOT NULL
			)
		`);

		const appliedRows = this.sql
			.exec("SELECT id FROM _proxy_migrations")
			.toArray();
		const applied = new Set(appliedRows.map((row) => row.id));

		this.ctx.storage.transactionSync(() => {
			for (const migration of MIGRATIONS) {
				if (applied.has(migration.id)) {
					continue;
				}

				this.sql.exec(migration.sql);
				this.sql.exec(
					"INSERT INTO _proxy_migrations (id, applied_at) VALUES (?, ?)",
					migration.id,
					Date.now(),
				);
			}
		});
	}

	async ensureAlarm() {
		const existingAlarm = await this.ctx.storage.getAlarm();
		if (existingAlarm == null) {
			await this.ctx.storage.setAlarm(nextCleanupTime());
		}
	}

	executeQuery(sql, params, method) {
		const cursor = this.sql.exec(sql, ...normalizeParams(params));

		if (method === "run") {
			return { rows: [] };
		}

		const rows = toRawRows(cursor);

		if (method === "get") {
			return { rows: rows[0] };
		}

		return { rows };
	}

	async handleSingleQuery(request) {
		const body = await request.json().catch(() => null);

		if (!body || typeof body.sql !== "string") {
			return badRequest("Expected a JSON body with a sql string.");
		}

		if (!isValidMethod(body.method)) {
			return badRequest(
				"Expected method to be one of run, all, values, or get.",
			);
		}

		return json(this.executeQuery(body.sql, body.params, body.method));
	}

	async handleBatchQuery(request) {
		const body = await request.json().catch(() => null);

		if (!body || !Array.isArray(body.queries)) {
			return badRequest("Expected a JSON body with a queries array.");
		}

		const results = this.ctx.storage.transactionSync(() => {
			return body.queries.map((query) => {
				if (!query || typeof query.sql !== "string") {
					throw new Error("Every batch query must include a sql string.");
				}

				if (!isValidMethod(query.method)) {
					throw new Error(
						"Every batch query method must be one of run, all, values, or get.",
					);
				}

				return this.executeQuery(query.sql, query.params, query.method);
			});
		});

		return json(results);
	}

	async alarm() {
		await this.ctx.storage.deleteAlarm();
		await this.ctx.storage.deleteAll();
	}

	async fetch(request) {
		await this.ready;
		const url = new URL(request.url);

		if (request.method === "OPTIONS") {
			return new Response(null, { headers: CORS_HEADERS });
		}

		if (url.pathname === "/health") {
			return json({
				ok: true,
				object: SHARED_OBJECT_NAME,
				nextCleanupAt: await this.ctx.storage.getAlarm(),
			});
		}

		await this.ensureAlarm();

		try {
			if (url.pathname === "/query" && request.method === "POST") {
				return await this.handleSingleQuery(request);
			}

			if (url.pathname === "/batch" && request.method === "POST") {
				return await this.handleBatchQuery(request);
			}

			return json({ error: "Not found" }, 404);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return json({ error: message }, 500);
		}
	}
}

export default {
	async fetch(request, env) {
		const id = env.SQLITE_PROXY.idFromName(SHARED_OBJECT_NAME);
		const stub = env.SQLITE_PROXY.get(id);
		return stub.fetch(request);
	},
};
