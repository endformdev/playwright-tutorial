import { expect, test } from "@playwright/test";
import { testWithNewUser } from "./test-with-new-user";

test.describe("Plan Upgrade Flow", () => {
	testWithNewUser(
		"should successfully upgrade from Free to Plus plan",
		async ({ page }) => {
			await test.step("Navigate to dashboard and verify initial state", async () => {
				await page.goto("/dashboard");
				await expect(page).toHaveTitle("Playwright Tutorial");
				await expect(
					page.getByRole("heading", { name: "Team Settings" }),
				).toBeVisible();
			});

			await test.step("Verify current plan is Free", async () => {
				await expect(page.getByText("Current Plan: Free")).toBeVisible();
				await expect(page.getByText("No active subscription")).toBeVisible();
			});

			await test.step("Navigate to pricing page", async () => {
				await page.getByRole("link", { name: "Change Plan" }).click();
				await expect(page).toHaveURL(/.*\/pricing$/);
				await expect(
					page.getByRole("heading", { name: "Choose Your Plan" }),
				).toBeVisible();
			});

			await test.step("Verify available plans and select Plus plan", async () => {
				await expect(page.getByRole("heading", { name: "Base" })).toBeVisible();
				await expect(page.getByRole("heading", { name: "Plus" })).toBeVisible();
				await page.getByRole("button", { name: "Get Started" }).nth(1).click();
			});

			await test.step("Verify checkout page for Plus plan", async () => {
				await expect(page).toHaveURL(
					/.*\/pricing\/checkout\?plan=Plus&amount=1200$/,
				);
				await expect(
					page.getByRole("heading", { name: "Complete Your Purchase" }),
				).toBeVisible();
				await expect(
					page.getByText("You are purchasing: Plus for $12/month"),
				).toBeVisible();
			});

			await test.step("Fill payment information", async () => {
				await page
					.getByRole("textbox", { name: "Card Holder Name" })
					.fill("John Doe");
				await page
					.getByRole("textbox", { name: "Card Number (8 digits only)" })
					.fill("12345678");
				await page.getByRole("textbox", { name: "Expiry Date" }).fill("12/25");
				await page.getByRole("textbox", { name: "CVV" }).fill("123");
			});

			await test.step("Fill billing address", async () => {
				await page
					.getByRole("textbox", { name: "Street Address" })
					.fill("123 Main Street");
				await page.getByRole("textbox", { name: "City" }).fill("New York");
				await page.getByRole("textbox", { name: "State" }).fill("NY");
				await page.getByRole("textbox", { name: "ZIP Code" }).fill("10001");
				await page
					.getByRole("textbox", { name: "Country" })
					.fill("United States");
			});

			await test.step("Complete purchase", async () => {
				await page
					.getByRole("button", { name: "Complete Purchase - $12/month" })
					.click();
			});

			await test.step("Verify successful upgrade to Plus plan", async () => {
				await expect(page).toHaveURL(/.*\/dashboard\?payment=success$/);
				await expect(
					page.getByRole("heading", { name: "Team Settings" }),
				).toBeVisible();
				await expect(page.getByText("Current Plan: Plus")).toBeVisible();
				await expect(page.getByText("Billed monthly")).toBeVisible();
				await expect(
					page.getByText("No active subscription"),
				).not.toBeVisible();
			});
		},
	);
});
