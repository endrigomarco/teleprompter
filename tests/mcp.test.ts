import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { authenticateMcp, readMcpConfiguration } from '../src/server/mcp/authentication';
import { createInput, updateInput, prepareDeleteInput } from '../src/domain/automation/validation';
import { toolResult } from '../src/server/mcp/tool-result';
import { AppError } from '../src/domain/shared/app-error';

const token = 'synthetic-write-token-01234567890123456789';
const readToken = 'synthetic-read-token-01234567890123456789';
const environment = {
  MCP_SERVER_URL: 'http://localhost:8765/api/mcp',
  MCP_ACCESS_TOKEN: token,
  MCP_READ_ONLY_TOKEN: readToken,
  MCP_PROJECT_IDS: 'project-a,project-b',
};
const config = readMcpConfiguration(environment);
const request = (authorization: string, headers: Record<string, string> = {}) =>
  new Request(environment.MCP_SERVER_URL, { headers: { authorization, ...headers } });
test('MCP: autenticação, leitura, escopo, origem e configuração fechada', () => {
  assert.throws(() => readMcpConfiguration({}), { status: 503 });
  assert.throws(
    () => readMcpConfiguration({ ...environment, MCP_SERVER_URL: 'http://public.example/api/mcp' }),
    { status: 503 },
  );
  assert.throws(() => readMcpConfiguration({ ...environment, MCP_PROJECT_IDS: '' }), {
    status: 503,
  });
  assert.throws(() => readMcpConfiguration({ ...environment, MCP_READ_ONLY_TOKEN: token }), {
    status: 503,
  });
  assert.throws(() => authenticateMcp(request(''), config), { status: 401 });
  assert.throws(() => authenticateMcp(request('Bearer bad'), config), { status: 401 });
  assert.throws(
    () => authenticateMcp(request('Bearer ' + token, { host: 'malicious.example' }), config),
    { status: 403 },
  );
  assert.throws(() => authenticateMcp(request('Bearer ' + token, { origin: 'null' }), config), {
    status: 403,
  });
  const actor = authenticateMcp(request('Bearer ' + token), config);
  assert.equal(actor.writable, true);
  assert.deepEqual(actor.projectIds, ['project-a', 'project-b']);
  assert.equal(authenticateMcp(request('Bearer ' + readToken), config).writable, false);
  assert.ok(!actor.id.includes(token));
});
test('MCP: lotes limitados, patches estritos e exclusão com alvo explícito', () => {
  const base = { projectId: 'a', requestId: randomUUID() };
  assert.throws(() => createInput.parse({ ...base, items: [] }));
  const item = { noteId: 'note', expectedVersion: 1, changes: { title: 'Novo' } };
  assert.deepEqual(updateInput.parse({ ...base, items: [item] }).items[0].changes, {
    title: 'Novo',
  });
  assert.throws(() => updateInput.parse({ ...base, items: [item, item] }));
  assert.throws(() => updateInput.parse({ ...base, items: [{ ...item, changes: {} }] }));
  assert.throws(() =>
    updateInput.parse({ ...base, items: [{ ...item, changes: { projectId: 'b' } }] }),
  );
  assert.throws(() =>
    updateInput.parse({ ...base, items: [{ ...item, expectedVersion: undefined }] }),
  );
  assert.throws(() => prepareDeleteInput.parse({ projectId: 'a' }));
  assert.throws(() => prepareDeleteInput.parse({ projectId: 'a', all: true, noteIds: ['x'] }));
});
test('MCP: erros esperados são estruturados sem detalhes internos', async () => {
  const response = await toolResult(async () => {
    throw new AppError('conflict', 'Versão mudou.');
  });
  assert.equal(response.isError, true);
  assert.deepEqual(JSON.parse(response.content[0].text), { status: 409, error: 'Versão mudou.' });
});
