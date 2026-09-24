import type { Pool, PoolClient } from 'pg';
import type {
  AutomationUnitOfWork,
  AutomationSession,
  AutomationCommand,
} from '@/domain/automation/ports';
import { transaction } from '../database/transaction';
import { mcpTransaction } from './mcp-transaction';
import { PostgresNoteSession } from './postgres-note-session';
import { PostgresNoteHistorySession } from './postgres-note-history-session';
import { PostgresDeletionPlanStore } from './postgres-deletion-plan-store';

export class PostgresAutomationUnitOfWork implements AutomationUnitOfWork {
  constructor(private readonly pool: Pool) {}
  private session(client: PoolClient, projectId: string): AutomationSession {
    return {
      notes: new PostgresNoteSession(client, projectId),
      history: new PostgresNoteHistorySession(client, projectId),
      deletionPlans: new PostgresDeletionPlanStore(client, projectId),
    };
  }
  withinProject<T>(
    projectId: string,
    operation: (session: AutomationSession) => Promise<T>,
  ): Promise<T> {
    return transaction(this.pool, (client) => operation(this.session(client, projectId)));
  }
  execute<T>(
    actor: string,
    command: AutomationCommand,
    operation: (session: AutomationSession) => Promise<T>,
  ): Promise<T> {
    return mcpTransaction(this.pool, actor, command, (client) =>
      operation(this.session(client, command.input.projectId)),
    );
  }
}
