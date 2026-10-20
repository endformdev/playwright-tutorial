// Named controller configurations, so one benchmark batch can interleave them
// under the same conditions. Each flag is an algorithm change under test.
export type Variant = {
	name: string;
	description: string;
	// Which loop runs: Jev choosing among listed candidate actions, or
	// Clairic pointing at an element reference and a value itself.
	controller: "jev" | "clairic";
	model: string;
	// Send the current page screenshot to Jev alongside the accessibility tree.
	images: boolean;
	// Wait for network and accessibility-tree quiescence after each action.
	settle: boolean;
	// Remember every past action compactly, with the page text it produced,
	// instead of the last five actions with full accessibility trees.
	memory: boolean;
	// Offer one fill per field; a per-field question picks the supplied value.
	// Report the browser's validation message for the focused field.
	fieldValues: boolean;
	// Split "stop" into finishing (a completion claim that is verified) and
	// giving up, instead of one option for both.
	finish: boolean;
	// Stop offering an action that changed nothing, until the page changes.
	skipNoops: boolean;
	// Track which parts of the aim are done (Jev judges each part, code keeps
	// finished parts finished) and ask for an action for the current part.
	steps: boolean;
	// Offer pressing Escape: modal menus hide the rest of the page from the
	// accessibility tree, leaving no other way back.
	escape: boolean;
	// Clairic only: ask Clef whether the aim is complete, instead of asking
	// Clairic to quote the text that proves it.
	clefDone: boolean;
};

const baseline = {
	settle: false,
	memory: false,
	fieldValues: false,
	finish: false,
	skipNoops: false,
	steps: false,
	escape: false,
	clefDone: false,
};

const variantList: Variant[] = [
	{
		name: "text-1.13",
		description:
			"September 28 no-gate controller: accessibility tree only, Jev 1.13.",
		controller: "jev",
		model: "jev-1.13.0",
		images: false,
		...baseline,
	},
	{
		name: "text",
		description: "No-gate controller: accessibility tree only, Jev 1.14.",
		controller: "jev",
		model: "jev-1.14.0",
		images: false,
		...baseline,
	},
	{
		name: "images",
		description:
			"No-gate controller plus the current full-page screenshot, Jev 1.14.",
		controller: "jev",
		model: "jev-1.14.0",
		images: true,
		...baseline,
	},
	{
		name: "stepwise",
		description:
			"Screenshots plus every controller change: settling, compact history, per-field values, finish, no-op skipping, stepwise progress, and Escape.",
		controller: "jev",
		model: "jev-1.14.0",
		images: true,
		settle: true,
		memory: true,
		fieldValues: true,
		finish: true,
		skipNoops: true,
		steps: true,
		escape: true,
		clefDone: false,
	},
	{
		name: "stepwise-text",
		description: "The stepwise controller without screenshots.",
		controller: "jev",
		model: "jev-1.14.0",
		images: false,
		settle: true,
		memory: true,
		fieldValues: true,
		finish: true,
		skipNoops: true,
		steps: true,
		escape: true,
		clefDone: false,
	},
	{
		name: "clairic",
		description:
			"Clairic points at the next element and value itself; no candidate actions. Quotes completion evidence.",
		controller: "clairic",
		model: "clairic",
		images: false,
		...baseline,
		settle: true,
	},
	{
		name: "clairic-screenshot",
		description: "The clairic loop plus the current full-page screenshot.",
		controller: "clairic",
		model: "clairic",
		images: true,
		...baseline,
		settle: true,
	},
	{
		name: "clairic-clef",
		description:
			"The clairic loop, with Clef answering whether the aim is complete.",
		controller: "clairic",
		model: "clairic",
		images: false,
		...baseline,
		settle: true,
		clefDone: true,
	},
];

export const variants = new Map(
	variantList.map((variant) => [variant.name, variant]),
);
