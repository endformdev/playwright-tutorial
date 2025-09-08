import { expect, test } from "@playwright/test";

const authFile = ".auth/shared-ui-user.json";

test("user signup and login flow", async ({ page }) => {
	const randomEmail = `${Math.random().toString(36).substring(2, 15)}@example.com`;
	const testPassword = "testpassword123";

	await test.step("navigate to signup page", async () => {
		await page.goto("/sign-up");
		await expect(
			page.getByRole("heading", { name: "Create your account" }),
		).toBeVisible();
	});

	await test.step("fill signup form and submit", async () => {
		await page.getByRole("textbox", { name: "Email" }).fill(randomEmail);
		await page.getByRole("textbox", { name: "Password" }).fill(testPassword);
		await page.getByRole("button", { name: "Sign up" }).click();
	});

	await test.step("verify successful signup redirects to dashboard", async () => {
		await expect(page).toHaveURL("/dashboard");
		await expect(
			page.getByRole("heading", { name: "Team Settings" }),
		).toBeVisible();
		await expect(page.getByText(randomEmail)).toBeVisible();
	});

	await page.context().storageState({ path: authFile });
});
