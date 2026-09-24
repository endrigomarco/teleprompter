import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestJson } from '../src/client/api/json-request';
import {
  notesResponseSchema,
  projectStateResponseSchema,
} from '../src/client/api/response-schemas';
import { readJson } from '../src/server/http/read-json';
import { handleRequest } from '../src/server/http/response';
import { reportFailure } from '../src/server/logging/diagnostics';
import { parseImportData } from '../src/domain/backup/backup';

test('cliente HTTP rejeita JSON inválido e contratos incompatíveis sem converter por cast', async (context) => {
  const response = context.mock.method(
    globalThis,
    'fetch',
    async () => new Response(JSON.stringify({ projects: [] }), { status: 200 }),
  );
  await assert.rejects(
    () => requestJson('/api/projects', projectStateResponseSchema),
    /dados inválidos/,
  );
  response.mock.mockImplementation(async () => new Response('<html>Erro</html>', { status: 503 }));
  await assert.rejects(() => requestJson('/api/notes', notesResponseSchema), /resposta inválida/);
  response.mock.mockImplementation(async () =>
    Response.json({ error: 'A lista mudou.' }, { status: 409 }),
  );
  await assert.rejects(() => requestJson('/api/notes', notesResponseSchema), /A lista mudou/);
  response.mock.mockImplementation(async () => Response.json([]));
  assert.deepEqual(await requestJson('/api/notes', notesResponseSchema), []);
  response.mock.mockImplementation(async () =>
    Response.json({ projects: [], selectedProjectId: 'ausente' }),
  );
  await assert.rejects(
    () => requestJson('/api/projects', projectStateResponseSchema),
    /dados inválidos/,
  );
});

test('fronteira HTTP recusa origem malformada e media type incorreto', async () => {
  const request = (origin: string, contentType = 'application/json') =>
    new Request('http://localhost/api/notes', {
      method: 'POST',
      headers: { origin, 'content-type': contentType },
      body: '{}',
    });
  await assert.rejects(() => readJson(request('null')), { status: 403 });
  await assert.rejects(() => readJson(request('http://localhost', 'application/json-invalid')), {
    status: 415,
  });
  assert.deepEqual(
    await readJson(request('http://localhost', 'application/json; charset=utf-8')),
    {},
  );
});

test('falhas internas não expõem mensagens sensíveis em resposta ou logs', async (context) => {
  const logs: string[] = [];
  context.mock.method(console, 'error', (entry: string) => logs.push(entry));
  const secret = 'segredo-sintetico-na-mensagem';
  const response = await handleRequest(async () => {
    throw new Error(secret);
  });
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes(secret));
  reportFailure('database_connection_failure');
  assert.equal(logs.length, 2);
  for (const entry of logs) {
    const parsed: unknown = JSON.parse(entry);
    assert.deepEqual(Object.keys(parsed as object).sort(), ['event', 'level', 'timestamp']);
    assert.ok(!entry.includes(secret));
  }
});

test('importação preserva texto literal e rejeita IDs legados duplicados', () => {
  const note = {
    id: 'teste',
    titulo: ' Título ',
    descricao: ' descrição ',
    conteudo: '  Texto\n\n original  ',
    tags: [' tag ', ' tag '],
  };
  assert.deepEqual(parseImportData([note]), { kind: 'legacy', notes: [note] });
  assert.throws(() => parseImportData([note, note]), /IDs duplicados/);
});
