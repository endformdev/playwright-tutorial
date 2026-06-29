import { defineConfig, devices } from "@playwright/test";
import type { PlaywrightOpentelemetryUseOptions } from "playwright-opentelemetry/fixture";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

export const baseURL =
	process.env.BASE_URL || "https://endform-playwright-tutorial.vercel.app";

const playwrightOtelEnabled = Boolean(
	process.env.PLAYWRIGHT_TRACE_API_ENDPOINT ||
		process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig<PlaywrightOpentelemetryUseOptions>({
	testDir: "./tests",
	globalSetup: "./global-setup.ts",
	globalTeardown: "./global-teardown.ts",
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: "50%",
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: [
		["html", { open: "never" }],
		...(playwrightOtelEnabled
			? [["playwright-opentelemetry/reporter"] as const]
			: []),
	],
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL,
		// You can use this localhost baseURL if you are running the application locally
		// baseURL: "http://localhost:3000",

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: playwrightOtelEnabled ? "on" : "retain-on-failure",
		playwrightOpentelemetry: playwrightOtelEnabled
			? {
					trace: "on",
					storeTraceZip: false,
					propagateTraceHeaders: true,
				}
			: undefined,
	},

	/* Run your local dev server before starting the tests */
	// webServer: {
	// 	command: "pnpm dev",
	// 	url: "http://localhost:3000",
	// 	reuseExistingServer: !process.env.CI,
	// },

	projects: [
		{
			name: "setup",
			testMatch: "setup.spec.ts",
			teardown: "teardown",
		},
		{
			name: "chromium",
			testIgnore: ["setup.spec.ts", "teardown.spec.ts"],
			dependencies: ["setup"],
			use: {
				storageState: ".auth/api-user.json",
				...devices["Desktop Chrome"],
			},
		},
		{
			name: "teardown",
			testMatch: "teardown.spec.ts",
			use: {
				storageState: ".auth/shared-ui-user.json",
			},
		},
	],
});
