import { contextualTargets } from "./action-context";

// Clairic (Cloudflare's extraction model) answers with typed values instead
// of choosing from options. A `text` field is an exact span of the state, so
// the controller lists no candidate actions: Clairic points at an element
// reference in the accessibility tree, at a value to type, and at the text
// that proves the aim is complete.
export const clairicFields = {
	element: {
		type: "text",
		instructions:
			"The ref (like e12) of the interactive element (button, link, textbox, checkbox, or radio) to click or type into next to make progress on the aim, or null if the next step is opening a direct URL.",
	},
	text: {
		type: "text",
		instructions:
			"The supplied value to type into that element if it is a text field, or null if the next step is not typing.",
	},
	url: {
		type: "text",
		instructions:
			"A path from Direct URLs to open next, or null to act on a page element instead.",
	},
} as const;

// Completion as a span too: the text that proves the aim is met, or null.
export const clairicDoneField = {
	done: {
		type: "text",
		instructions:
			"Quote the text showing that every success criterion is met, or null if the aim is not complete yet.",
	},
} as const;

export type ClairicAnswer = {
	type: string;
	value: unknown;
	guess?: unknown;
	p_null?: number;
	confidence?: number;
};

export type ClairicAction = {
	id: string;
	kind: "click" | "fill" | "check" | "goto";
	ref?: string;
	value?: string;
	description: string;
};

export function clairicState(page: {
	aim: string;
	successCriteria: string[];
	values: string[];
	directUrls: string[];
	url: string;
	title: string;
	log: string[];
	tree: string;
}) {
	return [
		`Aim: ${page.aim}`,
		`Success criteria:\n${page.successCriteria.map((criterion) => `- ${criterion}`).join("\n")}`,
		`Supplied values: ${page.values.map((value) => JSON.stringify(value)).join(", ") || "none"}`,
		`Direct URLs: ${page.directUrls.join(", ")}`,
		`Actions so far:\n${page.log.map((line, index) => `${index + 1}. ${line}`).join("\n") || "none"}`,
		`Current page: ${page.url} (${page.title})`,
		`Page accessibility tree:\n${page.tree}`,
	].join("\n\n");
}

// Turn Clairic's answers into one browser action: act on the element if it
// is a reference on this page (its role decides how), otherwise open the
// URL. Only the first token of a span is read, since spans can run on into
// the next line of the state.
export function clairicAction(
	answers: Record<string, ClairicAnswer>,
	tree: string,
): { action?: ClairicAction; problem?: string } {
	// Accept e12, ref=e12, or [ref=e12].
	const pointer = firstToken(answers.element?.value)
		?.replace(/^\[?ref=/, "")
		.replace(/[\]:,]+$/, "");
	const url = firstToken(answers.url?.value);
	const target = contextualTargets(tree).find(
		(candidate) => candidate.ref === pointer,
	);
	if (!target && url)
		return {
			action: {
				id: "clairic",
				kind: "goto",
				value: url,
				description: `Opened ${url}`,
			},
		};
	if (!target)
		return {
			problem: pointer
				? `${JSON.stringify(pointer)} is not an element reference on this page`
				: "Clairic named no element or URL to act on",
		};
	const line = target.label.replace(/ \(context: .*$/, "");
	const text = answers.text?.value;
	if (
		["textbox", "searchbox", "combobox"].includes(target.role) &&
		typeof text === "string"
	)
		return {
			action: {
				id: "clairic",
				kind: "fill",
				ref: target.ref,
				value: text,
				description: `Typed ${JSON.stringify(text)} into ${line}`,
			},
		};
	if (["checkbox", "radio"].includes(target.role))
		return {
			action: {
				id: "clairic",
				kind: "check",
				ref: target.ref,
				description: `Selected ${line}`,
			},
		};
	return {
		action: {
			id: "clairic",
			kind: "click",
			ref: target.ref,
			description: `Clicked ${line}`,
		},
	};
}

function firstToken(value: unknown) {
	return typeof value === "string"
		? value.trim().split(/\s+/)[0] || undefined
		: undefined;
}
