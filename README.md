# SaaS Playwright testing tutorial

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fendformdev%2Fplaywright-tutorial&project-name=endform-playwright-example&repository-name=endform-playwright-example&demo-title=Next.JS%2FPlaywright%2FEndform&demo-description=A%20next.js%20web%20app%20tested%20with%20Playwright%20and%20Endform&demo-url=https%3A%2F%2Fendform-playwright-tutorial.vercel.app&integration-ids=oac_5LFIKN8LRMK2uwnltOSeyCFE)

## About the tutorial

This tutorial is geared towards learning how to create a realistic playwright setup for testing fully fledged software as a service applications, generating tests for realistic applications, and then running those tests with Endform. 

## Getting started with the tutorial repository

To get started, you will need to:

- [Clone the repository](https://github.com/endformdev/playwright-tutorial): `git clone https://github.com/endformdev/playwright-tutorial && cd playwright-tutorial`
- Make sure you have [`pnpm` installed on your system](https://pnpm.io/installation#using-corepack)
- Install the dependencies: `pnpm install`
- Checkout the branch for the stage you want to start from, for example: `git checkout stage-0-baseline`

We will be testing against a realistic dummy application.
You can either:

- Run the tests against our pre-deployed application at [https://endform-playwright-tutorial.vercel.app](https://endform-playwright-tutorial.vercel.app)
- Run the application locally, for this option you will need to:
  - Install dependencies: `pnpm install`
  - Run the application right away: `pnpm dev`
  - Optionally switch to local SQLite instead of the shared demo Durable Object: `pnpm db:setup`
  - Optionally seed your local database: `pnpm db:seed`
  - Check that it loads correctly at [http://localhost:3000](http://localhost:3000)

## Coming from "Deploy with Vercel"?

- Don't forget to connect your project with the Endform vercel integration
- You will need the `copy-me-github-workflows` copied to `.github/workflows` to get going with running your tests in github actions


## About the SaaS

The SaaS is based on the [Next.JS SaaS Starter Tempate](https://github.com/nextjs/saas-starter).

This is a starter template for building a SaaS application using **Next.js** with support for authentication, dummy payment processing, and a dashboard for logged-in users. This version has been modified to be easier to deploy and test by using SQLite instead of Postgres and a dummy payment system instead of Stripe.

## Features

- Marketing landing page (`/`) with animated Terminal element
- Pricing page (`/pricing`) with dummy payment processing
- Dashboard pages with CRUD operations on users/teams
- Basic RBAC with Owner and Member roles
- Dummy subscription management (no real payments)
- Email/password authentication with JWTs stored to cookies
- Global middleware to protect logged-in routes
- Local middleware to protect Server Actions or validate Zod schemas
- Activity logging system for any user events
- SQLite database for easy local development and deployment

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [SQLite](https://www.sqlite.org/) via a shared Cloudflare Durable Object proxy by default, with optional local file SQLite and [Turso](https://turso.tech/) support
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: Dummy payment system (for demonstration only)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

```bash
git clone https://github.com/endformdev/playwright-tutorial
cd playwright-tutorial
pnpm install
```

## Running Locally

By default, the app works without any database or auth environment variables. If you do nothing, it connects to the shared demo SQLite database through an HTTP proxy backed by a Cloudflare Durable Object. That shared demo database is public and wiped on a schedule, so it is meant for quick starts and testing only.

Start the app immediately:

```bash
pnpm dev
```

If you want your own local SQLite file instead, use the included setup script to create `.env` and run the database migrations:

```bash
pnpm db:setup
```

You can optionally seed that local database too:

```bash
pnpm db:seed
```

Then, run the Next.js development server:

```bash
pnpm dev
```

Or for better performance:

```bash
pnpm build && pnpm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

## Testing Payments

This version uses a dummy payment system for demonstration purposes:

- **Card Numbers**: Only 8-digit numbers are accepted (e.g., `12345678`)
- **Expiration**: Any future date in MM/YY format (e.g., `12/25`)
- **CVV**: Any 3-digit number (e.g., `123`)
- **Billing Address**: Any valid address information

The dummy payment system will store payment information in the database but won't process any real payments. This prevents accidental real credit card usage during development and testing.

## Going to Production

When you're ready to deploy your SaaS application to production, follow these steps:

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Follow the Vercel deployment process, which will guide you through setting up your project.

### Add environment variables

In your Vercel project settings (or during deployment), add the necessary environment variables:

1. `BASE_URL`: Set this to your production domain.
2. `DATABASE_URL`: Leave unset to use the shared Durable Object proxy, set it to a local SQLite path, set it to your own proxy URL, or use a Turso connection string (`libsql://your-database.turso.io`)
3. `DATABASE_AUTH_TOKEN`: Required if using Turso
4. `AUTH_SECRET`: Optional in demo mode, but set this to a random string for any non-demo deployment. `openssl rand -base64 32` will generate one.
