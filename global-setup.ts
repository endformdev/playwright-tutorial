import type { FullConfig } from "@playwright/test";
import { createUser } from "./setup-utils";

export default async function globalSetup(config: FullConfig) {
	const { baseURL } = config.projects[0]?.use || {};
	if (!baseURL) {
		throw new Error("baseURL is required");
	}

	await createUser(baseURL, "api");
}
