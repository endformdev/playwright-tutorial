import type { FullConfig } from "@playwright/test";
import { deleteUserFromFile } from "./setup-utils";

export default async function globalTeardown(config: FullConfig) {
	const { baseURL } = config.projects[0]?.use || {};
	if (!baseURL) {
		throw new Error("baseURL is required");
	}

	await deleteUserFromFile(baseURL, "api");
}
