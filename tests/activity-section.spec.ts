import { expect, test } from "@playwright/test";

test.describe("Activity Section", () => {
	test("should navigate to dashboard activity section and verify user activities", async ({
		page,
	}) => {
		await test.step("navigate to the dashboard", async () => {
			await page.goto("/dashboard");
			await expect(page).toHaveURL("/dashboard");
			await expect(
				page.getByRole("heading", { name: "Team Settings" }),
			).toBeVisible();
		});

		await test.step("navigate to the activity section", async () => {
			await page.getByRole("link", { name: "Activity" }).click();
			await expect(page).toHaveURL("/dashboard/activity");
			await expect(
				page.getByRole("heading", { name: "Activity Log" }),
			).toBeVisible();
		});

		await test.step("verify activity section contains expected elements", async () => {
			await expect(page.getByText("Recent Activity")).toBeVisible();

			const activityList = page.getByRole("list");
			await expect(activityList).toBeVisible();
		});

		await test.step("verify 'you signed up' activity is present", async () => {
			const signupActivity = page.getByRole("listitem").filter({
				hasText: "You signed up",
			});
			await expect(signupActivity).toBeVisible();

			await expect(signupActivity.getByText("You signed up")).toBeVisible();
		});

		await test.step("verify 'you created a new team' activity is present", async () => {
			const teamCreationActivity = page.getByRole("listitem").filter({
				hasText: "You created a new team",
			});
			await expect(teamCreationActivity).toBeVisible();

			await expect(
				teamCreationActivity.getByText("You created a new team"),
			).toBeVisible();
		});
	});
});
