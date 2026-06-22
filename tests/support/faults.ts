import type { Page, TestInfo } from "@playwright/test";

export const implementedFaults = [
	"api-team-500",
	"api-team-latency-spike",
	"api-team-malformed-json",
	"api-user-malformed-json",
	"script-404",
	"script-chunk-404",
	"script-chunk-timeout",
	"runtime-error-after-hydration",
	"unexpected-dashboard-redirect",
	"session-cookie-invalid-on-dashboard",
	"session-cookie-missing-mid-flow",
	"activity-missing-create-team",
	"activity-update-log-missing",
	"activity-update-log-mislabelled",
	"activity-order-inverted",
	"payment-server-error",
	"payment-subscription-update-skipped",
	"payment-duplicate-charge",
	"payment-wrong-amount",
	"payment-row-missing",
	"invite-accepted-but-member-missing",
	"invite-role-drift",
	"password-hash-update-skipped",
	"account-update-db-write-skipped",
	"signout-cookie-not-cleared",
	"signout-activity-log-missing",
	"duplicate-pending-invite-allowed",
] as const;

export type FaultName = (typeof implementedFaults)[number];

const faultTargets: Record<FaultName, string[]> = {
	"api-team-500": [
		"should change user name in general settings and verify it appears in team members list",
	],
	"api-team-latency-spike": [
		"should change user name in general settings and verify it appears in team members list",
	],
	"api-team-malformed-json": [
		"should change user name in general settings and verify it appears in team members list",
	],
	"api-user-malformed-json": [
		"should sign up new user, change email, sign out, and sign in with new email",
	],
	"script-404": [
		"should successfully change password and sign in with new credentials",
	],
	"script-chunk-404": [
		"should successfully change password and sign in with new credentials",
	],
	"script-chunk-timeout": [
		"should successfully upgrade from Free to Plus plan",
	],
	"runtime-error-after-hydration": [
		"should navigate to dashboard activity section and verify user activities",
	],
	"unexpected-dashboard-redirect": [
		"should navigate to dashboard activity section and verify user activities",
	],
	"session-cookie-invalid-on-dashboard": [
		"should navigate to dashboard activity section and verify user activities",
	],
	"session-cookie-missing-mid-flow": [
		"should successfully upgrade from Free to Plus plan",
	],
	"activity-missing-create-team": [
		"should navigate to dashboard activity section and verify user activities",
	],
	"activity-update-log-missing": [
		"should record an account update in the activity log",
	],
	"activity-update-log-mislabelled": [
		"should record an account update in the activity log",
	],
	"activity-order-inverted": [
		"should show newer account activity before older activity",
	],
	"payment-server-error": [
		"should successfully upgrade from Free to Plus plan",
	],
	"payment-subscription-update-skipped": [
		"should successfully upgrade from Free to Plus plan",
	],
	"payment-duplicate-charge": [
		"should record exactly one payment after upgrading to Plus",
	],
	"payment-wrong-amount": [
		"should record exactly one payment after upgrading to Plus",
	],
	"payment-row-missing": [
		"should record exactly one payment after upgrading to Plus",
	],
	"invite-accepted-but-member-missing": [
		"should successfully invite a team member and complete signup process",
	],
	"invite-role-drift": [
		"should successfully invite a team member and complete signup process",
	],
	"password-hash-update-skipped": [
		"should successfully change password and sign in with new credentials",
	],
	"account-update-db-write-skipped": [
		"should change user name in general settings and verify it appears in team members list",
	],
	"signout-cookie-not-cleared": ["should clear the session when signing out"],
	"signout-activity-log-missing": ["should clear the session when signing out"],
	"duplicate-pending-invite-allowed": [
		"should reject a duplicate pending team invitation",
	],
};

const FAULT_HEADER = "x-faults";

const faultInstallers: Record<FaultName, (page: Page) => Promise<void>> = {
	"api-team-500": installApiTeam500,
	"api-team-latency-spike": installApiTeamLatencySpike,
	"api-team-malformed-json": installApiTeamMalformedJson,
	"api-user-malformed-json": installApiUserMalformedJson,
	"script-404": installScript404,
	"script-chunk-404": installScriptChunk404,
	"script-chunk-timeout": installScriptChunkTimeout,
	"runtime-error-after-hydration": installRuntimeErrorAfterHydration,
	"unexpected-dashboard-redirect": installUnexpectedDashboardRedirect,
	"session-cookie-invalid-on-dashboard": installSessionCookieInvalidOnDashboard,
	"session-cookie-missing-mid-flow": installSessionCookieMissingMidFlow,
	"activity-missing-create-team": installActivityMissingCreateTeam,
	"activity-update-log-missing": installActivityUpdateLogMissing,
	"activity-update-log-mislabelled": installActivityUpdateLogMislabelled,
	"activity-order-inverted": installActivityOrderInverted,
	"payment-server-error": installPaymentServerError,
	"payment-subscription-update-skipped":
		installPaymentSubscriptionUpdateSkipped,
	"payment-duplicate-charge": installPaymentDuplicateCharge,
	"payment-wrong-amount": installPaymentWrongAmount,
	"payment-row-missing": installPaymentRowMissing,
	"invite-accepted-but-member-missing": installInviteAcceptedButMemberMissing,
	"invite-role-drift": installInviteRoleDrift,
	"password-hash-update-skipped": installPasswordHashUpdateSkipped,
	"account-update-db-write-skipped": installAccountUpdateDbWriteSkipped,
	"signout-cookie-not-cleared": installSignoutCookieNotCleared,
	"signout-activity-log-missing": installSignoutActivityLogMissing,
	"duplicate-pending-invite-allowed": installDuplicatePendingInviteAllowed,
};

