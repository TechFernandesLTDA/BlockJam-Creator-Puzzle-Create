import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import { logger } from '../utils/logger.js';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://localhost:5432/blockjam';

const queryClient = postgres(DATABASE_URL, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {},
});

export const db = drizzle(queryClient, { schema });

export async function closeDb(): Promise<void> {
  try {
    await queryClient.end();
    logger.info('Database connection closed');
  } catch (err) {
    logger.error({ err }, 'Error closing database connection');
  }
}

export default db;
