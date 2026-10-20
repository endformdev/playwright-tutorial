// Split an aim into its ordered parts: sentences, then comma-separated
// clauses, without leading connectives. Plain text handling only, so any
// aim written as a sequence of instructions gets the same treatment.
export function aimSteps(aim: string): string[] {
	return aim
		.split(/(?<=[.!?])\s+/)
		.flatMap((sentence) => sentence.split(/,\s+/))
		.map((part) =>
			part
				.trim()
				.replace(/^(?:and|then)\s+/i, "")
				.replace(/^(?:and|then)\s+/i, ""),
		)
		.filter(Boolean)
		.map((part) => part[0].toUpperCase() + part.slice(1));
}

// One yes/no question per unfinished step. Finished steps stay finished:
// asking again could undo progress after the page moves on.
export function progressQuestions(steps: string[], completed: boolean[]) {
	return Object.fromEntries(
		steps.flatMap((step, index) =>
			completed[index]
				? []
				: [
						[
							`step_${index}`,
							{
								type: "noul",
								instructions: {
									step,
									question:
										"Has `step` been completed? Earlier actions and their results are in `history`; the current page is the latest evidence.",
								},
							},
						],
					],
		),
	);
}
