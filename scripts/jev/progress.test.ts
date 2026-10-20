import { expect, test } from "bun:test";
import { aimSteps, progressQuestions } from "./progress";

test("splits an aim into ordered parts without connectives", () => {
	expect(
		aimSteps(
			"Change the name to Jane, save it, then sign out. Then open General and confirm the email.",
		),
	).toEqual([
		"Change the name to Jane",
		"Save it",
		"Sign out.",
		"Open General and confirm the email.",
	]);
});

test("asks only about parts that are not finished yet", () => {
	const questions = progressQuestions(["Open Security", "Sign out"], [true]);
	expect(Object.keys(questions)).toEqual(["step_1"]);
	expect(questions.step_1.instructions.step).toBe("Sign out");
});
