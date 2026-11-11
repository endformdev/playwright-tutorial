import { test as base } from "@playwright/test";
import { test as playwrightOpentelemetryTest } from "playwright-opentelemetry/fixture";
import { addNetlifyPasswordCookie } from "../setup-utils";

const playwrightOtelEnabled = Boolean(
	process.env.PLAYWRIGHT_TRACE_API_ENDPOINT ||
	process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
);

const testBase = playwrightOtelEnabled ? playwrightOpentelemetryTest : base;

export const test = testBase.extend({
	context: async ({ context, baseURL }, use) => {
		if (baseURL) await addNetlifyPasswordCookie(context, baseURL);

		await use(context);
	},
});

export { expect } from "@playwright/test";
