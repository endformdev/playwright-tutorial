#!/usr/bin/env bun

import { tutorialConfig } from "../tutorial.config";
import { sync, syncDocsContent } from "./sync";
import { getCurrentBranch, pushBranch, switchBranch } from "./utils";

// CLI usage
if (import.meta.main) {
	const args = process.argv.slice(2);
	const command = args[0];

	try {
		switch (command) {
			case "list":
				await listStages();
				break;
			case "sync":
				await sync();
				break;
			case "sync-docs":
				await syncDocsContent();
				break;
			case "push":
				await push();
				break;

			default:
				console.log("Tutorial Manager");
				console.log("");
				console.log("Usage: bun run tutorial <command>");
				console.log("");
				console.log("Commands:");
				console.log("  list                      - List all tutorial stages");
				console.log("  sync                      - Sync all tutorial stages");
				console.log(
					"  sync-docs                 - Sync docs content to docs repo",
				);
				process.exit(1);
		}
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

async function listStages(): Promise<void> {
	console.log("Available tutorial stages:");
	console.log("");

	tutorialConfig.stages.forEach((stage) => {
		console.log(`${stage.order}. ${stage.name}`);
		console.log(`   Title: ${stage.title}`);
		console.log("");
	});
}

async function push(): Promise<void> {
	const currentBranch = await getCurrentBranch();

	for (const stage of tutorialConfig.stages) {
		await switchBranch(stage.name);
		await pushBranch();
	}

	await switchBranch("main");
	await pushBranch();

	await switchBranch(currentBranch);
}
