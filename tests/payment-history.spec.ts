import { expect, test } from "./test";
import { testWithNewUser } from "./test-with-new-user";

type PaymentRow = {
	planName: string;
	amount: number;
	currency: string;
};

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

			await test.step("verify one expected payment was recorded", async () => {
				const payments = await page.evaluate(async () => {
					const response = await fetch("/api/payment");
					return (await response.json()) as PaymentRow[];
				});

				expect(payments).toHaveLength(1);
				expect(payments[0]).toMatchObject({
					planName: "Plus",
					amount: 1200,
					currency: "USD",
				});
			});
		},
	);
});
