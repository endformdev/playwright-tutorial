import { expect, test } from "@playwright/test";
import { testWithNewUser } from "./test-with-new-user";

test.describe("User Password Change Flow", () => {
	testWithNewUser(
		"should successfully change password and sign in with new credentials",
		async ({ page }) => {
			let userEmail: string;

			await test.step("navigate to the dashboard", async () => {
				await page.goto("/");
				await page.getByTestId("user-menu-trigger").click();
				await page.getByRole("menuitem", { name: "Dashboard" }).click();

				await expect(page).toHaveURL(/.*\/dashboard/);
				await expect(
					page.getByRole("heading", { name: "Team Settings" }),
				).toBeVisible();
			});

			await test.step("navigate to general settings and capture user email", async () => {
				await page.getByRole("link", { name: "General" }).click();

				await expect(page).toHaveURL(/.*\/dashboard\/general/);
				await expect(
					page.getByRole("heading", { name: "General Settings" }),
				).toBeVisible();

				const emailField = page.getByRole("textbox", { name: "Email" });
				await expect(emailField).toBeVisible();
				userEmail = await emailField.inputValue();

				expect(userEmail).toBeTruthy();
				expect(userEmail).toContain("@");
			});

			await test.step("navigate to security settings", async () => {
				await page.getByRole("link", { name: "Security" }).click();

				await expect(page).toHaveURL(/.*\/dashboard\/security/);
				await expect(
					page.getByRole("heading", { name: "Security Settings" }),
				).toBeVisible();
			});

			await test.step("fill password change form and submit", async () => {
				const currentPasswordField = await page.getByRole("textbox", {
					name: "Current Password",
				});
				const newPasswordField = await page.getByRole("textbox", {
					name: "New Password",
					exact: true,
				});
				const confirmPasswordField = await page.getByRole("textbox", {
					name: "Confirm New Password",
				});
				const updatePasswordButton = await page.getByRole("button", {
					name: "Update Password",
				});

				await currentPasswordField.fill("testpassword123");
				await newPasswordField.fill("newpassword123");
				await confirmPasswordField.fill("newpassword123");

				await updatePasswordButton.click();
				await expect(
					page.getByText("Password updated successfully."),
				).toBeVisible();
			});

			await test.step("sign out after password change", async () => {
				await page.getByTestId("user-menu-trigger").click();
				await page.getByRole("menuitem", { name: "Sign out" }).click();

				await expect(page).toHaveTitle(/Playwright Tutorial/);
				await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
			});

			await test.step("sign in with new password", async () => {
				await page.goto("/sign-in");

				await expect(
					page.getByRole("heading", { name: "Sign in to your account" }),
				).toBeVisible();

				const emailSignInField = page.getByRole("textbox", { name: "Email" });
				const passwordSignInField = page.getByRole("textbox", {
					name: "Password",
				});
				const signInButton = page.getByRole("button", { name: "Sign in" });

				await emailSignInField.fill(userEmail);
				await passwordSignInField.fill("newpassword123");
				await signInButton.click();

				await expect(page).toHaveURL(/.*\/dashboard/);
				await expect(
					page.getByRole("heading", { name: "Team Settings" }),
				).toBeVisible();
			});
		},
	);
});
