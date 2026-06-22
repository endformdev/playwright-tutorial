import type { Page, TestInfo } from "@playwright/test";

export const implementedFaults = [
	"api-team-500",
	"api-team-malformed-json",
	"script-404",
	"unexpected-dashboard-redirect",
	"activity-missing-create-team",
	"payment-server-error",
	"invite-accepted-but-member-missing",
] as const;

export type FaultName = (typeof implementedFaults)[number];

const faultTargets: Record<FaultName, string[]> = {
	"api-team-500": [
		"should change user name in general settings and verify it appears in team members list",
	],
	"api-team-malformed-json": [
		"should change user name in general settings and verify it appears in team members list",
	],
	"script-404": [
		"should successfully change password and sign in with new credentials",
	],
	"unexpected-dashboard-redirect": [
		"should navigate to dashboard activity section and verify user activities",
	],
	"activity-missing-create-team": [
		"should navigate to dashboard activity section and verify user activities",
	],
	"payment-server-error": [
		"should successfully upgrade from Free to Plus plan",
	],
	"invite-accepted-but-member-missing": [
		"should successfully invite a team member and complete signup process",
	],
};

const FAULT_HEADER = "x-faults";

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
			case "api-team-malformed-json":
				await installApiTeamMalformedJson(page);
				break;
			case "script-404":
				await installScript404(page);
				break;
			case "unexpected-dashboard-redirect":
				await installUnexpectedDashboardRedirect(page);
				break;
			case "activity-missing-create-team":
				await installActivityMissingCreateTeam(page);
				break;
			case "payment-server-error":
				await installPaymentServerError(page);
				break;
			case "invite-accepted-but-member-missing":
				await installInviteAcceptedButMemberMissing(page);
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

async function installApiTeamMalformedJson(page: Page) {
	const faultName = "api-team-malformed-json";

	await page.setExtraHTTPHeaders({
		[FAULT_HEADER]: faultName,
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

async function installActivityMissingCreateTeam(page: Page) {
	const faultName = "activity-missing-create-team";

	await page.setExtraHTTPHeaders({
		[FAULT_HEADER]: faultName,
	});
}

async function installPaymentServerError(page: Page) {
	const faultName = "payment-server-error";

	await page.setExtraHTTPHeaders({
		[FAULT_HEADER]: faultName,
	});
}

async function installInviteAcceptedButMemberMissing(page: Page) {
	const faultName = "invite-accepted-but-member-missing";

	await page.setExtraHTTPHeaders({
		[FAULT_HEADER]: faultName,
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
