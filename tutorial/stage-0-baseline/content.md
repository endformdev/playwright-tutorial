# SaaS Application Overview

Welcome to this comprehensive tutorial on setting up end-to-end testing with Playwright and Endform! In this tutorial series, you'll learn how to add robust automated testing to a modern SaaS application.

## What You'll Build

By the end of this tutorial, you'll have:

- A fully functional SaaS application with user authentication and subscription management
- A complete Playwright testing setup with generated tests
- Integration with Endform for running tests at scale
- GitHub Actions workflows for continuous testing
- Deep understanding of debugging and analytics with Endform's dashboard

## Prerequisites

Before starting this tutorial, make sure you have:

- **Node.js** (version 18 or later)
- **Bun** package manager
- **Git** for version control
- Basic knowledge of JavaScript/TypeScript
- Familiarity with React and Next.js concepts

## About the SaaS Application

The application you'll be working with is a modern SaaS starter built with:

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **SQLite** database with Drizzle ORM
- **Tailwind CSS** for styling
- **Authentication** with JWT tokens
- **Subscription management** with dummy payments

### Key Features

1. **Marketing Landing Page** (`/`) - Showcases the product with an animated terminal
2. **Authentication System** - Sign up (`/sign-up`) and login (`/login`) pages
3. **Dashboard** (`/dashboard`) - Protected area for authenticated users
4. **Subscription Management** (`/pricing`) - Dummy payment system for testing
5. **Team Management** - Multi-tenant architecture with roles

## Setting Up the Development Environment

Let's get the application running locally:

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd saas-starter-playwright
bun install
```

### 2. Set Up the Database

Create your environment file:

```bash
bun run db:setup
```

Generate and run database migrations:

```bash
bun run db:generate
bun run db:migrate
```

Seed the database with test data:

```bash
bun run db:seed
```

This creates a test user:
- **Email**: `test@test.com`
- **Password**: `admin123`

### 3. Start the Development Server

```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

![SaaS Application Homepage](./assets/homepage.png)

## Exploring the Application

Take some time to explore the different features:

### 1. Landing Page
The homepage showcases the product with an animated terminal component and clear call-to-action buttons.

### 2. Authentication Flow
- Try signing up with a new account
- Log in with the test account (`test@test.com` / `admin123`)
- Notice how the navigation changes for authenticated users

![Login Form](./assets/login-form.png)

### 3. Dashboard
Once logged in, explore the dashboard features:
- User management
- Team settings
- Activity logs
- Account settings

![Dashboard Overview](./assets/dashboard.png)

### 4. Subscription Flow
Test the dummy payment system:
- Go to `/pricing`
- Select a plan
- Use dummy card numbers (e.g., `12345678`)
- Complete the mock checkout process

![Pricing Page](./assets/pricing.png)

## Understanding the Codebase Structure

```
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Protected dashboard routes
│   ├── (marketing)/        # Public marketing pages
│   └── api/               # API routes
├── components/             # Reusable React components
│   └── ui/                # Base UI components
├── lib/                   # Utility libraries
│   ├── auth/              # Authentication logic
│   ├── db/                # Database schema and queries
│   └── payments/          # Payment processing
└── middleware.ts          # Route protection middleware
```

## What's Next?

Now that you have the SaaS application running locally, you're ready to start adding Playwright testing! In the next stage, you'll:

1. Install and configure Playwright
2. Set up the testing environment
3. Create your first test configuration
4. Understand the testing folder structure

The goal is to create comprehensive end-to-end tests that will catch bugs before they reach production and give you confidence when deploying new features.

Let's move on to **Stage 1: Setting Up Playwright Project Structure**!