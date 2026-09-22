import { test as base } from "@playwright/test";
import { createUser, deleteUser, getCookieForSession } from "../../setup-utils";

// Reuse the original test's fresh-user setup without its telemetry dependency.
const test = base.extend<{ freshUser: void }>({
	freshUser: [
		async ({ baseURL, page }, use) => {
			if (!baseURL) throw new Error("baseURL is required");
			const user = await createUser(baseURL);
			try {
				await page
					.context()
					.addCookies([getCookieForSession(user.session, baseURL)]);
				await use();
			} finally {
				await deleteUser(baseURL, user.email);
			}
		},
		{ auto: true },
	],
});

test("Jev name-change experiment", async ({ page }) => {
	// Endform pauses before this statement; the Bun controller owns all actions.
	await page.goto("/dashboard");
});
