import { expect, test } from "./test";
import { testWithNewUser } from "./test-with-new-user";

test.describe("Payment history", () => {
	testWithNewUser(
		"should record exactly one payment after upgrading to Plus",
		async ({ page }) => {
			await test.step("complete a Plus plan checkout", async () => {
				await page.goto("/dashboard");
				await page.getByRole("link", { name: "Change Plan" }).click();
				await expect(page).toHaveURL(/.*\/pricing$/);
				await page.getByRole("button", { name: "Get Started" }).nth(1).click();
				await expect(page).toHaveURL(
					/.*\/pricing\/checkout\?plan=Plus&amount=1200$/,
				);
				await page.getByRole("link", { name: "Continue to payment" }).click();
				await expect(page).toHaveURL(/.*&step=payment$/);

				await page
					.getByRole("textbox", { name: "Card Holder Name" })
					.fill("John Doe");
				await page
					.getByRole("textbox", { name: "Card Number (8 digits only)" })
					.fill("12345678");
				await page.getByRole("textbox", { name: "Expiry Date" }).fill("12/25");
				await page.getByRole("textbox", { name: "CVV" }).fill("123");
				await page
					.getByRole("textbox", { name: "Street Address" })
					.fill("123 Main Street");
				await page.getByRole("textbox", { name: "City" }).fill("New York");
				await page.getByRole("textbox", { name: "State" }).fill("NY");
				await page.getByRole("textbox", { name: "ZIP Code" }).fill("10001");
				await page
					.getByRole("textbox", { name: "Country" })
					.fill("United States");
				await page
					.getByRole("button", { name: "Complete Purchase - $12/month" })
					.click();
				await expect(page).toHaveURL(/.*\/dashboard\?payment=success$/);
			});

			await test.step("verify one Plus payment in the billing history", async () => {
				await expect(page.getByText("Current Plan: Plus")).toBeVisible();
				await expect(page.getByText("Billing History")).toBeVisible();
				const payments = page.getByTestId("payment");
				await expect(payments.first()).toBeVisible();
				await expect(payments).toHaveCount(1);
				await expect(payments.first()).toContainText("Plus plan");
				await expect(payments.first()).toContainText("$12.00");
			});
		},
	);
});
