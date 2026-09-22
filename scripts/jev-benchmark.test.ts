import { expect, test } from "bun:test";
import { actionCode, candidates } from "./jev-benchmark";

test("builds bounded actions from an accessibility observation", () => {
	const actions = candidates(
		{
			url: "https://example.test/dashboard",
			title: "Settings",
			snapshot:
				'- link "General" [ref=e1]\n- textbox "Name" [ref=e2]\n- radio "Member" [ref=e3]\n- button "Save" [disabled] [ref=e4]',
			invitationId: "42",
		},
		["John Doe"],
	);
	expect(actions.map((action) => action.kind)).toEqual([
		"click",
		"fill",
		"check",
		"goto",
		"goto",
		"wait",
		"stop",
	]);
});

test("keeps action arguments literal", () => {
	const value = "x\n${process.exit()}";
	expect(actionCode({ id: "x", kind: "goto", value, description: "go" })).toBe(
		`await page.goto(${JSON.stringify(value)});`,
	);
	expect(() =>
		actionCode({
			id: "x",
			kind: "click",
			ref: 'e1"); throw 1',
			description: "bad",
		}),
	).toThrow();
});
