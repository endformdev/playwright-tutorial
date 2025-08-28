#!/usr/bin/env bun

import { tutorialConfig } from "../tutorial.config";
import { exists, loadStageContent, processContent } from "./utils";

export async function syncStageToocs(stageName: string): Promise<void> {
	console.log(`Syncing stage ${stageName} to docs repository...`);

	try {
		const content = await loadStageContent(stageName);

		// Process content to fix asset paths
		const _processedContent = processContent(content);

		// Ensure docs repository exists
		const docsRepoPath = tutorialConfig.docsRepo;
		if (!(await exists(docsRepoPath))) {
			throw new Error(`Docs repository not found at: ${docsRepoPath}`);
		}

		// Create docs content file path
		// const docsContentPath = join(docsRepoPath, 'src', 'content', 'docs', metadata.docsPath);
		// const docsContentDir = join(docsContentPath, '..');

		// // Ensure directory exists
		// await mkdir(docsContentDir, { recursive: true });

		// // Write content to docs repo
		// await Bun.write(docsContentPath, processedContent);
		// console.log(`✓ Content synced to: ${docsContentPath}`);

		// // Copy assets if they exist
		// const stageAssetsDir = join('tutorial', stageName, 'assets');
		// const docsAssetsDir = join(docsRepoPath, 'public', 'tutorial-assets', stageName.replace('stage-', 'stage-'));

		// if (await exists(stageAssetsDir)) {
		//   await copyDirectory(stageAssetsDir, docsAssetsDir);
		//   console.log(`✓ Assets synced to: ${docsAssetsDir}`);
		// } else {
		//   console.log(`- No assets found for stage ${stageName}`);
		// }

		// console.log(`✅ Stage ${stageName} synced successfully`);
	} catch (error) {
		console.error(`❌ Failed to sync stage ${stageName}:`, error);
		throw error;
	}
}

export async function syncAllStagesToocs(): Promise<void> {
	console.log("Syncing all stages to docs repository...");

	for (const stage of tutorialConfig.stages) {
		try {
			await syncStageToocs(stage.name);
		} catch (error) {
			console.error(`Failed to sync stage ${stage.name}:`, error);
		}
	}

	console.log("✅ All stages sync completed");
}

// CLI usage
if (import.meta.main) {
	const args = process.argv.slice(2);
	const command = args[0];

	if (command === "all") {
		await syncAllStagesToocs();
	} else if (command) {
		await syncStageToocs(command);
	} else {
		console.log("Usage: bun run scripts/content-sync.ts <stage-name|all>");
		process.exit(1);
	}
}
