import { defineConfig, devices } from "@playwright/test";
import type { IntentOptions, IntentUseOptions } from "playwright-intent";
import { allow, commit, fileStore } from "playwright-intent/file-store";
import { baseURL } from "./playwright.config";

// Steps live in .intent and are committed like any other code. Locally the
// agent writes changed steps to disk for you to review. On a pull request it
// commits them to the branch, so the change shows up in the diff.
const intent = {
	store: fileStore({ updates: { local: allow(), ci: commit() } }),
	model: "openai/gpt-6-luna",
} satisfies IntentOptions;

export default defineConfig<IntentUseOptions>({
	testDir: "./tests-intent",
	outputDir: "./test-results-intent",
	timeout: 120_000,
	// A repaired step can leave the page in a changed state, so the retry
	// replays the test from the start with the new step.
	retries: 2,
	reporter: [["list"], ["playwright-intent/reporter", intent]],
	use: {
		...devices["Desktop Chrome"],
		baseURL,
		extraHTTPHeaders: process.env.VERCEL_BYPASS_TOKEN
			? {
					"x-vercel-protection-bypass": process.env.VERCEL_BYPASS_TOKEN,
					"x-vercel-set-bypass-cookie": "true",
				}
			: undefined,
		trace: "on",
		intent,
	},
});
