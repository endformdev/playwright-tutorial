import { test as base } from "@playwright/test";
import {
	createUser,
	deleteUser,
	getCookieForSession,
	type ApiUser,
} from "../../setup-utils";
import { installFaultsForTest } from "../../tests/support/faults";

const title = process.env.E2E_JEV_TITLE;
if (!title) throw new Error("E2E_JEV_TITLE is required");

const test = base.extend<{ freshUser: ApiUser }>({
	freshUser: [
		async ({ baseURL, page }, use, testInfo) => {
			if (!baseURL) throw new Error("baseURL is required");
			const user = await createUser(baseURL);
			process.env.E2E_JEV_USER_EMAIL = user.email;
			try {
				await page
					.context()
					.addCookies([getCookieForSession(user.session, baseURL)]);
				if (process.env.E2E_JEV_FAULT)
					process.env.FAULTS = process.env.E2E_JEV_FAULT;
				await installFaultsForTest(page, testInfo);
				await use(user);
			} finally {
				await deleteUser(baseURL, user.email);
			}
		},
		{ auto: true },
	],
});

test(title, async ({ page }) => {
	// Endform pauses before this statement. The benchmark controller owns all actions.
	await page.goto("/");
});
