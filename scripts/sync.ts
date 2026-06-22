import { existsSync } from "node:fs";
import {
	copyFile,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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
	const preservedUntrackedFiles = await createPreservedUntrackedFiles();
	await preserveCurrentUntrackedFiles(preservedUntrackedFiles);

	// get the current commit message
	const commitMessage = await getCurrentCommitMessage();
	console.log(commitMessage);

	const previousStages = tutorialConfig.stages.filter(
		(s) => s.order < currentStage.order,
	);
	const nextStages = tutorialConfig.stages.filter(
		(s) => s.order > currentStage.order,
	);

	try {
		for (const stage of previousStages) {
			await switchBranchPreservingUntracked(
				stage.name,
				preservedUntrackedFiles,
			);
			await pullToThisStage(currentBranch);
			const futurePaths = getFuturePathsFrom(stage.name);
			await removeFuturePaths(futurePaths);
			await commitAllChanges(commitMessage);
		}

		for (const stage of nextStages) {
			await switchBranchPreservingUntracked(
				stage.name,
				preservedUntrackedFiles,
			);
			await pullToThisStage(currentBranch);
			const futurePaths = getFuturePathsFrom(stage.name);
			await restoreFuturePaths(futurePaths);
			await commitAllChanges(commitMessage);
		}

		if (currentBranch !== "main") {
			await switchBranchPreservingUntracked("main", preservedUntrackedFiles);
			await pullToThisStage(currentBranch);
			await commitAllChanges(commitMessage);
		}

		await switchBranchPreservingUntracked(
			currentBranch,
			preservedUntrackedFiles,
		);

		await syncDocsContent();
	} finally {
		try {
			if ((await getCurrentBranch()) !== currentBranch) {
				await switchBranchPreservingUntracked(
					currentBranch,
					preservedUntrackedFiles,
				);
			}
		} finally {
			await restorePreservedUntrackedFiles(preservedUntrackedFiles);
		}
	}

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

type PreservedUntrackedFiles = {
	backupRoot: string;
	files: string[];
};

async function createPreservedUntrackedFiles(): Promise<PreservedUntrackedFiles> {
	return {
		backupRoot: await mkdtemp(join(tmpdir(), "tutorial-sync-untracked-")),
		files: [],
	};
}

async function switchBranchPreservingUntracked(
	branchName: string,
	preservedFiles: PreservedUntrackedFiles,
): Promise<void> {
	await preserveCurrentUntrackedFiles(preservedFiles);
	await switchBranch(branchName);
}

async function preserveCurrentUntrackedFiles(
	preservedFiles: PreservedUntrackedFiles,
): Promise<void> {
	const files = await getUntrackedFiles();
	if (files.length === 0) {
		return;
	}

	for (const file of files) {
		if (!existsSync(file)) {
			continue;
		}

		const targetPath = join(preservedFiles.backupRoot, file);
		await mkdir(dirname(targetPath), { recursive: true });
		if (!existsSync(targetPath)) {
			await copyFile(file, targetPath);
			preservedFiles.files.push(file);
		}
		await rm(file, { force: true });
	}
}

async function restorePreservedUntrackedFiles(
	preservedFiles: PreservedUntrackedFiles,
): Promise<void> {
	try {
		for (const file of preservedFiles.files) {
			if (existsSync(file)) {
				continue;
			}

			const sourcePath = join(preservedFiles.backupRoot, file);
			if (!existsSync(sourcePath)) {
				continue;
			}

			await mkdir(dirname(file), { recursive: true });
			await copyFile(sourcePath, file);
		}
	} finally {
		await rm(preservedFiles.backupRoot, { recursive: true, force: true });
	}
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
	if (futurePaths.length === 0) {
		return;
	}

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
	const addTrackedProc = Bun.spawn(["git", "add", "-u"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	await addTrackedProc.exited;

	if (addTrackedProc.exitCode !== 0) {
		const error = await new Response(addTrackedProc.stderr).text();
		throw new Error(`Failed to add tracked changes: ${error}`);
	}

	const declaredUntrackedFiles = (await getUntrackedFiles()).filter(
		isDeclaredTutorialPath,
	);
	if (declaredUntrackedFiles.length > 0) {
		const addUntrackedProc = Bun.spawn(
			["git", "add", "--", ...declaredUntrackedFiles],
			{
				stdout: "pipe",
				stderr: "pipe",
			},
		);
		await addUntrackedProc.exited;

		if (addUntrackedProc.exitCode !== 0) {
			const error = await new Response(addUntrackedProc.stderr).text();
			throw new Error(`Failed to add declared untracked paths: ${error}`);
		}
	}

	const checkProc = Bun.spawn(["git", "diff", "--cached", "--quiet"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	await checkProc.exited;

	// If exit code is 0, there are no staged changes, so return early.
	if (checkProc.exitCode === 0) {
		return;
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

async function getUntrackedFiles(): Promise<string[]> {
	const proc = Bun.spawn(
		["git", "ls-files", "--others", "--exclude-standard", "-z"],
		{
			stdout: "pipe",
			stderr: "pipe",
		},
	);

	const result = await new Response(proc.stdout).text();
	await proc.exited;

	if (proc.exitCode !== 0) {
		const error = await new Response(proc.stderr).text();
		throw new Error(`Failed to list untracked files: ${error}`);
	}

	return result.split("\0").filter(Boolean);
}

function isDeclaredTutorialPath(path: string): boolean {
	return tutorialConfig.stages.some((stage) =>
		stage.newPaths.some(
			(newPath) =>
				path === newPath || path.startsWith(withTrailingSlash(newPath)),
		),
	);
}

function withTrailingSlash(path: string): string {
	return path.endsWith("/") ? path : `${path}/`;
}
