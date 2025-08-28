#!/usr/bin/env bun

import { syncStageToocs, syncAllStagesToocs } from './content-sync';
import { listStages, propagateChanges, propagateFromCurrentToAllNext } from './branch-manager';
import { getCurrentBranch } from './utils';
import { tutorialConfig } from '../tutorial.config';
import { sync } from './sync';

async function getCurrentStage(): Promise<string | null> {
  const currentBranch = await getCurrentBranch();
  const stage = tutorialConfig.stages.find(s => s.name === currentBranch);
  return stage?.name || null;
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
      case 'sync':
        await sync();
        // const stageName = args[1];
        // if (stageName && stageName !== 'all') {
        //   await syncStageToocs(stageName);
        // } else if (stageName === 'all') {
        //   await syncAllStagesToocs();
        // } else {
        //   // Sync current stage if no argument provided
        //   const currentStage = await getCurrentStage();
        //   if (currentStage) {
        //     await syncStageToocs(currentStage);
        //   } else {
        //     console.error('Not on a tutorial stage branch. Please specify a stage name or use "all".');
        //     process.exit(1);
        //   }
        // }
        break;
        
       case 'propagate':
        if (args[1] && args[2]) {
          // Specific stage-to-stage propagation
          await propagateChanges(args[1], args[2]);
        } else {
          // Auto-propagate from current stage to all next stages
          await propagateFromCurrentToAllNext();
        }
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