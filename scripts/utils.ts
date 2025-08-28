import { existsSync } from 'fs';
import { mkdir, cp } from 'fs/promises';
import { join, dirname } from 'path';
import type { StageMetadata } from './types';

export async function exists(path: string): Promise<boolean> {
  return existsSync(path);
}

export async function copyDirectory(src: string, dest: string): Promise<void> {
  if (!await exists(src)) {
    return;
  }

  await mkdir(dirname(dest), { recursive: true });
  await cp(src, dest, { recursive: true });
}

export async function loadStageMetadata(stageName: string): Promise<StageMetadata> {
  const metadataPath = join('tutorial', stageName, 'metadata.json');
  const file = Bun.file(metadataPath);
  
  if (!await file.exists()) {
    throw new Error(`Metadata file not found for stage: ${stageName}`);
  }
  
  return await file.json() as StageMetadata;
}

export async function loadStageContent(stageName: string): Promise<string> {
  const contentPath = join('tutorial', stageName, 'content.md');
  const file = Bun.file(contentPath);
  
  if (!await file.exists()) {
    throw new Error(`Content file not found for stage: ${stageName}`);
  }
  
  return await file.text();
}

export function processContent(content: string, metadata: StageMetadata): string {
  // Replace asset paths to use the correct prefix
  const processedContent = content.replace(
    /!\[([^\]]*)\]\(\.\/assets\/([^)]+)\)/g,
    `![$1](${metadata.assetsPrefix}$2)`
  );
  
  return processedContent;
}

export async function getCurrentBranch(): Promise<string> {
  const proc = Bun.spawn(['git', 'branch', '--show-current'], {
    stdout: 'pipe',
  });
  
  const result = await new Response(proc.stdout).text();
  return result.trim();
}

export async function switchBranch(branchName: string): Promise<void> {
  console.log(`Switching to branch: ${branchName}`);
  
  const proc = Bun.spawn(['git', 'checkout', branchName], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  
  await proc.exited;
  
  if (proc.exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    throw new Error(`Failed to switch branch: ${error}`);
  }
}

export async function createBranch(branchName: string): Promise<void> {
  console.log(`Creating branch: ${branchName}`);
  
  const proc = Bun.spawn(['git', 'checkout', '-b', branchName], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  
  await proc.exited;
  
  if (proc.exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    throw new Error(`Failed to create branch: ${error}`);
  }
}