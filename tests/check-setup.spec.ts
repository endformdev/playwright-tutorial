import { expect, test } from "./test";

test("has title", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveTitle(/Playwright Tutorial/);
});

test("is already logged in", async ({ page }) => {
	await page.goto("/dashboard");

	await expect(
		page.getByRole("heading", { name: "Team Settings" }),
	).toBeVisible();
	await expect(page.getByTestId("team-member").first()).toBeVisible();
});
