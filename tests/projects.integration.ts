import '../scripts/environment';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { PostgresProjectRepository } from '../src/server/repositories/postgres-project-repository';
import { PostgresNoteRepository } from '../src/server/repositories/postgres-note-repository';
import { ProjectController } from '../src/server/controllers/project-controller';
import { ProjectService } from '../src/server/services/project-service';

test('Projetos: migração preserva notas, isolamento, seleção persistente, conflitos e exclusão', async () => {
  const schema = 'test_' + randomUUID().replaceAll('-', '');
  const admin = new Pool({ connectionString: process.env.DATABASE_URL });
  await admin.query(`CREATE SCHEMA "${schema}"`);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    options: `-c search_path=${schema}`,
  });
  try {
    await pool.query(await readFile('migrations/001_notes.sql', 'utf8'));
    await pool.query(
      "INSERT INTO notes(id,title,content,position) VALUES ('original','Título original','Texto\noriginal',0)",
    );
    const before = (await pool.query('SELECT * FROM notes')).rows[0];
    await pool.query(await readFile('migrations/002_projects.sql', 'utf8'));
    await pool.query(await readFile('migrations/003_note_history_mcp.sql', 'utf8'));
    const { project_id, ...after } = (await pool.query('SELECT * FROM notes')).rows[0];
    assert.equal(project_id, 'interview-copilot');
    assert.deepEqual(after, before);
    const repo = new PostgresProjectRepository(pool),
      controller = new ProjectController(new ProjectService(repo));
    const req = (data: unknown) =>
      new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    assert.equal((await controller.create(req({ title: ' ', description: '' }))).status, 400);
    const initial = await repo.state();
    assert.equal(initial.selectedProjectId, 'interview-copilot');
    assert.equal(initial.projects[0].noteCount, 1);
    const response = await controller.create(
      req({ title: 'Segundo', description: 'Outro assunto' }),
    );
    assert.equal(response.status, 201);
    const created = await response.json();
    const id = created.selectedProjectId as string;
    const project = created.projects.find((p: { id: string }) => p.id === id);
    assert.equal((await new PostgresProjectRepository(pool).state()).selectedProjectId, id);
    const firstNotes = new PostgresNoteRepository(pool, 'interview-copilot'),
      secondNotes = new PostgresNoteRepository(pool, id);
    assert.deepEqual(await secondNotes.list(), []);
    const draft = { title: 'Nova', description: '', tags: [], content: 'Texto novo' };
    const a = await secondNotes.create(draft),
      b = await secondNotes.create({ ...draft, title: 'Outra' });
    assert.equal(a.position, 0);
    await secondNotes.reorder([b.id, a.id]);
    assert.deepEqual(
      (await firstNotes.list()).map((n) => n.id),
      ['original'],
    );
    await assert.rejects(() => secondNotes.update('original', draft, 1), { code: 'not_found' });
    await assert.rejects(() => secondNotes.delete('original', 1), { code: 'not_found' });
    await assert.rejects(() => secondNotes.reorder(['original', a.id]), { code: 'conflict' });
    assert.deepEqual(
      (await secondNotes.list()).map((n) => n.id),
      [b.id, a.id],
    );
    await secondNotes.delete(b.id, b.version);
    assert.equal((await secondNotes.list())[0].position, 0);
    const updated = await repo.update(
      id,
      { title: 'Renomeado', description: 'Descrição alterada' },
      project.version,
    );
    const fresh = updated.projects.find((p) => p.id === id);
    assert.ok(fresh);
    assert.equal(fresh.title, 'Renomeado');
    assert.equal(fresh.noteCount, 1);
    await assert.rejects(() => repo.update(id, draft, project.version), { code: 'conflict' });
    await assert.rejects(() => repo.delete(id, project.version), { code: 'conflict' });
    await repo.select('interview-copilot');
    assert.equal((await repo.state()).selectedProjectId, 'interview-copilot');
    await assert.rejects(() => repo.select('missing'), { code: 'not_found' });
    await repo.select(id);
    const removed = await repo.delete(id, fresh.version);
    assert.equal(removed.selectedProjectId, 'interview-copilot');
    assert.equal((await pool.query('SELECT id FROM notes WHERE project_id=$1', [id])).rowCount, 0);
    assert.equal((await firstNotes.list())[0].content, 'Texto\noriginal');
    const empty = await repo.delete('interview-copilot', 1);
    assert.equal(empty.selectedProjectId, null);
    assert.deepEqual(empty.projects, []);
    await assert.rejects(() => secondNotes.create(draft), { code: 'not_found' });
    const recreated = await repo.create({ title: 'Recomeço', description: '' });
    assert.equal(recreated.projects.length, 1);
    assert.equal(recreated.selectedProjectId, recreated.projects[0].id);
  } finally {
    await pool.end();
    await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end();
  }
});
