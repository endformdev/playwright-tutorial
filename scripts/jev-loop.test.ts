import { expect, test } from "bun:test";
import { actionCode, candidates } from "./jev-loop";

test("builds actions from live references while preserving separate identical labels", () => {
	const actions = candidates(
		`- heading "Settings" [level=1] [ref=e1]
- link "Team" [ref=e2]
- textbox "Name" [ref=e3]: Old Name
- button "Save" [disabled] [ref=e4]
- button "Save" [ref=e5]
- button "Save" [ref=e6]`,
		["John Doe"],
	);
	expect(actions.filter((a) => a.kind === "click").map((a) => a.ref)).toEqual([
		"e2",
		"e5",
		"e6",
	]);
	expect(actions.find((a) => a.kind === "fill")?.value).toBe("John Doe");
	expect(
		actions.filter((a) => a.kind === "wait" || a.kind === "stop"),
	).toHaveLength(2);
});

test("text values remain literal data in executable actions", () => {
	const value = 'O\'Brien "quoted"\n${process.exit()}';
	const action = candidates('- textbox "Name" [ref=e3]', [value]).find(
		(a) => a.kind === "fill",
	)!;
	expect(actionCode(action)).toBe(
		`await page.locator("aria-ref=e3").fill(${JSON.stringify(value)}, { timeout: 5000 });`,
	);
	expect(() => actionCode({ ...action, ref: 'e3"); throw 1;' })).toThrow();
});
