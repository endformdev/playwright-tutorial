import { test } from "./test";

test("should invite a teammate as an owner", async ({ page, ai }) => {
	const email = `owner-${Date.now()}@example.com`;
	await page.goto("/dashboard");

	await ai.do("invite {email} to the team as an owner", { email });
	await ai.do("check that the invitation was sent");
});
