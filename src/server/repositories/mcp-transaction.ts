import { createHash } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { AppError } from '@/domain/shared/app-error';
import { transaction } from '../database/transaction';

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value !== null && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => JSON.stringify(key) + ':' + canonicalJson(item))
        .join(',') +
      '}'
    );
  return JSON.stringify(value) ?? 'null';
}
export async function mcpTransaction<T>(
  pool: Pool,
  actor: string,
  command: { name: string; input: { requestId: string } },
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const fingerprint = createHash('sha256').update(canonicalJson(command)).digest('hex');
  return transaction(pool, async (client) => {
    await client.query("SELECT set_config('app.actor',$1,true)", [actor]);
    const previous = (
      await client.query<{ fingerprint: string; result: T }>(
        'SELECT fingerprint,result FROM mcp_requests WHERE actor=$1 AND request_id=$2',
        [actor, command.input.requestId],
      )
    ).rows[0];
    if (previous) {
      if (previous.fingerprint !== fingerprint)
        throw new AppError('conflict', 'requestId já utilizado com outra operação ou conteúdo.');
      return previous.result;
    }
    const result = await operation(client);
    await client.query(
      'INSERT INTO mcp_requests(actor,request_id,fingerprint,result) VALUES($1,$2,$3,$4)',
      [actor, command.input.requestId, fingerprint, JSON.stringify(result)],
    );
    return result;
  });
}
