type SnapshotNode = {
	indent: number;
	role: string;
	ref?: string;
	label: string;
	parent?: SnapshotNode;
	children: SnapshotNode[];
};

// Keep the target's live reference and describe its surroundings using only
// the existing tree. No application-specific labels or additional DOM reads.
export function contextualTargets(snapshot: string) {
	const root: SnapshotNode = {
		indent: -1,
		role: "root",
		label: "",
		children: [],
	};
	const stack = [root];
	const nodes: SnapshotNode[] = [];
	for (const line of snapshot.split("\n")) {
		const match = line.match(/^(\s*)- (\w+)(?:\s|:|$)/);
		if (!match) continue;
		const indent = match[1].length;
		while (stack.length > 1 && stack.at(-1)!.indent >= indent) stack.pop();
		const parent = stack.at(-1)!;
		const node: SnapshotNode = {
			indent,
			role: match[2],
			ref: line.match(/\[ref=([\w]+)\]/)?.[1],
			label: line.trim(),
			parent,
			children: [],
		};
		parent.children.push(node);
		nodes.push(node);
		stack.push(node);
	}
	return nodes
		.filter((node) => node.ref)
		.map((node) => {
			const context: string[] = [];
			let child = node;
			for (
				let parent = node.parent;
				parent && parent !== root;
				parent = parent.parent
			) {
				// Named ancestors and their direct descriptive children distinguish
				// cards/forms even when their headings are siblings of the control.
				const nearby = parent.children
					.slice(0, parent.children.indexOf(child))
					.filter(
						(sibling) =>
							["heading", "paragraph", "generic", "text"].includes(
								sibling.role,
							) && hasText(sibling.label),
					);
				const heading = nearby.findLast(
					(sibling) => sibling.role === "heading",
				);
				const descriptions = heading
					? [
							heading,
							...nearby.filter((sibling) => sibling !== heading).slice(-2),
						]
					: nearby.slice(-3);
				context.push(...descriptions.map((sibling) => sibling.label));
				if (hasText(parent.label)) context.push(parent.label);
				if (context.length >= 6) break;
				child = parent;
			}
			const nearby = [...new Set(context)].slice(0, 6);
			return {
				role: node.role,
				ref: node.ref!,
				disabled: node.label.includes("[disabled]"),
				checked: node.label.includes("[checked]"),
				// Textboxes show their value inline or as a child text line.
				value:
					lineValue(node.label) ??
					node.children
						.filter((child) => child.role === "text")
						.map((child) => lineValue(child.label))
						.find((value) => value !== undefined),
				label:
					node.label +
					(nearby.length ? ` (context: ${nearby.join("; ")})` : ""),
			};
		});
}

// Text the page gained after an action, in page order: status messages,
// validation errors, or the content of a newly opened page. References and
// pointer hints are ignored so unchanged elements never count as new.
export function newPageText(before: string, after: string, limit = 12) {
	const remaining = new Map<string, number>();
	for (const line of textLines(before))
		remaining.set(line, (remaining.get(line) ?? 0) + 1);
	const added: string[] = [];
	for (const line of textLines(after)) {
		const count = remaining.get(line) ?? 0;
		if (count > 0) remaining.set(line, count - 1);
		else added.push(line);
	}
	return added.slice(0, limit);
}

// The page's visible text and states, independent of references and focus.
export function pageText(snapshot: string) {
	return textLines(snapshot).join("\n");
}

function textLines(snapshot: string) {
	return snapshot
		.split("\n")
		.map((line) =>
			line
				.trim()
				.replace(/^- /, "")
				.replace(/\s*\[(?:ref|cursor)=[^\]]*\]|\s*\[active\]/g, "")
				.replace(/:$/, ""),
		)
		.filter(
			(line) =>
				!line.startsWith("/") && (/^\w+ "/.test(line) || /: \S/.test(line)),
		)
		.map((line) => (line.length > 160 ? `${line.slice(0, 157)}...` : line));
}

function lineValue(label: string) {
	const value = label.match(
		/^- \w+(?: "(?:[^"\\]|\\.)*")?(?: \[[^\]]*\])*: (.*\S)\s*$/,
	)?.[1];
	if (!value?.startsWith('"')) return value;
	try {
		return JSON.parse(value) as string;
	} catch {
		return value;
	}
}

function hasText(label: string) {
	return /^- \w+\s+"/.test(label) || /:\s*\S/.test(label);
}
