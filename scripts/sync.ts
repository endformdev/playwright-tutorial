import { tutorialConfig } from "../tutorial.config";
import {
	getCurrentBranch,
	getCurrentCommitMessage,
	switchBranch,
} from "./utils";

export async function sync() {
	const currentBranch = await getCurrentBranch();
	const currentStage = tutorialConfig.stages.find(
		(s) => s.name === currentBranch,
	);
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
		await commitAllChanges(commitMessage);
	}

	for (const stage of nextStages) {
		await switchBranch(stage.name);
		await pullToThisStage(currentBranch);
		await commitAllChanges(commitMessage);
	}

	await switchBranch("main");
	await pullToThisStage(currentBranch);
	await commitAllChanges(commitMessage);

	await switchBranch(currentBranch);

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
