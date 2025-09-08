import fs from "node:fs";
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
		const data = (await response.json()) as { session: string };
		if (!data.session) {
			throw new Error("Failed to create user");
		}

		writeSessionFile(data.session, baseURL);
	} catch (error) {
		console.error("[globalSetup] error creating user:", error);
	}
}

function writeSessionFile(session: string, baseURL: string) {
	fs.writeFileSync(
		".auth/shared-api-user.json",
		JSON.stringify({
			cookies: [
				{
					name: "session",
					value: session,
					domain: new URL(baseURL).hostname,
					path: "/",
					// Playwright will delete the cookie when the test is done
					expires: -1,
					httpOnly: true,
					secure: true,
					sameSite: "Lax",
				},
			],
			origins: [],
		}),
	);
}
