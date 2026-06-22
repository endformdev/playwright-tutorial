import { expect, test } from "./test";
import { testWithNewUser } from "./test-with-new-user";

test.describe("Duplicate team invitation", () => {
	testWithNewUser(
		"should reject a duplicate pending team invitation",
		async ({ page }) => {
			const inviteEmail = `duplicate-${Date.now()}@example.com`;

			await test.step("send the first invitation", async () => {
				await page.goto("/dashboard");
				await expect(
					page.getByRole("heading", { name: "Team Settings" }),
				).toBeVisible();
				await page.getByRole("textbox", { name: "Email" }).fill(inviteEmail);
				await page.getByRole("button", { name: "Invite Member" }).click();
				await expect(
					page.getByText("Invitation sent successfully"),
				).toBeVisible();
			});

			await test.step("try to send the same invitation again", async () => {
				await page.getByRole("textbox", { name: "Email" }).fill(inviteEmail);
				await page.getByRole("button", { name: "Invite Member" }).click();
				await expect(
					page.getByText("An invitation has already been sent to this email"),
				).toBeVisible();
			});
		},
	);
});
