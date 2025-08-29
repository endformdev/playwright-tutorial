import type { FullConfig } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
	const { baseURL } = config.projects[0]?.use || {};
	if (!baseURL) {
		throw new Error("baseURL is required");
	}

	const email = `${Math.random().toString(36).substring(2, 15)}@example.com`;
	const password = "testpassword123";

	try {
		const response = await fetch(`${baseURL}/api/internal/user`, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				authorization: "Bearer VerySecretDummyToken",
			},
			body: JSON.stringify({ email, password }),
		});
		const data = await response.json().catch(() => null);
		console.log("[globalSetup] create user status:", response.status);
		console.log("[globalSetup] create user body:", data);
	} catch (error) {
		console.error("[globalSetup] error creating user:", error);
	}
}
