import type { Page, TestInfo } from "@playwright/test";

export const implementedFaults = [
	"api-team-500",
	"script-404",
	"unexpected-dashboard-redirect",
] as const;

export type FaultName = (typeof implementedFaults)[number];

const faultTargets: Record<FaultName, string[]> = {
	"api-team-500": [
		"should change user name in general settings and verify it appears in team members list",
	],
	"script-404": [
		"should successfully change password and sign in with new credentials",
	],
	"unexpected-dashboard-redirect": [
		"should navigate to dashboard activity section and verify user activities",
	],
};

export async function installFaultsForTest(page: Page, testInfo: TestInfo) {
	const faults = process.env.FAULTS?.trim();

	for (const faultName of implementedFaults) {
		if (faults !== "all" && faults !== faultName) {
			continue;
		}

		if (!faultTargets[faultName].includes(testInfo.title)) {
			continue;
		}

		switch (faultName) {
			case "api-team-500":
				await installApiTeam500(page);
				break;
			case "script-404":
				await installScript404(page);
				break;
			case "unexpected-dashboard-redirect":
				await installUnexpectedDashboardRedirect(page);
				break;
		}
	}
}

async function installApiTeam500(page: Page) {
	const faultName = "api-team-500";

	await page.route("**/api/team", async (route) => {
		await route.fulfill({
			status: 500,
			contentType: "application/json",
			headers: {
				"x-fault-injected": faultName,
			},
			body: JSON.stringify({ error: `Fault injected: ${faultName}` }),
		});
	});
}

async function installScript404(page: Page) {
	const faultName = "script-404";

	await page.route("**/*", async (route) => {
		if (route.request().resourceType() === "script") {
			await route.fulfill({
				status: 404,
				contentType: "application/javascript",
				headers: {
					"x-fault-injected": faultName,
				},
				body: `throw new Error("Fault injected: ${faultName}");`,
			});
			return;
		}

		await route.continue();
	});
}

async function installUnexpectedDashboardRedirect(page: Page) {
	const faultName = "unexpected-dashboard-redirect";

	await page.route("**/dashboard", async (route) => {
		if (route.request().resourceType() === "document") {
			await route.fulfill({
				status: 302,
				headers: {
					location: "/sign-in",
					"x-fault-injected": faultName,
				},
				body: "",
			});
			return;
		}

		await route.continue();
	});
}
