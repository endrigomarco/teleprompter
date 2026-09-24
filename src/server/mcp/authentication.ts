import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { AutomationActor } from '@/domain/automation/models';
import { HttpError } from '../http/http-error';

const tokenSchema = z.string().min(32).max(512);
const configuration = z
  .object({
    url: z.url(),
    writeToken: tokenSchema.optional(),
    readToken: tokenSchema.optional(),
    projectIds: z.union([z.literal('*'), z.array(z.string().min(1).max(200)).min(1)]),
  })
  .refine((value) => Boolean(value.writeToken || value.readToken))
  .refine((value) => !value.writeToken || value.writeToken !== value.readToken);
export type McpConfiguration = z.infer<typeof configuration>;
export function readMcpConfiguration(
  environment: Record<string, string | undefined>,
): McpConfiguration {
  const scope = environment.MCP_PROJECT_IDS;
  const parsed = configuration.safeParse({
    url: environment.MCP_SERVER_URL,
    writeToken: environment.MCP_ACCESS_TOKEN || undefined,
    readToken: environment.MCP_READ_ONLY_TOKEN || undefined,
    projectIds:
      scope === '*'
        ? '*'
        : scope
            ?.split(',')
            .map((id) => id.trim())
            .filter(Boolean),
  });
  if (!parsed.success) throw new HttpError(503, 'MCP não configurado.');
  const url = new URL(parsed.data.url);
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    (!isLocal && url.protocol !== 'https:') ||
    !['http:', 'https:'].includes(url.protocol) ||
    url.pathname !== '/api/mcp' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new HttpError(503, 'URL MCP inválida. Use HTTPS fora do localhost e o caminho /api/mcp.');
  return parsed.data;
}
const digest = (value: string) => createHash('sha256').update(value).digest();
export function authenticateMcp(request: Request, config: McpConfiguration): AutomationActor {
  const expected = new URL(config.url);
  if ((request.headers.get('host') ?? new URL(request.url).host) !== expected.host)
    throw new HttpError(403, 'Host não permitido.');
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== expected.origin)
    throw new HttpError(403, 'Origem não permitida.');
  const authorization = request.headers.get('authorization') ?? '';
  const supplied = /^Bearer ([^\s]+)$/i.exec(authorization)?.[1] ?? '';
  const suppliedHash = digest(supplied);
  const canWrite = Boolean(
    config.writeToken && timingSafeEqual(suppliedHash, digest(config.writeToken)),
  );
  const canRead = Boolean(
    config.readToken && timingSafeEqual(suppliedHash, digest(config.readToken)),
  );
  if (!canWrite && !canRead) throw new HttpError(401, 'Credencial MCP inválida ou ausente.');
  return {
    id: 'mcp:' + suppliedHash.toString('hex'),
    writable: canWrite,
    projectIds: config.projectIds,
  };
}
