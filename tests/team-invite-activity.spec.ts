import { expect, test } from "./test";
import { testWithNewUser } from "./test-with-new-user";

test.describe("Activity after team invitation", () => {
	testWithNewUser(
		"should record a team invitation in the activity log",
		async ({ page }) => {
			const inviteEmail = `invitee-${Date.now()}@example.com`;

			await test.step("invite a team member", async () => {
				await page.goto("/dashboard");
				await expect(
					page.getByRole("heading", { name: "Team Settings" }),
				).toBeVisible();
				await page.getByRole("textbox", { name: "Email" }).fill(inviteEmail);
				await expect(page.getByRole("radio", { name: "Member" })).toBeChecked();
				await page.getByRole("button", { name: "Invite Member" }).click();
				await expect(
					page.getByText("Invitation sent successfully"),
				).toBeVisible();
			});

			await test.step("verify the invitation is the newest activity", async () => {
				await page.getByRole("link", { name: "Activity" }).click();
				await expect(page).toHaveURL("/dashboard/activity");
				await expect(
					page.getByRole("heading", { name: "Activity Log" }),
				).toBeVisible();
				const activities = page
					.getByRole("listitem")
					.filter({ hasText: /^You / });
				await expect(activities.first()).toContainText(
					"You invited a team member",
				);
			});
		},
	);
});
