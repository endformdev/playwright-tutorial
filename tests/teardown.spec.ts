import { expect, test } from "@playwright/test";

test("delete current user account", async ({ page }) => {
	const testPassword = "testpassword123";

	await test.step("navigate to security page", async () => {
		await page.goto("/dashboard/security");
		await expect(
			page.getByRole("heading", { name: "Security Settings" }),
		).toBeVisible();
	});

	await test.step("delete account with password confirmation", async () => {
		await page
			.getByRole("textbox", { name: "Confirm Password" })
			.fill(testPassword);
		await page.getByRole("button", { name: "Delete Account" }).click();
	});

	await test.step("verify redirect to sign-in page after account deletion", async () => {
		await expect(page).toHaveURL("/sign-in");
		await expect(
			page.getByRole("heading", { name: "Sign in to your account" }),
		).toBeVisible();
	});
});
