import { expect, test } from "bun:test";
import { actionCode, candidates, select } from "./jev-benchmark";

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

test("per-field fills take the value Jev chose for that field", () => {
	const actions = candidates(
		{
			url: "https://example.test/checkout",
			title: "Checkout",
			snapshot:
				'- textbox "Name" [ref=e1]: John Doe\n- textbox "City" [ref=e2]\n- button "Pay" [ref=e3]',
		},
		["John Doe", "New York"],
		{ fieldValues: true },
	);
	expect(actions.filter((action) => action.kind === "fill")).toHaveLength(2);
	const answers = {
		next: {
			type: "choice",
			choice: "a0",
			probabilities: { a0: 0.5, a1: 0.3, a2: 0.2 },
		},
		value_a0: { type: "choice", choice: "v0" },
		value_a1: { type: "choice", choice: "v1" },
	};
	// Name already holds its chosen value, so the next most probable action runs.
	const selected = select(actions, answers, ["John Doe", "New York"]);
	expect(selected?.ref).toBe("e2");
	expect(selected?.value).toBe("New York");
	expect(actionCode(selected!)).toContain('"New York"');
	expect(
		select(
			actions,
			{ ...answers, next: { ...answers.next, choice: "missing" } },
			[],
		),
	).toBeUndefined();
});

test("without per-field values the chosen action runs unchanged", () => {
	const actions = candidates(
		{
			url: "https://example.test",
			title: "",
			snapshot: '- button "Go" [ref=e1]',
		},
		[],
	);
	expect(
		select(
			actions,
			{ next: { type: "choice", choice: "wait", probabilities: { a0: 0.9 } } },
			[],
		)?.kind,
	).toBe("wait");
});
