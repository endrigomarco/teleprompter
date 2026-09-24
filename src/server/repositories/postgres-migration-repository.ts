import type { Pool } from 'pg';
import { transaction } from '../database/transaction';
export interface MigrationSource {
  name: string;
  read(): Promise<string>;
}
export class PostgresMigrationRepository {
  constructor(private readonly pool: Pool) {}
  async apply(sources: MigrationSource[]): Promise<string[]> {
    return transaction(this.pool, async (client) => {
      await client.query(
        'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
      );
      const applied: string[] = [];
      for (const source of sources) {
        if (
          (await client.query('SELECT name FROM schema_migrations WHERE name=$1', [source.name]))
            .rowCount
        )
          continue;
        await client.query(await source.read());
        await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [source.name]);
        applied.push(source.name);
      }
      return applied;
    });
  }
}
