import { Pool } from 'pg';
import { reportFailure } from '../logging/diagnostics';
const globalDatabase = globalThis as typeof globalThis & { teleprompterPool?: Pool };
export function getPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL no arquivo .env.');
  if (!globalDatabase.teleprompterPool) {
    globalDatabase.teleprompterPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
    globalDatabase.teleprompterPool.on('error', () => reportFailure('database_connection_failure'));
  }
  return globalDatabase.teleprompterPool;
}
