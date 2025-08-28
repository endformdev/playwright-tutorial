import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

function generateAuthSecret(): string {
  console.log('Step 1: Generating AUTH_SECRET...');
  return crypto.randomBytes(32).toString('hex');
}

async function setupDatabase(): Promise<string> {
  console.log('Step 2: Setting up SQLite database...');
  const dbPath = path.join(process.cwd(), 'local-sqlite-database.db');
  
  // Create the database directory if it doesn't exist
  const dbDir = path.dirname(dbPath);
  try {
    await fs.access(dbDir);
  } catch {
    await fs.mkdir(dbDir, { recursive: true });
  }

  console.log(`Database will be created at: ${dbPath}`);
  return dbPath;
}

async function writeEnvFile(envVars: Record<string, string>) {
  console.log('Step 3: Writing environment variables to .env');
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(path.join(process.cwd(), '.env'), envContent);
  console.log('.env file created with the necessary variables.');
}

async function main() {
  console.log('🚀 Setting up Next.js SaaS Starter (SQLite Version)...\n');

  const DATABASE_URL = await setupDatabase();
  const BASE_URL = 'http://localhost:3000';
  const AUTH_SECRET = generateAuthSecret();

  await writeEnvFile({
    DATABASE_URL,
    BASE_URL,
    AUTH_SECRET,
  });

  console.log('\n🎉 Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Run `pnpm db:generate` to generate database migrations');
  console.log('2. Run `pnpm db:migrate` to apply migrations');
  console.log('3. Run `pnpm db:seed` to add sample data');
  console.log('4. Run `pnpm dev` to start the development server');
}

main().catch(console.error);
