import { test as base } from "@playwright/test";
import { test as playwrightOpentelemetryTest } from "playwright-opentelemetry/fixture";
import { installFaultsForTest } from "./support/faults";

const playwrightOtelEnabled = Boolean(
	process.env.PLAYWRIGHT_TRACE_API_ENDPOINT ||
		process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
);

const testBase = playwrightOtelEnabled ? playwrightOpentelemetryTest : base;

export const test = testBase.extend({
	page: async ({ page }, use, testInfo) => {
		await installFaultsForTest(page, testInfo);

		await use(page);
	},
});

export { expect } from "@playwright/test";
