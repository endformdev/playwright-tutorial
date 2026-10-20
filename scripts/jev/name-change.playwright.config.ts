import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: ".",
	testMatch: "harness.spec.ts",
	retries: 0,
	workers: 1,
	timeout: 10 * 60_000,
	reporter: "line",
	use: {
		baseURL:
			process.env.BASE_URL || "https://endform-playwright-tutorial.vercel.app",
		actionTimeout: 5000,
		navigationTimeout: 15000,
	},
	projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
