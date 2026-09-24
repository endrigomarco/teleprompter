import '../scripts/environment';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AutomationOperationService } from '../src/server/services/automation-operation-service';
import { PostgresAutomationUnitOfWork } from '../src/server/repositories/postgres-automation-unit-of-work';
import { PostgresNoteHistoryReader } from '../src/server/repositories/postgres-note-history-reader';
import { PostgresNoteRepository } from '../src/server/repositories/postgres-note-repository';
import { PostgresProjectRepository } from '../src/server/repositories/postgres-project-repository';
import { AutomationService } from '../src/server/services/automation-service';
import { handleMcpRequest } from '../src/server/mcp/handler';
import type { AutomationActor } from '../src/domain/automation/models';

const projectId = 'interview-copilot';
const draft = {
  title: 'Synthetic',
  description: 'Descrição',
  content: 'Conteúdo\noriginal',
  tags: ['original'],
};
const command = () => ({ projectId, requestId: randomUUID() });
test('MCP e PostgreSQL: transações, retries, prévias, histórico, restauração e transporte SDK', async () => {
  const schema = 'test_' + randomUUID().replaceAll('-', '');
  const admin = new Pool({ connectionString: process.env.DATABASE_URL });
  await admin.query(`CREATE SCHEMA "${schema}"`);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    options: `-c search_path=${schema}`,
  });
  try {
    for (const name of ['001_notes.sql', '002_projects.sql'])
      await pool.query(await readFile('migrations/' + name, 'utf8'));
    const notes = new PostgresNoteRepository(pool, projectId);
    const baseline = await notes.create(draft);
    const before = (await pool.query('SELECT * FROM notes')).rows;
    await pool.query(await readFile('migrations/003_note_history_mcp.sql', 'utf8'));
    assert.deepEqual((await pool.query('SELECT * FROM notes')).rows, before);
    const repository = new AutomationOperationService(
      new PostgresAutomationUnitOfWork(pool),
      new PostgresNoteHistoryReader(pool),
    );
    const projects = new PostgresProjectRepository(pool);
    const actor: AutomationActor = { id: 'test-actor', writable: true, projectIds: [projectId] };
    const serviceFactory = (identity: AutomationActor) =>
      new AutomationService(
        repository,
        (id) => new PostgresNoteRepository(pool, id),
        projects,
        identity,
      );
    const service = serviceFactory(actor);
    assert.equal(
      (await service.history({ projectId, noteId: baseline.id }))[0].operation,
      'baseline',
    );
    const batch = { ...command(), items: [draft, { ...draft, title: 'B' }] };
    const [a, b] = await service.create(batch);
    assert.deepEqual(await service.create(batch), [a, b]);
    await assert.rejects(() => service.create({ ...batch, items: [draft] }), { code: 'conflict' });
    assert.equal((await notes.list()).length, 3);
    const invalid = {
      ...command(),
      items: [
        { noteId: a.id, expectedVersion: 1, changes: { title: 'Rolled back' } },
        { noteId: b.id, expectedVersion: 99, changes: { title: 'Failure' } },
      ],
    };
    await assert.rejects(() => service.update(invalid), { code: 'conflict' });
    assert.equal((await service.getNote({ projectId, noteId: a.id })).title, a.title);
    assert.equal((await service.history({ projectId, noteId: a.id })).length, 1);
    const [updated] = await service.update({
      ...command(),
      items: [{ noteId: a.id, expectedVersion: 1, changes: { description: 'Changed' } }],
    });
    assert.equal(updated.content, draft.content);
    assert.deepEqual(updated.tags, draft.tags);
    const revision = (await service.history({ projectId, noteId: a.id }))[1];
    const plan = await service.prepareDeletion({ projectId, noteIds: [a.id, b.id] });
    await notes.update(b.id, { ...b, title: 'Changed in UI' }, b.version);
    await assert.rejects(
      () => service.executeDeletion({ ...command(), confirmationToken: plan.confirmationToken }),
      { code: 'conflict' },
    );
    assert.equal((await notes.list()).length, 3);
    const expired = await service.prepareDeletion({ projectId, noteIds: [a.id] });
    await pool.query(
      "UPDATE mcp_deletion_plans SET expires_at=now()-interval '1 second' WHERE token=$1",
      [expired.confirmationToken],
    );
    await assert.rejects(
      () => service.executeDeletion({ ...command(), confirmationToken: expired.confirmationToken }),
      { code: 'conflict' },
    );
    const all = await service.prepareDeletion({ projectId, all: true });
    const later = await notes.create({ ...draft, title: 'Created after preview' });
    await assert.rejects(
      () =>
        repository.executeDeletion(
          { ...command(), confirmationToken: all.confirmationToken },
          'other-actor',
        ),
      { code: 'not_found' },
    );
    const execute = { ...command(), confirmationToken: all.confirmationToken };
    assert.equal((await service.executeDeletion(execute)).deleted, 3);
    assert.equal((await service.executeDeletion(execute)).deleted, 3);
    await assert.rejects(() => service.executeDeletion({ ...execute, requestId: randomUUID() }), {
      code: 'conflict',
    });
    assert.deepEqual(
      (await notes.list()).map((note) => note.id),
      [later.id],
    );
    assert.equal((await service.deleted({ projectId })).length, 3);
    const restored = await service.restore({
      ...command(),
      noteId: a.id,
      revisionId: revision.revisionId,
      expectedVersion: null,
    });
    assert.equal((await service.deleted({ projectId })).length, 2);
    assert.equal(restored.content, draft.content);
    assert.equal(restored.description, draft.description);
    assert.equal(restored.position, 1);
    assert.ok(restored.version > updated.version);
    await assert.rejects(
      () =>
        service.restore({
          ...command(),
          noteId: a.id,
          revisionId: revision.revisionId,
          expectedVersion: null,
        }),
      { code: 'conflict' },
    );
    await assert.rejects(() => service.getNote({ projectId: 'other', noteId: a.id }), {
      code: 'forbidden',
    });
    const readOnly = serviceFactory({ ...actor, writable: false });
    await assert.rejects(async () => readOnly.create(batch), { code: 'forbidden' });
    const other = await projects.create({ title: 'Other', description: '' });
    const otherProjectId = other.selectedProjectId;
    assert.ok(otherProjectId);
    await assert.rejects(
      () =>
        repository.update(
          {
            projectId: otherProjectId,
            requestId: randomUUID(),
            items: [
              {
                noteId: a.id,
                expectedVersion: restored.version,
                changes: { title: 'Cross project' },
              },
            ],
          },
          actor.id,
        ),
      { code: 'not_found' },
    );
    assert.deepEqual(
      (await service.listProjects()).map((project) => project.id),
      [projectId],
    );
    await service.reorder({ ...command(), ids: [restored.id, later.id] });
    await assert.rejects(() => service.reorder({ ...command(), ids: [restored.id] }), {
      code: 'conflict',
    });
    assert.equal((await service.listNotes({ projectId, query: 'conteudo' })).total, 2);
    const uiRevision = await repository.history({ projectId, noteId: b.id, limit: 20 });
    assert.ok(
      uiRevision.some(
        (item) => item.actor === 'local-ui-or-database' && item.operation === 'update',
      ),
    );
    await verifyProtocol(serviceFactory);
  } finally {
    await pool.end();
    await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end();
  }
});
async function verifyProtocol(serviceFactory: (actor: AutomationActor) => AutomationService) {
  process.env.MCP_SERVER_URL = 'http://localhost:8765/api/mcp';
  process.env.MCP_ACCESS_TOKEN = 'synthetic-write-token-01234567890123456789';
  process.env.MCP_READ_ONLY_TOKEN = 'synthetic-read-token-01234567890123456789';
  process.env.MCP_PROJECT_IDS = projectId;
  const endpoint = new URL(process.env.MCP_SERVER_URL);
  const handle = (request: Request) => handleMcpRequest(request, serviceFactory);
  assert.equal((await handle(new Request(endpoint))).status, 401);
  const transport = new StreamableHTTPClientTransport(endpoint, {
    requestInit: { headers: { Authorization: 'Bearer ' + process.env.MCP_ACCESS_TOKEN } },
    fetch: (input, init) => handle(new Request(input, init)),
  });
  const client = new Client({ name: 'integration-test', version: '1.0.0' });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.equal(tools.tools.length, 11);
    const response = await client.callTool({
      name: 'search_notes',
      arguments: { projectId, query: 'conteudo' },
    });
    assert.equal(response.isError, undefined);
    const result = await client.callTool({
      name: 'create_notes',
      arguments: { ...command(), items: [draft] },
    });
    assert.equal(result.isError, undefined);
    const invalid = await client.callTool({
      name: 'get_note',
      arguments: { projectId: 'unauthorized', noteId: 'x' },
    });
    assert.equal(invalid.isError, true);
  } finally {
    await client.close();
  }
  const readonlyClient = new Client({ name: 'read-only-test', version: '1.0.0' });
  try {
    await readonlyClient.connect(
      new StreamableHTTPClientTransport(endpoint, {
        requestInit: { headers: { Authorization: 'Bearer ' + process.env.MCP_READ_ONLY_TOKEN } },
        fetch: (input, init) => handle(new Request(input, init)),
      }),
    );
    assert.equal((await readonlyClient.listTools()).tools.length, 5);
    assert.equal(
      (
        await readonlyClient.callTool({
          name: 'create_notes',
          arguments: { ...command(), items: [draft] },
        })
      ).isError,
      true,
    );
  } finally {
    await readonlyClient.close();
  }
}
