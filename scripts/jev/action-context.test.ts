import { expect, test } from "bun:test";
import { candidates as benchmarkCandidates } from "../jev-benchmark";
import { candidates as nameChangeCandidates } from "../jev-loop";

const snapshot = `- main [ref=e1]:
  - generic [ref=e2]:
    - heading "Plus" [level=2] [ref=e3]
    - paragraph [ref=e4]: $12 per month
    - generic [ref=e5]:
      - button "Get Started" [ref=e6]
  - generic [ref=e7]:
    - heading "Pro" [level=2] [ref=e8]
    - paragraph [ref=e9]: $24 per month
    - generic [ref=e10]:
      - button "Get Started" [ref=e11]
  - region "Account" [ref=e12]:
    - textbox "Name" [ref=e13]
    - button "Save" [disabled] [ref=e14]`;

for (const [name, candidates] of [
	["name change", (tree: string) => nameChangeCandidates(tree, ["John Doe"])],
	[
		"benchmark",
		(tree: string) =>
			benchmarkCandidates(
				{ url: "https://example.test", title: "", snapshot: tree },
				["John Doe"],
			),
	],
] as const) {
	test(`${name}: identical buttons retain references and scoped card context`, () => {
		const actions = candidates(snapshot);
		const plus = actions.find((action) => action.ref === "e6")!;
		const pro = actions.find((action) => action.ref === "e11")!;
		expect(plus.description).toContain("[ref=e6]");
		expect(plus.description).toContain('heading "Plus"');
		expect(plus.description).toContain("$12 per month");
		expect(plus.description).not.toContain('"Pro"');
		expect(pro.description).toContain("[ref=e11]");
		expect(pro.description).toContain('heading "Pro"');
		expect(pro.description).not.toContain('"Plus"');
		expect(
			actions.find((action) => action.ref === "e13")?.description,
		).toContain('region "Account"');
		expect(actions.some((action) => action.ref === "e14")).toBe(false);
	});

	test(`${name}: identical context-free targets still have unique descriptions`, () => {
		const actions = candidates(
			'- button "Save" [ref=e1]\n- button "Save" [ref=e2]',
		);
		const clicks = actions.filter((action) => action.kind === "click");
		expect(new Set(clicks.map((action) => action.description)).size).toBe(2);
	});
}
