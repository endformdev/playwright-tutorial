#!/usr/bin/env bun

import { tutorialConfig } from '../tutorial.config';
import { getCurrentBranch, switchBranch, } from './utils';

export async function listStages(): Promise<void> {
  console.log('Available tutorial stages:');
  console.log('');
  
  tutorialConfig.stages.forEach(stage => {
    console.log(`${stage.order}. ${stage.name}`);
    console.log(`   Title: ${stage.title}`);
    console.log('');
  });
}


export async function propagateChanges(fromStage: string, toStage: string): Promise<void> {
  const fromStageConfig = tutorialConfig.stages.find(s => s.name === fromStage);
  const toStageConfig = tutorialConfig.stages.find(s => s.name === toStage);
  
  if (!fromStageConfig || !toStageConfig) {
    throw new Error('Stage not found');
  }
  
  if (fromStageConfig.order >= toStageConfig.order) {
    throw new Error('Can only propagate changes forward (from earlier to later stages)');
  }
  
  console.log(`Propagating changes from ${fromStage} to ${toStage}...`);
  
  // Switch to target branch
  await switchBranch(toStageConfig.branch);
  
  // Merge changes from source branch
  const proc = Bun.spawn(['git', 'merge', fromStageConfig.branch], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  
  await proc.exited;
  
  if (proc.exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    console.error(`❌ Merge failed. You may need to resolve conflicts manually:`);
    console.error(error);
    throw new Error(`Merge failed`);
  }
  
  console.log(`✅ Changes propagated from ${fromStage} to ${toStage}`);
}

export async function propagateFromCurrentToAllNext(): Promise<void> {
  const currentBranch = await getCurrentBranch();
  const currentStage = tutorialConfig.stages.find(s => s.branch === currentBranch);
  
  if (!currentStage) {
    throw new Error(`Not on a tutorial stage branch. Current branch: ${currentBranch}`);
  }
  
  // Find all stages that come after the current stage
  const nextStages = tutorialConfig.stages.filter(s => s.order > currentStage.order);
  
  if (nextStages.length === 0) {
    console.log(`✅ Already on the final stage (${currentStage.name}). Nothing to propagate.`);
    return;
  }
  
  console.log(`Propagating changes from ${currentStage.name} to ${nextStages.length} subsequent stage(s)...`);
  console.log('');
  
  let successCount = 0;
  let failedStages: string[] = [];
  
  // Sort stages by order to ensure proper propagation sequence
  const sortedNextStages = nextStages.sort((a, b) => a.order - b.order);
  
  for (const nextStage of sortedNextStages) {
    try {
      await propagateChanges(currentStage.name, nextStage.name);
      successCount++;
    } catch (error) {
      failedStages.push(nextStage.name);
      console.error(`❌ Failed to propagate to ${nextStage.name}:`, error);
      
      // Ask if user wants to continue or stop
      console.log('');
      console.log('Options:');
      console.log('1. Continue to next stage (conflicts may need manual resolution)');
      console.log('2. Stop propagation here');
      
      // For now, we'll continue - in a real CLI you might want to prompt
      console.log('Continuing to next stage...');
      console.log('');
    }
  }
  
  // Switch back to original branch
  await switchBranch(currentStage.branch);
  
  // Summary
  console.log('');
  console.log('=== Propagation Summary ===');
  console.log(`Source stage: ${currentStage.name}`);
  console.log(`Successfully propagated to: ${successCount}/${sortedNextStages.length} stages`);
  
  if (failedStages.length > 0) {
    console.log(`Failed stages: ${failedStages.join(', ')}`);
    console.log('');
    console.log('💡 To resolve conflicts:');
    console.log('1. Switch to the failed stage: bun run tutorial:stage <stage-name>');
    console.log('2. Manually resolve conflicts and commit');
    console.log('3. Run propagation again from your desired starting stage');
  } else {
    console.log('✅ All propagations completed successfully!');
  }
  
  console.log('');
}

// CLI usage
if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'list':
        await listStages();
        break;
      case 'switch':
        if (!args[1]) {
          console.error('Usage: bun run scripts/branch-manager.ts switch <stage-name>');
          process.exit(1);
        }
        await switchToStage(args[1]);
        break;
      case 'create-all':
        await createAllBranches();
        break;
      case 'propagate':
        if (args[1] && args[2]) {
          // Old style: propagate between specific stages
          await propagateChanges(args[1], args[2]);
        } else {
          // New style: propagate from current stage to all next stages
          await propagateFromCurrentToAllNext();
        }
        break;
      default:
        console.log('Usage: bun run scripts/branch-manager.ts <command>');
        console.log('Commands:');
        console.log('  list              - List all tutorial stages');
        console.log('  switch <stage>    - Switch to a tutorial stage branch');
        console.log('  create-all        - Create all tutorial stage branches');
        console.log('  propagate [from] [to] - Propagate from current stage to all next, or between specific stages');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}