# Setting Up Playwright Project Structure

In this stage, you'll install Playwright and set up the complete testing infrastructure for your SaaS application. By the end of this section, you'll have a fully configured Playwright project ready for test generation.

## Learning Objectives

- Install Playwright and its dependencies
- Configure `playwright.config.ts` for your SaaS application
- Set up proper test folder structure
- Configure test environments and base URLs
- Understand Playwright's browser and device configurations

## Installing Playwright

Let's start by adding Playwright to your project:

### 1. Install Playwright

```bash
bun add -D @playwright/test
```

### 2. Install Playwright Browsers

```bash
bunx playwright install
```

This command downloads the browser binaries (Chromium, Firefox, WebKit) that Playwright will use for testing.

![Playwright Installation Output](./assets/install-output.png)

## Creating the Playwright Configuration

Create a `playwright.config.ts` file in your project root:

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like \`await page.goto('/')\`. */
    baseURL: 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot only when test fails */
    screenshot: 'only-on-failure',
    
    /* Record video only when test fails */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

![Playwright Configuration](./assets/playwright-config.png)

## Setting Up the Test Folder Structure

Create the following directory structure for your tests:

```bash
mkdir -p tests/{auth,dashboard,marketing,payments,utils}
```

This creates a well-organized test structure:

```
tests/
├── auth/              # Authentication-related tests
├── dashboard/         # Dashboard and protected route tests
├── marketing/         # Public page tests
├── payments/          # Subscription and payment tests
└── utils/            # Test utilities and helpers
```

![Test Folder Structure](./assets/test-structure.png)

## Creating Test Utilities

Let's create some utility functions that will be helpful across all tests:

### 1. Authentication Helper

Create `tests/utils/auth.ts`:

```typescript
import { Page, expect } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  async login(email: string = 'test@test.com', password: string = 'admin123') {
    await this.page.goto('/login');
    
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(this.page).toHaveURL('/dashboard');
  }

  async logout() {
    // Click user menu dropdown
    await this.page.click('[data-testid="user-menu"]');
    
    // Click logout
    await this.page.click('text="Sign Out"');
    
    // Verify redirect to home
    await expect(this.page).toHaveURL('/');
  }

  async signUp(email: string, password: string, confirmPassword: string) {
    await this.page.goto('/sign-up');
    
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.fill('input[name="confirmPassword"]', confirmPassword);
    
    await this.page.click('button[type="submit"]');
  }
}
```

### 2. Database Helper

Create `tests/utils/database.ts`:

```typescript
import { Page } from '@playwright/test';

export class DatabaseHelper {
  constructor(private page: Page) {}

  /**
   * Reset database to clean state for testing
   */
  async resetDatabase() {
    // This would connect to your test database and reset it
    // For now, we'll use the API route if available
    const response = await this.page.request.post('/api/test/reset-db');
    return response.ok();
  }

  /**
   * Seed database with test data
   */
  async seedDatabase() {
    const response = await this.page.request.post('/api/test/seed-db');
    return response.ok();
  }
}
```

### 3. Navigation Helper

Create `tests/utils/navigation.ts`:

```typescript
import { Page, expect } from '@playwright/test';

export class NavigationHelper {
  constructor(private page: Page) {}

  async navigateTo(path: string) {
    await this.page.goto(path);
  }

  async expectToBeOn(path: string) {
    await expect(this.page).toHaveURL(path);
  }

  async clickNavItem(text: string) {
    await this.page.click(\`nav a:has-text("\${text}")\`);
  }
}
```

## Creating Your First Test

Let's create a simple smoke test to verify everything is working:

Create `tests/smoke.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/SaaS Starter/);
    
    // Check for key elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text="Get Started"')).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to login
    await page.click('text="Sign In"');
    await expect(page).toHaveURL('/login');
    
    // Test navigation to pricing
    await page.goto('/');
    await page.click('text="Pricing"');
    await expect(page).toHaveURL('/pricing');
  });
});
```

## Running Your First Test

Now let's run the test to make sure everything is configured correctly:

```bash
bunx playwright test
```

You should see output similar to:

```
Running 2 tests using 1 worker
  ✓ [chromium] › smoke.spec.ts:4:3 › Smoke Tests › homepage loads correctly (1.2s)
  ✓ [chromium] › smoke.spec.ts:13:3 › Smoke Tests › navigation works (0.8s)

  2 passed (2.1s)
```

![Test Results](./assets/test-results.png)

## Viewing Test Reports

Playwright generates beautiful HTML reports. View your test results:

```bash
bunx playwright show-report
```

This opens an interactive report in your browser showing:
- Test results and timing
- Screenshots of failures
- Trace files for debugging
- Network activity logs

![HTML Report](./assets/html-report.png)

## Configuration Deep Dive

Let's understand the key parts of your Playwright configuration:

### Base URL Configuration
```typescript
use: {
  baseURL: 'http://localhost:3000',
}
```
This allows you to use relative URLs in your tests: `page.goto('/')` instead of `page.goto('http://localhost:3000/')`

### Web Server Integration
```typescript
webServer: {
  command: 'bun run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
}
```
Playwright automatically starts your development server before running tests and stops it afterward.

### Browser Projects
The configuration includes multiple browser projects (Chrome, Firefox, Safari, mobile devices) so your tests run across different environments automatically.

### Debugging Features
- **Traces**: Detailed execution logs for debugging
- **Screenshots**: Captured on test failures
- **Videos**: Recorded for failed tests

## Adding Package.json Scripts

Add these convenience scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:report": "playwright show-report"
  }
}
```

## What's Next?

Congratulations! You now have a fully configured Playwright testing environment. Your setup includes:

✅ Playwright installed with browser support  
✅ Comprehensive configuration for multiple browsers and devices  
✅ Well-organized test folder structure  
✅ Utility helpers for common testing tasks  
✅ Your first passing tests  
✅ HTML reporting and debugging tools  

In the next stage, you'll learn how to generate comprehensive tests using the Playwright MCP server, covering:
- User authentication flows
- Dashboard interactions
- Payment processing
- Form validations
- Error handling scenarios

Let's move on to **Stage 2: Generating Tests with Playwright MCP Server**!