import { test as base } from "@playwright/test";
import { installFaultsForTest } from "./support/faults";

export const test = base.extend({
	page: async ({ page }, use, testInfo) => {
		await installFaultsForTest(page, testInfo);

		await use(page);
	},
});

export { expect } from "@playwright/test";
