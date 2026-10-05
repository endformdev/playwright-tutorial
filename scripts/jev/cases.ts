export type CaseContext = {
	runId: string;
	userEmail: string;
	inviteEmail: string;
};

export type JevCase = {
	id: string;
	source: string;
	title: string;
	startPath: string;
	aim: string;
	successCriteria: string[];
	inputValues: (context: CaseContext) => string[];
	verificationCode: (context: CaseContext) => string;
	faults: string[];
	captureInvitationId?: boolean;
	clearCookiesBeforeStart?: boolean;
};

const currentPassword = "testpassword123";
const newPassword = "newpassword123";

export const cases: JevCase[] = [
	{
		id: "signup-and-login",
		source: "tests/setup.spec.ts",
		title: "user signup and login flow",
		startPath: "/sign-up",
		aim: "Create a new account using the supplied inviteEmail and testpassword123, then confirm signup reaches Team Settings and displays the new email.",
		successCriteria: [
			"The current page is the authenticated Team Settings page.",
			"The supplied signup email is visible.",
		],
		inputValues: ({ inviteEmail }) => [inviteEmail, currentPassword],
		verificationCode: ({ inviteEmail }) =>
			`await page.getByRole("heading", { name: "Team Settings" }).waitFor(); await page.getByText(${JSON.stringify(inviteEmail)}, { exact: true }).waitFor(); const cleanup = await page.request.delete(new URL("/api/internal/user", page.url()).toString(), { headers: { authorization: "Bearer VerySecretDummyToken", "content-type": "application/json" }, data: { email: ${JSON.stringify(inviteEmail)} } }); if (!cleanup.ok()) throw new Error("Could not clean up signed-up user");`,
		faults: [],
		clearCookiesBeforeStart: true,
	},
	{
		id: "activity-after-account-update",
		source: "tests/activity-after-account-update.spec.ts",
		title: "should record an account update in the activity log",
		startPath: "/dashboard/general",
		aim: "Change the account name to Activity User, save it successfully, then open Activity and confirm that the activity log says You updated your account.",
		successCriteria: [
			"The account update succeeded.",
			"The Activity Log currently shows You updated your account.",
		],
		inputValues: () => ["Activity User"],
		verificationCode: () =>
			`if (new URL(page.url()).pathname !== "/dashboard/activity") throw new Error("Expected activity page"); await page.getByText("You updated your account", { exact: false }).waitFor();`,
		faults: ["activity-update-log-missing", "activity-update-log-mislabelled"],
	},
	{
		id: "activity-order",
		source: "tests/activity-order.spec.ts",
		title: "should show newer account activity before older activity",
		startPath: "/dashboard/general",
		aim: "Change the account name to Ordered Activity User and save it. Then change the password from testpassword123 to newpassword123. Open Activity and confirm the password-change activity is immediately before the account-update activity.",
		successCriteria: [
			"Both account and password updates succeeded.",
			"The current Activity page shows You changed your password before You updated your account.",
		],
		inputValues: () => ["Ordered Activity User", currentPassword, newPassword],
		verificationCode: () =>
			`const items = page.getByRole("listitem"); await items.first().getByText("You changed your password", { exact: false }).waitFor(); if (!(await items.nth(1).innerText()).includes("You updated your account")) throw new Error("Account update is not the second activity");`,
		faults: ["activity-order-inverted"],
	},
	{
		id: "activity-section",
		source: "tests/activity-section.spec.ts",
		title:
			"should navigate to dashboard activity section and verify user activities",
		startPath: "/dashboard",
		aim: "Open the Activity section and confirm Recent Activity includes both You signed up and You created a new team.",
		successCriteria: [
			"The current page is Activity Log.",
			"Both required signup and team-creation activities are visible.",
		],
		inputValues: () => [],
		verificationCode: () =>
			`if (new URL(page.url()).pathname !== "/dashboard/activity") throw new Error("Expected activity page"); await page.getByText("Recent Activity", { exact: true }).waitFor(); await page.getByText("You signed up", { exact: true }).waitFor(); await page.getByText("You created a new team", { exact: true }).waitFor();`,
		faults: [
			"runtime-error-after-hydration",
			"unexpected-dashboard-redirect",
			"session-cookie-invalid-on-dashboard",
			"activity-missing-create-team",
		],
	},
	{
		id: "change-email",
		source: "tests/change-email.spec.ts",
		title:
			"should sign up new user, change email, sign out, and sign in with new email",
		startPath: "/dashboard",
		aim: "Change the account name to John Doe and its email to the supplied inviteEmail, save successfully, sign out, sign in with that new email and testpassword123, then open General and confirm the email field contains the new email.",
		successCriteria: [
			"The account update succeeded.",
			"After signing out and back in, the current General Settings page shows the supplied new email.",
		],
		inputValues: ({ inviteEmail }) => [
			"John Doe",
			inviteEmail,
			currentPassword,
		],
		verificationCode: ({ inviteEmail }) =>
			`if (new URL(page.url()).pathname !== "/dashboard/general") throw new Error("Expected general settings"); const email = page.getByRole("textbox", { name: "Email" }); await email.waitFor(); if (await email.inputValue() !== ${JSON.stringify(inviteEmail)}) throw new Error("New email is not persisted");`,
		faults: ["api-user-malformed-json"],
	},
	{
		id: "change-name",
		source: "tests/change-name.spec.ts",
		title:
			"should change user name in general settings and verify it appears in team members list",
		startPath: "/dashboard",
		aim: "Starting on the authenticated dashboard, change your name to John Doe in general settings. Confirm that the account update succeeds, then return to the team settings page and confirm John Doe appears in the team members list.",
		successCriteria: [
			"The account update success message has been observed after saving.",
			"The current page is Team Settings and John Doe appears in the team members list.",
		],
		inputValues: () => ["John Doe"],
		verificationCode: () =>
			`if (new URL(page.url()).pathname !== "/dashboard") throw new Error("Expected team settings"); await page.getByText("John Doe", { exact: true }).waitFor(); await page.reload(); await page.getByText("John Doe", { exact: true }).waitFor();`,
		faults: [
			"api-team-500",
			"api-team-extra-request",
			"api-team-db-latency-spike",
			"api-team-db-read-skipped",
			"api-team-latency-spike",
			"api-team-malformed-json",
			"account-update-db-write-skipped",
		],
	},
	{
		id: "change-password",
		source: "tests/change-password.spec.ts",
		title:
			"should successfully change password and sign in with new credentials",
		startPath: "/dashboard",
		aim: "Open Security, change the password from testpassword123 to newpassword123, confirm success, sign out, then sign back in using the supplied userEmail and newpassword123 and reach Team Settings.",
		successCriteria: [
			"The password update succeeded.",
			"After signing out, signing in with the new password reaches Team Settings.",
		],
		inputValues: ({ userEmail }) => [currentPassword, newPassword, userEmail],
		verificationCode: () =>
			`if (new URL(page.url()).pathname !== "/dashboard") throw new Error("Expected dashboard after login"); await page.getByRole("heading", { name: "Team Settings" }).waitFor();`,
		faults: ["script-404", "script-chunk-404", "password-hash-update-skipped"],
	},
	{
		id: "has-title",
		source: "tests/check-setup.spec.ts",
		title: "has title",
		startPath: "/",
		aim: "Confirm the current page title contains Playwright Tutorial.",
		successCriteria: ["The observed page title contains Playwright Tutorial."],
		inputValues: () => [],
		verificationCode: () =>
			`if (!(await page.title()).includes("Playwright Tutorial")) throw new Error("Unexpected title");`,
		faults: [],
	},
	{
		id: "already-logged-in",
		source: "tests/check-setup.spec.ts",
		title: "is already logged in",
		startPath: "/dashboard",
		aim: "Confirm the authenticated Team Settings page is visible and contains at least one team member.",
		successCriteria: [
			"The current page is Team Settings and at least one team member is visible.",
		],
		inputValues: () => [],
		verificationCode: () =>
			`await page.getByRole("heading", { name: "Team Settings" }).waitFor(); await page.getByTestId("team-member").first().waitFor();`,
		faults: [],
	},
	{
		id: "duplicate-invite",
		source: "tests/duplicate-invite.spec.ts",
		title: "should reject a duplicate pending team invitation",
		startPath: "/dashboard",
		aim: "Invite the supplied inviteEmail as a Member, confirm the invitation succeeded, then submit the same invitation again and confirm the page reports that an invitation has already been sent to this email.",
		successCriteria: [
			"A first invitation succeeded.",
			"The current page reports that an invitation has already been sent to this email.",
		],
		inputValues: ({ inviteEmail }) => [inviteEmail],
		verificationCode: () =>
			`await page.getByText("An invitation has already been sent to this email", { exact: false }).waitFor();`,
		faults: ["duplicate-pending-invite-allowed"],
	},
	{
		id: "payment-history",
		source: "tests/payment-history.spec.ts",
		title: "should record exactly one payment after upgrading to Plus",
		startPath: "/dashboard",
		aim: "Upgrade from Free to the Plus plan using the supplied payment and billing values, and return to Team Settings after a successful purchase.",
		successCriteria: [
			"The Plus purchase completed successfully.",
			"The current page is Team Settings after payment.",
		],
		inputValues: paymentValues,
		verificationCode: () =>
			`const response = await page.request.get(new URL("/api/payment", page.url()).toString()); const payments = await response.json(); if (payments.length !== 1 || payments[0].planName !== "Plus" || payments[0].amount !== 1200 || payments[0].currency !== "USD") throw new Error("Expected exactly one $12 Plus payment");`,
		faults: [
			"payment-duplicate-charge",
			"payment-wrong-amount",
			"payment-row-missing",
		],
	},
	{
		id: "plan-upgrade",
		source: "tests/plan-upgrade.spec.ts",
		title: "should successfully upgrade from Free to Plus plan",
		startPath: "/dashboard",
		aim: "Upgrade from Free to the Plus plan using the supplied payment and billing values. Confirm Team Settings shows Current Plan: Plus and Billed monthly.",
		successCriteria: [
			"The purchase completed.",
			"The current Team Settings page shows the Plus plan billed monthly.",
		],
		inputValues: paymentValues,
		verificationCode: () =>
			`await page.getByText("Current Plan: Plus", { exact: true }).waitFor(); await page.getByText("Billed monthly", { exact: true }).waitFor();`,
		faults: [
			"script-chunk-timeout",
			"session-cookie-missing-mid-flow",
			"payment-server-error",
			"payment-subscription-update-skipped",
		],
	},
	{
		id: "signout-session",
		source: "tests/signout-session.spec.ts",
		title: "should clear the session when signing out",
		startPath: "/dashboard",
		aim: "Sign out using the authenticated user menu, then attempt to open the protected dashboard and confirm it redirects to the sign-in page.",
		successCriteria: [
			"The user signed out.",
			"The current page is Sign in after attempting to revisit the dashboard.",
		],
		inputValues: () => [],
		verificationCode: () =>
			`await page.goto("/dashboard"); if (new URL(page.url()).pathname !== "/sign-in") throw new Error("Protected dashboard did not redirect"); await page.getByRole("heading", { name: "Sign in to your account" }).waitFor();`,
		faults: ["signout-cookie-not-cleared", "signout-activity-log-missing"],
	},
	{
		id: "team-invitation",
		source: "tests/team-invitation.spec.ts",
		title:
			"should successfully invite a team member and complete signup process",
		startPath: "/dashboard",
		aim: "Invite the supplied inviteEmail as a Member, confirm success, sign out, open the invitation signup URL when it becomes available, sign up that email with testpassword123, then confirm Team Settings contains two members and the invited email has role member.",
		successCriteria: [
			"The invitation succeeded and its signup was completed.",
			"The current Team Settings page contains the invited email as a member.",
		],
		inputValues: ({ inviteEmail }) => [inviteEmail, currentPassword],
		verificationCode: ({ inviteEmail }) =>
			`const members = page.getByTestId("team-member"); if (await members.count() !== 2) throw new Error("Expected two team members"); const invited = members.filter({ hasText: ${JSON.stringify(inviteEmail)} }); await invited.getByTestId("team-member-role").getByText("member", { exact: false }).waitFor();`,
		faults: ["invite-accepted-but-member-missing", "invite-role-drift"],
		captureInvitationId: true,
	},
	{
		id: "delete-account",
		source: "tests/teardown.spec.ts",
		title: "delete current user account",
		startPath: "/dashboard/security",
		aim: "Delete the current account by entering testpassword123 in Confirm Password and pressing Delete Account. Confirm the page redirects to Sign in.",
		successCriteria: [
			"The account deletion was submitted.",
			"The current page is Sign in.",
		],
		inputValues: () => [currentPassword],
		verificationCode: () =>
			`if (new URL(page.url()).pathname !== "/sign-in") throw new Error("Expected sign-in after deletion"); await page.getByRole("heading", { name: "Sign in to your account" }).waitFor();`,
		faults: [],
	},
];

export const casesById = new Map(
	cases.map((testCase) => [testCase.id, testCase]),
);

function paymentValues() {
	return [
		"John Doe",
		"12345678",
		"12/30",
		"123",
		"123 Main Street",
		"New York",
		"NY",
		"10001",
		"United States",
	];
}
