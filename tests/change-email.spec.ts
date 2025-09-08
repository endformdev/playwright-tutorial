import { expect, test } from "@playwright/test";

// Use a clean user for this test, to not interfere with other tests
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("User Email Change Flow", () => {
	test("should sign up new user, change email, sign out, and sign in with new email", async ({
		page,
	}) => {
		// Generate random emails for the test
		const initialEmail = `${Math.random().toString(36).substring(2, 15)}@example.com`;
		const newEmail = `${Math.random().toString(36).substring(2, 15)}@example.com`;
		const testPassword = "testpassword123";

		await test.step("Navigate to homepage and ensure clean state", async () => {
			await page.goto("/");
			await expect(page).toHaveTitle("Playwright Tutorial");

			// Verify we're not logged in by checking for Sign Up link
			await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
		});

		await test.step("Navigate to sign up page", async () => {
			await page.getByRole("link", { name: "Sign Up" }).click();
			await expect(page).toHaveURL("/sign-up");
			await expect(
				page.getByRole("heading", { name: "Create your account" }),
			).toBeVisible();
		});

		await test.step("Fill signup form and submit", async () => {
			await page.getByRole("textbox", { name: "Email" }).fill(initialEmail);
			await page.getByRole("textbox", { name: "Password" }).fill(testPassword);
			await page.getByRole("button", { name: "Sign up" }).click();
		});

		await test.step("Verify successful signup redirects to dashboard", async () => {
			await expect(page).toHaveURL("/dashboard");
			await expect(
				page.getByRole("heading", { name: "Team Settings" }),
			).toBeVisible();
			// Verify initial email appears in team members list
			await expect(page.getByText(initialEmail)).toBeVisible();
		});

		await test.step("Navigate to general settings page", async () => {
			await page.getByRole("link", { name: "General" }).click();
			await expect(page).toHaveURL("/dashboard/general");
			await expect(
				page.getByRole("heading", { name: "General Settings" }),
			).toBeVisible();
		});

		await test.step("Change email to new randomly generated email", async () => {
			const nameInput = page.getByRole("textbox", { name: "Name" });
			await expect(nameInput).toBeVisible();
			await nameInput.fill("John Doe");

			const emailInput = page.getByRole("textbox", { name: "Email" });
			await expect(emailInput).toBeVisible();
			await expect(emailInput).toHaveValue(initialEmail);

			await emailInput.clear();
			await emailInput.fill(newEmail);
			await page.getByRole("button", { name: "Save Changes" }).click();

			// Wait for success message
			await expect(
				page.getByText("Account updated successfully."),
			).toBeVisible();
		});

		await test.step("Sign out", async () => {
			// Click on user menu button
			await page.getByTestId("user-menu-trigger").click();
			await page.getByRole("button", { name: "Sign out" }).click();

			// Verify we're signed out by checking for Sign Up link
			await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
		});

		await test.step("Sign in with new email and test password", async () => {
			// If not already on sign-in page, navigate there
			const currentUrl = page.url();
			if (!currentUrl.includes("/sign-in")) {
				await page.goto("/sign-in");
			}

			await expect(
				page.getByRole("heading", { name: "Sign in to your account" }),
			).toBeVisible();

			await page.getByRole("textbox", { name: "Email" }).fill(newEmail);
			await page.getByRole("textbox", { name: "Password" }).fill(testPassword);
			await page.getByRole("button", { name: "Sign in" }).click();
		});

		await test.step("Verify successful sign in and redirect to team settings page", async () => {
			await expect(page).toHaveURL("/dashboard");
			await expect(
				page.getByRole("heading", { name: "Team Settings" }),
			).toBeVisible();
		});

		await test.step("Verify new email is displayed in general settings page", async () => {
			await page.getByRole("link", { name: "General" }).click();
			await expect(page).toHaveURL("/dashboard/general");
			await expect(
				page.getByRole("heading", { name: "General Settings" }),
			).toBeVisible();

			// Verify the new email is displayed in the email field
			const emailInput = page.getByRole("textbox", { name: "Email" });
			await expect(emailInput).toBeVisible();
			await expect(emailInput).toHaveValue(newEmail);
		});
	});
});
