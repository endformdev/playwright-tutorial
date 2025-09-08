import { expect, test } from "@playwright/test";

test.describe("User Name Change Flow", () => {
	test("should change user name in general settings and verify it appears in team members list", async ({
		page,
	}) => {
		await test.step("Navigate to dashboard and verify team settings page", async () => {
			await page.goto("/dashboard");
			await expect(
				page.getByRole("heading", { name: "Team Settings" }),
			).toBeVisible();
		});

		await test.step("Navigate to general settings page", async () => {
			await page.getByRole("link", { name: "General" }).click();
			await expect(page).toHaveURL("/dashboard/general");
			await expect(
				page.getByRole("heading", { name: "General Settings" }),
			).toBeVisible();
		});

		await test.step("Update user name to 'John Doe'", async () => {
			const nameInput = page.getByRole("textbox", { name: "Name" });
			await expect(nameInput).toBeVisible();

			await nameInput.clear();
			await nameInput.fill("John Doe");
			await page.getByRole("button", { name: "Save Changes" }).click();

			await expect(
				page.getByText("Account updated successfully."),
			).toBeVisible();
		});

		await test.step("Navigate back to team settings page", async () => {
			await page.getByRole("link", { name: "Team" }).click();
			await expect(page).toHaveURL("/dashboard");
			await expect(
				page.getByRole("heading", { name: "Team Settings" }),
			).toBeVisible();
		});

		await test.step("Verify updated name appears in team members list", async () => {
			await expect(page.getByText("John Doe")).toBeVisible();
		});
	});
});
