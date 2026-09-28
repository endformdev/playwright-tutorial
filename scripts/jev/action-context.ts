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
				label:
					node.label +
					(nearby.length ? ` (context: ${nearby.join("; ")})` : ""),
			};
		});
}

function hasText(label: string) {
	return /^- \w+\s+"/.test(label) || /:\s*\S/.test(label);
}
