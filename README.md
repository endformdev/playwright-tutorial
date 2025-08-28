# Next.js SaaS Starter (SQLite Version)

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
- **Database**: [SQLite](https://www.sqlite.org/) with [libSQL client](https://github.com/tursodatabase/libsql-js) (supports both local files and [Turso](https://turso.tech/))
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: Dummy payment system (for demonstration only)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

```bash
git clone https://github.com/nextjs/saas-starter
cd saas-starter
pnpm install
```

## Running Locally

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Generate and run the database migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

Seed the database with a default user and team:

```bash
pnpm db:seed
```

This will create the following user and team:

- User: `test@test.com`
- Password: `admin123`

You can also create new users through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
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
2. `DATABASE_URL`: Set this to your SQLite database path for local files, or your Turso connection string (libsql://your-database.turso.io)
3. `DATABASE_AUTH_TOKEN`: Required if using Turso - your database auth token
3. `AUTH_SECRET`: Set this to a random string. `openssl rand -base64 32` will generate one.

## Other Templates

While this template is intentionally minimal and to be used as a learning resource, there are other paid versions in the community which are more full-featured:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev
