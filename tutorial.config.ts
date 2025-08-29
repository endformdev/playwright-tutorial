import type { TutorialConfig } from "./scripts/types";

export const tutorialConfig: TutorialConfig = {
	docsRepo: "../docs",
	docsBasePath: "src/content/docs/tutorial",
	docsAssetsPath: "src/assets",
	stages: [
		{
			name: "stage-0-baseline",
			title: "Tutorial overview",
			order: 0,
			newPaths: [],
		},
		{
			name: "stage-1-setup",
			title: "Setting up Playwright",
			order: 1,
			newPaths: [
				"tests/",
				"playwright.config.ts",
				"global-setup.ts",
				"global-teardown.ts",
				"app/api/internal/",
			],
		},
		{
			name: "stage-2-generated-tests",
			title: "Generating tests with the Playwright MCP Server",
			order: 2,
			newPaths: [],
		},
		{
			name: "stage-3-endform-integration",
			title: "Running tests with Endform",
			order: 3,
			newPaths: [],
		},
		{
			name: "stage-4-completed",
			title: "Understanding test results with the Endform dashboard",
			order: 4,
			newPaths: [],
		},
	],
};
