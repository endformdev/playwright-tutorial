import type { FullConfig } from "@playwright/test";
import { createUserInFile } from "./setup-utils";

export default async function globalSetup(config: FullConfig) {
	const { baseURL } = config.projects[0]?.use || {};

	console.log('global-setup.ts', baseURL)

	if (!baseURL) {
		throw new Error("baseURL is required");
	}

	await createUserInFile(baseURL, "api");
}
