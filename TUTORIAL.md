# Tutorial Management System

This repository includes a sophisticated tutorial management system that allows you to maintain a multi-stage Playwright tutorial with proper branching, content organization, and automatic syncing to the documentation repository.

## System Overview

The tutorial is organized into 5 stages, each with its own branch, content, and assets:

- **Stage 0**: SaaS Application Overview (baseline)
- **Stage 1**: Setting Up Playwright Project Structure
- **Stage 2**: Generating Tests with Playwright MCP Server
- **Stage 3**: Running Tests with Endform
- **Stage 4**: Debugging and Analytics with Endform Dashboard

## Directory Structure

```
tutorial/
├── stage-0-baseline/
│   ├── content.md              # Tutorial content
│   ├── assets/                 # Screenshots, images
│   └── metadata.json           # Stage configuration
├── stage-1-setup/
│   ├── content.md
│   ├── assets/
│   └── metadata.json
└── [other stages...]

scripts/                        # Bun TypeScript management scripts
├── tutorial-manager.ts         # Main orchestration
├── branch-manager.ts           # Git operations
├── content-sync.ts             # Documentation syncing
├── utils.ts                    # Helper functions
└── types.ts                    # TypeScript definitions
```

## Available Commands

### Core Tutorial Management

```bash
# Show current tutorial status
bun run tutorial:status

# List all available tutorial stages
bun run tutorial:list

# Switch to a specific tutorial stage
bun run tutorial:stage <stage-name>

# Initialize all tutorial branches (run once)
bun run tutorial:init
```

### Content Syncing

```bash
# Sync current stage to docs repository
bun run tutorial:sync

# Sync specific stage to docs repository
bun run tutorial:sync stage-1-setup

# Sync all stages to docs repository
bun run tutorial:sync all
```

### Change Propagation

```bash
# Propagate changes from current stage to all subsequent stages (recommended)
bun run tutorial:propagate

# Propagate changes between specific stages (advanced usage)
bun run tutorial:propagate stage-1-setup stage-2-generated-tests
```

## Workflow Examples

### Starting Work on a Stage

```bash
# Switch to the stage you want to work on
bun run tutorial:stage stage-1-setup

# Make your changes to:
# - Code in the repository
# - tutorial/stage-1-setup/content.md
# - Add assets to tutorial/stage-1-setup/assets/

# Sync to docs when ready
bun run tutorial:sync
```

### Propagating Changes Forward

When you make changes to a stage that should flow to later stages:

```bash
# Switch to the stage where you made changes
bun run tutorial:stage stage-1-setup

# Make your changes and commit them
git add .
git commit -m "Update Playwright configuration"

# Automatically propagate to ALL subsequent stages
bun run tutorial:propagate
```

The system will automatically:
- Identify all stages that come after your current stage
- Propagate changes to each one in sequence
- Handle merge conflicts gracefully
- Provide a summary of successful and failed propagations
- Return you to your original branch

### Updating Documentation

```bash
# Sync all stages to keep docs up to date
bun run tutorial:sync all

# Or sync just the current stage
bun run tutorial:sync
```

## Content Management

### Stage Content Structure

Each stage folder contains:

- `content.md`: The main tutorial content in Markdown format
- `assets/`: Screenshots, images, and other media files  
- `metadata.json`: Configuration for the stage

### Asset Management

- Add images and screenshots to each stage's `assets/` folder
- Reference them in content using relative paths: `![Description](./assets/image.png)`
- Assets are automatically synced to the docs repository with correct paths

### Metadata Configuration

Each `metadata.json` file defines:

```json
{
  "name": "stage-1-setup",
  "title": "Setting Up Playwright Project Structure", 
  "order": 1,
  "branch": "stage-1-setup",
  "prerequisites": ["SaaS app running", "Basic understanding of testing"],
  "learningObjectives": [
    "Install Playwright dependencies",
    "Create playwright.config.ts configuration"
  ],
  "docsPath": "tutorials/playwright-tutorial/01-setup.md",
  "assetsPrefix": "/tutorial-assets/stage-1/"
}
```

## Documentation Integration

The system automatically syncs content to the adjacent `docs` repository:

- Tutorial content → `docs/src/content/docs/tutorials/playwright-tutorial/`
- Assets → `docs/public/tutorial-assets/`
- Sidebar navigation is automatically updated in Astro Starlight

## Best Practices

### Working with Stages

1. **Always work on the appropriate branch** for the stage you're editing
2. **Commit changes frequently** to maintain history
3. **Sync to docs regularly** to keep documentation updated
4. **Propagate forward only** - don't make changes in later stages that should be in earlier ones

### Content Guidelines

1. **Use relative asset paths** in Markdown content
2. **Keep stage content focused** on specific learning objectives  
3. **Update prerequisites** when adding new requirements
4. **Test instructions** by following them in a clean environment

### Asset Management

1. **Optimize images** for web delivery before adding them
2. **Use descriptive filenames** for screenshots
3. **Keep assets organized** within each stage's folder
4. **Update assets** when UI or processes change

## Troubleshooting

### Branch Issues

If you have merge conflicts during propagation:

```bash
# Check current status
bun run tutorial:status

# Manually resolve conflicts and commit
git add .
git commit -m "Resolve merge conflicts"
```

### Sync Issues

If syncing fails:

1. Check that the docs repository exists at `../docs`
2. Verify stage content files exist
3. Check file permissions and paths

### Common Commands for Recovery

```bash
# Reset to a clean state on current branch
git reset --hard HEAD

# Switch back to main branch
git checkout main

# Recreate all tutorial branches
bun run tutorial:init
```

## System Configuration

The tutorial system is configured in:

- `tutorial.config.ts`: Main configuration file
- `scripts/types.ts`: TypeScript type definitions
- `package.json`: NPM script aliases

This system provides a robust foundation for maintaining complex, multi-stage tutorials while keeping content synchronized across repositories.