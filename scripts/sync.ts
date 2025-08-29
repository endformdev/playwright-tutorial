import { existsSync } from "fs";
import { copyFile, mkdir, readdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { tutorialConfig } from "../tutorial.config";
import {
	getCurrentBranch,
	getCurrentCommitMessage,
	switchBranch,
} from "./utils";

export async function sync() {
	const currentBranch = await getCurrentBranch();
	let currentStage = tutorialConfig.stages.find(
		(s) => s.name === currentBranch,
	);
	if (currentBranch === "main") {
		currentStage = {
			name: "main",
			title: "Main",
			order: 999,
			newPaths: [],
		};
	}
	if (!currentStage) {
		throw new Error("Current branch is not a tutorial stage");
	}

	// get the current commit message
	const commitMessage = await getCurrentCommitMessage();
	console.log(commitMessage);

	const previousStages = tutorialConfig.stages.filter(
		(s) => s.order < currentStage.order,
	);
	const nextStages = tutorialConfig.stages.filter(
		(s) => s.order > currentStage.order,
	);

	for (const stage of previousStages) {
		await switchBranch(stage.name);
		await pullToThisStage(currentBranch);
		const futurePaths = getFuturePathsFrom(stage.name);
		await removeFuturePaths(futurePaths);
		await commitAllChanges(commitMessage);
	}

	for (const stage of nextStages) {
		await switchBranch(stage.name);
		await pullToThisStage(currentBranch);
		const futurePaths = getFuturePathsFrom(stage.name);
		await restoreFuturePaths(futurePaths);
		await commitAllChanges(commitMessage);
	}

	if (currentBranch !== "main") {
		await switchBranch("main");
		await pullToThisStage(currentBranch);
		await commitAllChanges(commitMessage);
	}

	await switchBranch(currentBranch);

	await syncDocsContent();

	// for stages before this one

	// go to that stage
	// git checkout stage-1

	// bring all content to current stage
	// git restore --source=current-stage -- .

	// get paths of files that are added in future stages

	// remove content added in future stages
	// git restore --source=HEAD -- future-stage-file1 future-stage-file2

	// repeat

	// for stages after this one

	// go to that stage
	// git checkout stage-1

	// bring all content to current stage
	// git restore --source=current-stage -- .
}

export async function syncDocsContent() {
	console.log("Syncing tutorial content to docs...");

	for (const stage of tutorialConfig.stages) {
		const tutorialStagePath = join(process.cwd(), "tutorial", stage.name);
		const docsTargetPath = join(
			process.cwd(),
			tutorialConfig.docsRepo,
			tutorialConfig.docsBasePath,
		);
		const docsAssetsPath = join(
			process.cwd(),
			tutorialConfig.docsRepo,
			tutorialConfig.docsAssetsPath,
		);

		try {
			// Read all MDX files in the tutorial stage directory
			const files = await readdir(tutorialStagePath);
			const mdxFiles = files.filter((file) => file.endsWith(".mdx"));
			const otherFiles = files.filter((file) => !file.endsWith(".mdx"));

			console.log(`Found ${mdxFiles.length} MDX files in ${stage.name}`);

			for (const mdxFile of mdxFiles) {
				const sourcePath = join(tutorialStagePath, mdxFile);
				const targetPath = join(docsTargetPath, mdxFile);

				// Read and copy the file content
				const content = await readFile(sourcePath, "utf-8");
				await writeFile(targetPath, content, "utf-8");

				console.log(`Copied ${mdxFile} to docs`);
			}

			for (const otherFile of otherFiles) {
				const sourcePath = join(tutorialStagePath, otherFile);
				const targetPath = join(docsAssetsPath, otherFile);

				await copyFile(sourcePath, targetPath);
			}
		} catch (error) {
			console.error(`Error syncing ${stage.name}:`, error);
		}
	}

	console.log("Tutorial content sync completed");
}

function getFuturePathsFrom(stageName: string): string[] {
	const stage = tutorialConfig.stages.find((s) => s.name === stageName);
	if (!stage) {
		throw new Error("Stage not found");
	}
	const nextStages = tutorialConfig.stages.filter((s) => s.order > stage.order);
	return nextStages.flatMap((s) => s.newPaths);
}

async function isPathTrackedByGit(path: string): Promise<boolean> {
	const proc = Bun.spawn(["git", "ls-files", "--error-unmatch", "--", path], {
		stdout: "pipe",
		stderr: "pipe",
	});

	await proc.exited;
	return proc.exitCode === 0;
}

async function removeFuturePaths(futurePaths: string[]): Promise<void> {
	for (const path of futurePaths) {
		const isTracked = await isPathTrackedByGit(path);

		if (isTracked) {
			// If tracked by git, restore from HEAD
			const proc = Bun.spawn(["git", "restore", "--source=HEAD", "--", path], {
				stdout: "pipe",
				stderr: "pipe",
			});

			await proc.exited;

			if (proc.exitCode !== 0) {
				const error = await new Response(proc.stderr).text();
				throw new Error(`Failed to restore tracked path ${path}: ${error}`);
			}
		} else {
			// If not tracked by git, remove forcefully
			const proc = Bun.spawn(["rm", "-rf", path], {
				stdout: "pipe",
				stderr: "pipe",
			});

			await proc.exited;

			if (proc.exitCode !== 0) {
				const error = await new Response(proc.stderr).text();
				throw new Error(`Failed to remove untracked path ${path}: ${error}`);
			}
		}
	}
}

async function restoreFuturePaths(futurePaths: string[]): Promise<void> {
	const proc = Bun.spawn(
		["git", "restore", "--source=HEAD", "--", ...futurePaths],
		{
			stdout: "pipe",
			stderr: "pipe",
		},
	);

	await proc.exited;

	if (proc.exitCode !== 0) {
		const error = await new Response(proc.stderr).text();
		throw new Error(`Failed to restore future paths: ${error}`);
	}
}

export async function pullToThisStage(fromStageBranch: string): Promise<void> {
	const proc = Bun.spawn(
		["git", "restore", `--source=${fromStageBranch}`, "--", "."],
		{
			stdout: "pipe",
			stderr: "pipe",
		},
	);

	await proc.exited;

	if (proc.exitCode !== 0) {
		const error = await new Response(proc.stderr).text();
		throw new Error(`Failed to switch branch: ${error}`);
	}
}

export async function commitAllChanges(message: string): Promise<void> {
	// git add -A
	const proc = Bun.spawn(["git", "add", "-A"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	await proc.exited;

	if (proc.exitCode !== 0) {
		const error = await new Response(proc.stderr).text();
		throw new Error(`Failed to add all changes: ${error}`);
	}

	// git commit -m "Sync with previous stage"
	const proc2 = Bun.spawn(["git", "commit", "-m", message], {
		stdout: "pipe",
		stderr: "pipe",
	});

	await proc2.exited;

	if (proc2.exitCode !== 0) {
		const error = await new Response(proc2.stderr).text();
		throw new Error(`Failed to commit all changes: ${error}`);
	}
}
