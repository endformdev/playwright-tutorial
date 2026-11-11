// intent: "check that the invitation was sent"
// test: "should invite a teammate as an owner"
import type { StepContext } from "playwright-intent";

export default async function ({ page, context, request, expect, vars }: StepContext): Promise<void> {
	await expect(page.getByText('Invitation sent successfully')).toBeVisible();
}
