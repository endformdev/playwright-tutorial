#!/usr/bin/env bun

import { getCurrentBranch, pushBranch, switchBranch } from './utils';
import { tutorialConfig } from '../tutorial.config';
import { sync } from './sync';

// CLI usage
if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'list':
        await listStages();
        break;
      case 'sync':
        await sync();
        break;
        
       case 'push':
        await push();
        break;
        
      default:
        console.log('Tutorial Manager');
        console.log('');
        console.log('Usage: bun run tutorial:<command>');
        console.log('');
        console.log('Commands:');
        console.log('  status                    - Show current tutorial status');
        console.log('  list                      - List all tutorial stages');
        console.log('  stage <name>              - Switch to a tutorial stage');
        console.log('  sync [stage|all]          - Sync stage content to docs repo');
        console.log('  propagate [from] [to]     - Propagate from current to all next, or between specific stages');
        console.log('  init                      - Initialize all tutorial branches');
        console.log('');
        console.log('Examples:');
        console.log('  bun run tutorial:stage stage-1-setup');
        console.log('  bun run tutorial:sync');
        console.log('  bun run tutorial:sync all');
        console.log('  bun run tutorial:propagate               # From current to all next');
        console.log('  bun run tutorial:propagate stage-1-setup stage-2-generated-tests  # Specific stages');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function listStages(): Promise<void> {
  console.log('Available tutorial stages:');
  console.log('');
  
  tutorialConfig.stages.forEach(stage => {
    console.log(`${stage.order}. ${stage.name}`);
    console.log(`   Title: ${stage.title}`);
    console.log('');
  });
}

async function push(): Promise<void> {
  const currentBranch = await getCurrentBranch();

  for (const stage of tutorialConfig.stages) {
    await switchBranch(stage.name);
    await pushBranch();
  }

  await switchBranch('main');
  await pushBranch();
  
  await switchBranch(currentBranch);
}

