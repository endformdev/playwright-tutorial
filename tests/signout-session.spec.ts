import { expect, test } from "./test";
import { testWithNewUser } from "./test-with-new-user";

test.describe("Sign out session", () => {
	testWithNewUser(
		"should clear the session when signing out",
		async ({ page }) => {
			await test.step("sign out from the authenticated user menu", async () => {
				await page.goto("/dashboard");
				await expect(
					page.getByRole("heading", { name: "Team Settings" }),
				).toBeVisible();
				await page.getByTestId("user-menu-trigger").click();
				await page.getByRole("menuitem", { name: "Sign out" }).click();
				await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
			});

			await test.step("verify protected dashboard redirects after sign out", async () => {
				await page.goto("/dashboard");
				await expect(page).toHaveURL(/.*\/sign-in$/);
				await expect(
					page.getByRole("heading", { name: "Sign in to your account" }),
				).toBeVisible();
			});
		},
	);
});
