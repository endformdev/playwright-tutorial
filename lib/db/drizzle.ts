import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Check if DATABASE_URL is a Turso connection string (starts with libsql://) or a local file
const databaseUrl = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

let clientConfig;

if (databaseUrl && databaseUrl.startsWith('libsql://')) {
  // Turso connection
  clientConfig = {
    url: databaseUrl,
    authToken: authToken,
  };
} else {
  // Local SQLite file
  const dbPath = databaseUrl || path.join(process.cwd(), 'lib/db/database.db');
  clientConfig = {
    url: dbPath.startsWith('file:') ? dbPath : `file:${dbPath}`,
  };
}

export const client = createClient(clientConfig);
export const db = drizzle(client, { schema });
