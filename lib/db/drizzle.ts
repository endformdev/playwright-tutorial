import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'lib/db/database.db');
export const client = new Database(dbPath);
export const db = drizzle(client, { schema });
