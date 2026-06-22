import { expect, test } from "./test";
import { testWithNewUser } from "./test-with-new-user";

test.describe("Activity after account update", () => {
	testWithNewUser(
		"should record an account update in the activity log",
		async ({ page }) => {
			await test.step("update the account name", async () => {
				await page.goto("/dashboard/general");
				await expect(
					page.getByRole("heading", { name: "General Settings" }),
				).toBeVisible();
				await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(
					/.+@example\.com/,
				);

				const nameInput = page.getByRole("textbox", { name: "Name" });
				await nameInput.clear();
				await nameInput.fill("Activity User");
				await page.getByRole("button", { name: "Save Changes" }).click();
				await expect(
					page.getByText("Account updated successfully."),
				).toBeVisible();
			});

			await test.step("verify the account update appears in activity", async () => {
				await page.getByRole("link", { name: "Activity" }).click();
				await expect(page).toHaveURL("/dashboard/activity");
				await expect(
					page.getByRole("heading", { name: "Activity Log" }),
				).toBeVisible();
				await expect(page.getByText("You updated your account")).toBeVisible();
			});
		},
	);
});
