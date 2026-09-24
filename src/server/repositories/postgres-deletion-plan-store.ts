import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { DeletionPlan } from '@/domain/automation/models';
import type { DeletionPlanStore, StoredDeletionPlan } from '@/domain/automation/ports';

export class PostgresDeletionPlanStore implements DeletionPlanStore {
  constructor(
    private readonly client: PoolClient,
    private readonly projectId: string,
  ) {}
  async create(
    actor: string,
    items: DeletionPlan['items'],
    expiresInMinutes: number,
  ): Promise<DeletionPlan> {
    const confirmationToken = randomUUID();
    const result = await this.client.query<{ expires_at: Date }>(
      `INSERT INTO mcp_deletion_plans(token,actor,project_id,targets,expires_at)
       VALUES($1,$2,$3,$4,now()+$5*interval '1 minute') RETURNING expires_at`,
      [confirmationToken, actor, this.projectId, JSON.stringify(items), expiresInMinutes],
    );
    await this.client.query(
      "DELETE FROM mcp_deletion_plans WHERE expires_at < now() - interval '1 day'",
    );
    return {
      confirmationToken,
      projectId: this.projectId,
      expiresAt: result.rows[0].expires_at.toISOString(),
      count: items.length,
      items,
    };
  }
  async find(token: string, actor: string): Promise<StoredDeletionPlan | null> {
    return (
      (
        await this.client.query<StoredDeletionPlan>(
          `SELECT targets,expires_at <= now() AS expired,used_at IS NOT NULL AS used
       FROM mcp_deletion_plans WHERE token=$1 AND actor=$2 AND project_id=$3 FOR UPDATE`,
          [token, actor, this.projectId],
        )
      ).rows[0] ?? null
    );
  }
  async consume(token: string): Promise<void> {
    await this.client.query(
      'UPDATE mcp_deletion_plans SET used_at=now() WHERE token=$1 AND project_id=$2',
      [token, this.projectId],
    );
  }
}
