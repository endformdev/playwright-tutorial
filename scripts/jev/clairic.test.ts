import { expect, test } from "bun:test";
import { clairicAction, clairicState } from "./clairic";

const tree = `- main [ref=e1]:
  - textbox "Name" [ref=e2]
  - radio "Owner" [ref=e3]
  - button "Save" [ref=e4]`;
const answer = (value: unknown) => ({ type: "text", value });

test("the pointed-at element's role decides the action", () => {
	expect(
		clairicAction({ element: answer("e2"), text: answer("Jane") }, tree).action,
	).toMatchObject({ kind: "fill", ref: "e2", value: "Jane" });
	expect(
		clairicAction({ element: answer("[ref=e3]"), text: answer(null) }, tree)
			.action,
	).toMatchObject({ kind: "check", ref: "e3" });
	expect(
		clairicAction({ element: answer("e4"), text: answer("Jane") }, tree).action,
	).toMatchObject({
		kind: "click",
		ref: "e4",
		description: 'Clicked - button "Save" [ref=e4]',
	});
	expect(
		clairicAction(
			{ element: answer(null), url: answer("/dashboard\n\nCurrent") },
			tree,
		).action,
	).toMatchObject({ kind: "goto", value: "/dashboard" });
	expect(
		clairicAction(
			{ element: answer("e4\n  - next line"), url: answer("/x") },
			tree,
		).action,
	).toMatchObject({ kind: "click", ref: "e4" });
});

test("spans that are not elements on the page are reported, not executed", () => {
	expect(clairicAction({ element: answer("Jane") }, tree)).toEqual({
		problem: '"Jane" is not an element reference on this page',
	});
	expect(clairicAction({ element: answer(null) }, tree)).toEqual({
		problem: "Clairic named no element or URL to act on",
	});
});

test("the state is plain text with every section the fields refer to", () => {
	const state = clairicState({
		aim: "Change the name",
		successCriteria: ["The name changed."],
		values: ["Jane"],
		directUrls: ["/dashboard"],
		url: "https://example.test/dashboard",
		title: "Settings",
		log: ['Clicked - button "General" [ref=e9] -> done; now on /general'],
		tree,
	});
	expect(state).toContain('Supplied values: "Jane"');
	expect(state).toContain("Direct URLs: /dashboard");
	expect(state).toContain("1. Clicked");
	expect(state.endsWith(tree)).toBe(true);
});
