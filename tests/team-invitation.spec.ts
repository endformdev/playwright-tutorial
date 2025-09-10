import { expect, test } from "@playwright/test";
import { testWithNewUser } from "./test-with-new-user";

test.describe("Team Invitation Flow", () => {
	testWithNewUser(
		"should successfully invite a team member and complete signup process",
		async ({ page }) => {
			const newUserEmail = `testuser${Date.now()}@example.com`;
			let invitationId: string | null = null;

			const existingMemberName =
				await test.step("Navigate to dashboard and verify current team member", async () => {
					await page.goto("/dashboard");
					await expect(
						page.getByRole("heading", { name: "Team Settings" }),
					).toBeVisible();

					const existingMember = await page.getByTestId("team-member");
					const existingMemberName = await existingMember
						.getByTestId("team-member-name")
						.textContent();
					if (!existingMemberName) {
						throw new Error("Existing member name not found");
					}
					expect(
						await existingMember.getByTestId("team-member-role"),
					).toContainText("owner");

					return existingMemberName;
				});

			await test.step("Send team invitation", async () => {
				page.on("console", (msg) => {
					const text = msg.text();
					const match = text.match(/\[inviteState\]\s+(\d+)/);
					if (match) {
						invitationId = match[1];
						console.log(`Captured invitation ID: ${invitationId}`);
					}
				});

				await page.getByRole("textbox", { name: "Email" }).fill(newUserEmail);
				await expect(page.getByRole("radio", { name: "Member" })).toBeChecked();
				await page.getByRole("button", { name: "Invite Member" }).click();
				await expect(
					page.getByText("Invitation sent successfully"),
				).toBeVisible();

				await page.waitForTimeout(1000);
				expect(invitationId).not.toBeNull();
			});

			await test.step("Sign out current user", async () => {
				await page.getByTestId("user-menu-trigger").click();
				await page.getByRole("button", { name: "Sign out" }).click();
			});

			await test.step("Complete signup process with invitation", async () => {
				await page.goto("/sign-up?inviteId=" + invitationId);
				await expect(
					page.getByRole("heading", { name: "Create your account" }),
				).toBeVisible();

				await page.getByRole("textbox", { name: "Email" }).fill(newUserEmail);
				await page
					.getByRole("textbox", { name: "Password" })
					.fill("testpassword123");
				await page.getByRole("button", { name: "Sign up" }).click();
			});

			await test.step("Verify successful team member addition", async () => {
				await expect(
					page.getByRole("heading", { name: "Team Settings" }),
				).toBeVisible();
				await expect(page).toHaveURL("/dashboard");

				const firstTeamMember = await page.getByTestId("team-member").first();
				expect(firstTeamMember.getByTestId("team-member-name")).toContainText(
					existingMemberName,
				);
				expect(firstTeamMember.getByTestId("team-member-role")).toContainText(
					"owner",
				);

				const secondTeamMember = await page.getByTestId("team-member").nth(1);
				expect(secondTeamMember.getByTestId("team-member-name")).toContainText(
					newUserEmail,
				);
				expect(secondTeamMember.getByTestId("team-member-role")).toContainText(
					"member",
				);
			});
		},
	);
});
