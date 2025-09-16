import { expect, test } from "@playwright/test";

test.describe("Flaky Test", () => {
	test("should pass most of the time, but sometimes fail", async ({ page }) => {
		await page.goto("/dashboard");
		await expect(
			page.getByRole("heading", { name: "Team Settings" }),
		).toBeVisible();

		// Let's make this test flaky by randomly failing 30% of the time
		const randomNumber = Math.random();
		expect(randomNumber).toBeLessThan(0.7);
	});
});