export async function installFaultsForTest(page: Page, testInfo: TestInfo) {
	const faultName = getActiveFaultName();
	if (!faultName) {
		return;
	}

	if (!faultTargets[faultName].includes(testInfo.title)) {
		return;
	}

	await faultInstallers[faultName](page);
}

function getActiveFaultName(): FaultName | null {
	const faultName = process.env.FAULTS?.trim();
	if (!faultName) {
		return null;
	}

	if (implementedFaults.includes(faultName as FaultName)) {
		return faultName as FaultName;
	}

	throw new Error(
		`Unknown FAULTS value "${faultName}". Expected one of: ${implementedFaults.join(", ")}`,
	);
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

async function installApiTeamLatencySpike(page: Page) {
	await page.route("**/api/team", async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 7000));
		await route.continue();
	});
}

async function installApiUserMalformedJson(page: Page) {
	const faultName = "api-user-malformed-json";

	await page.route("**/api/user", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			headers: {
				"x-fault-injected": faultName,
			},
			body: "{",
		});
	});
}

async function installScript404(page: Page) {
	await installScriptChunk404(page, "script-404");
}

async function installScriptChunk404(
	page: Page,
	faultName: FaultName = "script-chunk-404",
) {
	let injected = false;

	await page.route("**/*", async (route) => {
		if (!injected && route.request().resourceType() === "script") {
			injected = true;
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

async function installScriptChunkTimeout(page: Page) {
	let injected = false;

	await page.route("**/*", async (route) => {
		if (!injected && route.request().resourceType() === "script") {
			injected = true;
			await new Promise((resolve) => setTimeout(resolve, 15000));
		}

		await route.continue();
	});
}

async function installRuntimeErrorAfterHydration(page: Page) {
	await page.addInitScript(() => {
		window.setTimeout(() => {
			document.body.innerHTML = "";
			throw new Error("Fault injected: runtime-error-after-hydration");
		}, 500);
	});
}

async function installActivityMissingCreateTeam(page: Page) {
	const faultName = "activity-missing-create-team";

	await page.setExtraHTTPHeaders({
		[FAULT_HEADER]: faultName,
	});
}

async function installActivityUpdateLogMissing(page: Page) {
	await setAppFaultHeader(page, "activity-update-log-missing");
}

async function installActivityUpdateLogMislabelled(page: Page) {
	await setAppFaultHeader(page, "activity-update-log-mislabelled");
}

async function installActivityOrderInverted(page: Page) {
	await setAppFaultHeader(page, "activity-order-inverted");
}

async function installPaymentServerError(page: Page) {
	const faultName = "payment-server-error";

	await page.setExtraHTTPHeaders({
		[FAULT_HEADER]: faultName,
	});
}

async function installPaymentSubscriptionUpdateSkipped(page: Page) {
	await setAppFaultHeader(page, "payment-subscription-update-skipped");
}

async function installPaymentDuplicateCharge(page: Page) {
	await setAppFaultHeader(page, "payment-duplicate-charge");
}

async function installPaymentWrongAmount(page: Page) {
	await setAppFaultHeader(page, "payment-wrong-amount");
}

async function installPaymentRowMissing(page: Page) {
	await setAppFaultHeader(page, "payment-row-missing");
}

async function installInviteAcceptedButMemberMissing(page: Page) {
	const faultName = "invite-accepted-but-member-missing";

	await page.setExtraHTTPHeaders({
		[FAULT_HEADER]: faultName,
	});
}

async function installInviteRoleDrift(page: Page) {
	await setAppFaultHeader(page, "invite-role-drift");
}

async function installPasswordHashUpdateSkipped(page: Page) {
	await setAppFaultHeader(page, "password-hash-update-skipped");
}

async function installAccountUpdateDbWriteSkipped(page: Page) {
	await setAppFaultHeader(page, "account-update-db-write-skipped");
}

async function installSignoutCookieNotCleared(page: Page) {
	await setAppFaultHeader(page, "signout-cookie-not-cleared");
}

async function installSignoutActivityLogMissing(page: Page) {
	await setAppFaultHeader(page, "signout-activity-log-missing");
}

async function installDuplicatePendingInviteAllowed(page: Page) {
	await setAppFaultHeader(page, "duplicate-pending-invite-allowed");
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

async function installSessionCookieInvalidOnDashboard(page: Page) {
	await page.context().addCookies([
		{
			name: "session",
			value: "fault-injected-invalid-session",
			url: getBaseUrl(),
			httpOnly: true,
			secure: true,
			sameSite: "Lax",
		},
	]);
}

async function installSessionCookieMissingMidFlow(page: Page) {
	page.on("framenavigated", (frame) => {
		if (frame !== page.mainFrame()) {
			return;
		}

		if (new URL(frame.url()).pathname === "/pricing/checkout") {
			void page.context().clearCookies({ name: "session" });
		}
	});
}

async function setAppFaultHeader(page: Page, faultName: FaultName) {
	await page.setExtraHTTPHeaders({
		[FAULT_HEADER]: faultName,
	});
}

function getBaseUrl() {
	return (
		process.env.BASE_URL || "https://endform-playwright-tutorial.vercel.app"
	);
}
