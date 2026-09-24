import '../scripts/environment';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { PostgresNoteRepository } from '../src/server/repositories/postgres-note-repository';
import { NoteService } from '../src/server/services/note-service';
import { NoteController } from '../src/server/controllers/note-controller';
test('API e PostgreSQL: CRUD, conflitos, ordenação, rollback e conteúdo literal', async () => {
  const schema = 'test_' + randomUUID().replaceAll('-', '');
  const admin = new Pool({ connectionString: process.env.DATABASE_URL });
  await admin.query(`CREATE SCHEMA "${schema}"`);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    options: `-c search_path=${schema}`,
  });
  try {
    await pool.query(await readFile('migrations/001_notes.sql', 'utf8'));
    await pool.query(await readFile('migrations/002_projects.sql', 'utf8'));
    await pool.query(await readFile('migrations/003_note_history_mcp.sql', 'utf8'));
    const repo = new PostgresNoteRepository(pool, 'interview-copilot'),
      controller = new NoteController(new NoteService(repo));
    const draft = {
      title: 'Original',
      description: 'Descrição',
      tags: ['tag', 'tag'],
      content: '<script>alert(1)</script>\n\nTexto',
    };
    const req = (data: unknown, origin = 'http://localhost:8765') =>
      new Request('http://localhost:8765/api/notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin },
        body: JSON.stringify(data),
      });
    assert.equal((await controller.create(req({ ...draft, title: ' ' }))).status, 400);
    assert.equal((await controller.create(req(draft, 'https://unrelated.example'))).status, 403);
    assert.equal(
      (
        await controller.create(
          new Request('http://localhost/api/notes', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{',
          }),
        )
      ).status,
      400,
    );
    const response = await controller.create(req(draft));
    assert.equal(response.status, 201);
    const a = await response.json();
    assert.deepEqual(a.tags, ['tag']);
    assert.equal(a.content, draft.content);
    const [b, c] = await Promise.all([
      repo.create({ ...draft, title: 'B' }),
      repo.create({ ...draft, title: 'C' }),
    ]);
    assert.equal(new Set((await repo.list()).map((n) => n.position)).size, 3);
    assert.equal(
      (await controller.update(req({ ...draft, title: 'Editada', version: a.version }), a.id))
        .status,
      200,
    );
    assert.equal(
      (await controller.update(req({ ...draft, version: a.version }), a.id)).status,
      409,
    );
    assert.equal((await controller.delete(req({ version: a.version }), a.id)).status, 409);
    assert.equal((await controller.update(req({ ...draft, version: 1 }), 'missing')).status, 404);
    await repo.reorder([c.id, a.id, b.id]);
    assert.deepEqual(
      (await repo.list()).map((n) => n.id),
      [c.id, a.id, b.id],
    );
    assert.equal((await controller.reorder(req({ ids: [a.id, b.id] }))).status, 409);
    assert.equal((await controller.reorder(req({ ids: [a.id, a.id, b.id] }))).status, 400);
    assert.deepEqual(
      (await repo.list()).map((n) => n.id),
      [c.id, a.id, b.id],
    );
    const fresh = (await repo.list()).find((n) => n.id === a.id);
    assert.ok(fresh);
    assert.equal((await controller.delete(req({ version: fresh.version }), a.id)).status, 200);
    assert.deepEqual(
      (await repo.list()).map((n) => n.position),
      [0, 1],
    );
    assert.equal((await controller.delete(req({ version: fresh.version }), a.id)).status, 404);
    const huge = req({ ...draft, content: 'x'.repeat(600001) });
    assert.equal((await controller.create(huge)).status, 413);
  } finally {
    await pool.end();
    await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end();
  }
});
