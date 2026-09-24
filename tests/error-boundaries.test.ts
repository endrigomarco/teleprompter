import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppError, type AppErrorCode } from '../src/domain/shared/app-error';
import { HttpError } from '../src/server/http/http-error';
import { handleRequest } from '../src/server/http/response';
import { toolResult } from '../src/server/mcp/tool-result';

test('REST e MCP preservam os status ao traduzir erros de domínio e transporte', async () => {
  const cases: [AppErrorCode, number][] = [
    ['not_found', 404],
    ['conflict', 409],
    ['forbidden', 403],
  ];
  const errors: { error: Error; status: number }[] = cases.map(([code, status]) => ({
    error: new AppError(code, 'Falha esperada.'),
    status,
  }));
  errors.push({ error: new HttpError(413, 'Corpo excedido.'), status: 413 });
  for (const { error, status } of errors) {
    const fail = async () => {
      throw error;
    };
    const response = await handleRequest(fail);
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { error: error.message });
    const result = await toolResult(fail);
    assert.equal(result.isError, true);
    assert.deepEqual(JSON.parse(result.content[0].text), { error: error.message, status });
  }
});
