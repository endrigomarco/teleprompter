import type { Pool } from 'pg';
export class PostgresHealthRepository {
  constructor(private readonly pool: Pool) {}
  async check(): Promise<void> {
    await this.pool.query('SELECT 1 FROM notes LIMIT 1');
  }
}
