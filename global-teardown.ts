import type { FullConfig } from "@playwright/test";

export default async function globalTeardown(config: FullConfig) {
	const { baseURL } = config.projects[0]?.use || {};
	if (!baseURL) {
		throw new Error("baseURL is required");
	}

	const email = "pw-global@example.com";

	try {
		const response = await fetch(`${baseURL}/api/internal/user`, {
			method: "DELETE",
			headers: {
				"content-type": "application/json",
				authorization: "Bearer VerySecretDummyToken",
			},
			body: JSON.stringify({ email }),
		});
		const data = await response.json().catch(() => null);
		console.log("[globalTeardown] delete user status:", response.status);
		console.log("[globalTeardown] delete user body:", data);
	} catch (error) {
		console.error("[globalTeardown] error deleting user:", error);
	}
}
