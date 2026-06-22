import { expect, test } from "./test";
import { testWithNewUser } from "./test-with-new-user";

test.describe("Activity ordering", () => {
	testWithNewUser(
		"should show newer account activity before older activity",
		async ({ page }) => {
			await test.step("create an account update activity", async () => {
				await page.goto("/dashboard/general");
				await expect(
					page.getByRole("heading", { name: "General Settings" }),
				).toBeVisible();
				await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(
					/.+@example\.com/,
				);

				const nameInput = page.getByRole("textbox", { name: "Name" });
				await nameInput.clear();
				await nameInput.fill("Ordered Activity User");
				await page.getByRole("button", { name: "Save Changes" }).click();
				await expect(
					page.getByText("Account updated successfully."),
				).toBeVisible();
				await page.waitForTimeout(1100);
			});

			await test.step("create a newer password update activity", async () => {
				await page.getByRole("link", { name: "Security" }).click();
				await expect(
					page.getByRole("heading", { name: "Security Settings" }),
				).toBeVisible();

				await page
					.getByRole("textbox", { name: "Current Password" })
					.fill("testpassword123");
				await page
					.getByRole("textbox", { name: "New Password", exact: true })
					.fill("newpassword123");
				await page
					.getByRole("textbox", { name: "Confirm New Password" })
					.fill("newpassword123");
				await page.getByRole("button", { name: "Update Password" }).click();
				await expect(
					page.getByText("Password updated successfully."),
				).toBeVisible();
			});

			await test.step("verify newest activity is first", async () => {
				await page.getByRole("link", { name: "Activity" }).click();
				await expect(page).toHaveURL("/dashboard/activity");

				const activities = page.getByRole("listitem");
				await expect(activities.first()).toContainText(
					"You changed your password",
				);
				await expect(activities.nth(1)).toContainText(
					"You updated your account",
				);
			});
		},
	);
});
