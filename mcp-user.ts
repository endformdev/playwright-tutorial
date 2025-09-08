#!/usr/bin/env node

import { createUser, deleteUser } from "./setup-utils";

const scriptArg = process.argv[2];

if (scriptArg !== "create" && scriptArg !== "delete") {
	console.error(
		`Error: Invalid argument "${scriptArg}". Expected "create" or "delete".`,
	);
	process.exit(1);
}

const baseURL =
	process.env.BASE_URL || "https://endform-playwright-tutorial.vercel.app";

if (scriptArg === "create") {
	await createUser(baseURL, "mcp");
} else if (scriptArg === "delete") {
	await deleteUser(baseURL, "mcp");
}
