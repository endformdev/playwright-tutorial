import type { TutorialConfig } from './scripts/types';

export const tutorialConfig: TutorialConfig = {
  docsRepo: '../docs',
  docsBasePath: 'src/content/docs/tutorials/playwright-tutorial',
  stages: [
    {
      name: 'stage-0-baseline',
      title: 'SaaS Application Overview',
      branch: 'stage-0-baseline',
      order: 0,
      prerequisites: ['Node.js', 'Bun', 'Git'],
      learningObjectives: [
        'Understand the SaaS application structure',
        'Set up the development environment',
        'Run the application locally'
      ],
      docsPath: 'tutorials/playwright-tutorial/00-baseline.md',
      assetsPrefix: '/tutorial-assets/stage-0/'
    },
    {
      name: 'stage-1-setup',
      title: 'Setting Up Playwright Project Structure',
      branch: 'stage-1-setup',
      order: 1,
      prerequisites: ['SaaS app running', 'Basic understanding of testing'],
      learningObjectives: [
        'Install Playwright dependencies',
        'Create playwright.config.ts configuration',
        'Set up test folder structure',
        'Configure test environments'
      ],
      docsPath: 'tutorials/playwright-tutorial/01-setup.md',
      assetsPrefix: '/tutorial-assets/stage-1/'
    },
    {
      name: 'stage-2-generated-tests',
      title: 'Generating Tests with Playwright MCP Server',
      branch: 'stage-2-generated-tests',
      order: 2,
      prerequisites: ['Playwright project setup', 'MCP server knowledge'],
      learningObjectives: [
        'Understand test generation workflow',
        'Use Playwright MCP server to generate tests',
        'Create tests for login, signup, and dashboard flows',
        'Organize and structure generated tests'
      ],
      docsPath: 'tutorials/playwright-tutorial/02-generated-tests.md',
      assetsPrefix: '/tutorial-assets/stage-2/'
    },
    {
      name: 'stage-3-endform-integration',
      title: 'Running Tests with Endform',
      branch: 'stage-3-endform-integration',
      order: 3,
      prerequisites: ['Generated tests', 'Endform account'],
      learningObjectives: [
        'Configure Endform for the project',
        'Set up local test execution with Endform',
        'Create GitHub Actions workflow',
        'Monitor test execution and results'
      ],
      docsPath: 'tutorials/playwright-tutorial/03-endform-integration.md',
      assetsPrefix: '/tutorial-assets/stage-3/'
    },
    {
      name: 'stage-4-completed',
      title: 'Debugging and Analytics with Endform Dashboard',
      branch: 'stage-4-completed',
      order: 4,
      prerequisites: ['Tests running on Endform', 'GitHub Actions setup'],
      learningObjectives: [
        'Navigate the Endform dashboard',
        'Analyze test results and metrics',
        'Debug failing tests with tracing',
        'Set up alerts and notifications',
        'Optimize test performance'
      ],
      docsPath: 'tutorials/playwright-tutorial/04-completed.md',
      assetsPrefix: '/tutorial-assets/stage-4/'
    }
  ]
};