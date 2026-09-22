import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");
const pointer = resolve(root, "test-results/jev-current-run.json");

// Read only the run selected by the controller; never accept a filesystem path
// from the browser. Binding to loopback keeps this a local presentation tool.
export function startViewer(stateFile = pointer, port = 3031) {
	return Bun.serve({
		hostname: "127.0.0.1",
		port,
		async fetch(request) {
			const url = new URL(request.url);
			const headers = { "Cache-Control": "no-store" };
			if (url.pathname === "/") {
				return new Response(Bun.file(resolve(import.meta.dir, "viewer.html")), {
					headers,
				});
			}
			if (url.pathname !== "/state" && url.pathname !== "/screenshot") {
				return new Response("Not found", { status: 404 });
			}
			try {
				if (!(await Bun.file(stateFile).exists())) {
					return Response.json({ waiting: true }, { headers });
				}
				const run = await Bun.file(stateFile).json();
				const directory = resolve(run.directory, "screenshots");
				const names = (await readdir(directory))
					.filter((name) => /^\d+-[\w-]+\.png$/.test(name))
					.sort();
				const latest = names.at(-1);
				if (url.pathname === "/state") {
					return Response.json(
						{
							session: run.session,
							directory,
							latest: latest ?? null,
							image: latest
								? `/screenshot?session=${encodeURIComponent(run.session)}&name=${encodeURIComponent(latest)}`
								: null,
						},
						{ headers },
					);
				}
				const name = url.searchParams.get("name");
				if (
					url.searchParams.get("session") !== run.session ||
					!name ||
					!names.includes(name)
				) {
					return new Response("Screenshot no longer available", {
						status: 404,
						headers,
					});
				}
				return new Response(Bun.file(resolve(directory, name)), { headers });
			} catch (error) {
				console.error("Could not read current screenshot:", error);
				return Response.json(
					{ error: "Cannot read the current run. Check the viewer terminal." },
					{ status: 503, headers },
				);
			}
		},
	});
}

if (import.meta.main) {
	const server = startViewer();
	console.log(`Screenshot viewer: ${server.url}`);
	console.log(
		"Keep this browser window open, then run bun run jev:test in another terminal.",
	);
}
