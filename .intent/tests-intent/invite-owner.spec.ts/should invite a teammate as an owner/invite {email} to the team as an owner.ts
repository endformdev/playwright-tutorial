// intent: "invite {email} to the team as an owner"
// test: "should invite a teammate as an owner"
import type { StepContext } from "playwright-intent";

export default async function ({ page, context, request, expect, vars }: StepContext): Promise<void> {
	await page.getByRole('textbox', { name: 'Email' }).fill(vars.email);
	await page.getByRole('radio', { name: 'Owner' }).check();
	await page.getByRole('button', { name: 'Invite Member' }).click();
	await page.getByRole('button', { name: 'Yes, invite as owner' }).click();
	await expect(page.getByText('Invitation sent successfully')).toBeVisible();
}
