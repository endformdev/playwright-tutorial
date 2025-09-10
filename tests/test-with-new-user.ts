import { test } from "@playwright/test";
import {
	type ApiUser,
	createUser,
	deleteUser,
	getCookieForSession,
} from "../setup-utils";

// This is an _automatic_ fixture, that when used will provide the test with a unique new user
// https://playwright.dev/docs/test-fixtures#automatic-fixtures

export const testWithNewUser = test.extend<{
	newUser: ApiUser;
}>({
	newUser: [
		async ({ baseURL, page }, use) => {
			const { email, password, session } = await createUser(baseURL!);
			await page.context().addCookies([getCookieForSession(session, baseURL!)]);

			await use({ email, password, session });

			await deleteUser(baseURL!, email);
		},
		{ auto: true },
	],
});
