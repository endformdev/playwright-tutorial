import type { Config } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL || 'file:./lib/db/database.db';
const authToken = process.env.DATABASE_AUTH_TOKEN;

// For Turso connections, we need to include the auth token
const dbCredentials = databaseUrl.startsWith('libsql://') && authToken
  ? { url: databaseUrl, authToken }
  : { url: databaseUrl };

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'sqlite',
  dbCredentials,
} satisfies Config;
