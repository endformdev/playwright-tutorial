#!/usr/bin/env node

import { createUserInFile, deleteUserFromFile } from "./setup-utils";

const scriptArg = process.argv[2];

if (scriptArg !== "create" && scriptArg !== "delete") {
	console.error(
		`Error: Invalid argument "${scriptArg}". Expected "create" or "delete".`,
	);
	process.exit(1);
}

const baseURL = "https://endform-playwright-tutorial.vercel.app";
// const baseURL = "http://localhost:3000";

if (scriptArg === "create") {
	console.log("Creating MCP user", baseURL);
	await createUserInFile(baseURL, "mcp");
} else if (scriptArg === "delete") {
	await deleteUserFromFile(baseURL, "mcp");
}
