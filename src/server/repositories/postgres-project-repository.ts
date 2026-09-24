import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import type {
  Project,
  ProjectDraft,
  ProjectState,
  ProjectRepository,
} from '@/domain/projects/project';
import { AppError } from '@/domain/shared/app-error';
import { transaction } from '../database/transaction';
export class PostgresProjectRepository implements ProjectRepository {
  constructor(private readonly pool: Pool) {}
  async state(): Promise<ProjectState> {
    return transaction(this.pool, (client) => this.snapshot(client));
  }
  private async snapshot(client: PoolClient): Promise<ProjectState> {
    const projects = (
      await client.query<Project>(
        `SELECT p.id,p.title,p.description,p.version,count(n.id)::integer AS "noteCount" FROM projects p LEFT JOIN notes n ON n.project_id=p.id GROUP BY p.id ORDER BY p.created_at,p.id`,
      )
    ).rows;
    const settings = await client.query<{ selected_project_id: string | null }>(
      'SELECT selected_project_id FROM app_settings WHERE singleton=true',
    );
    const selection = settings.rows[0];
    if (!selection) throw new Error('Configuração de projetos ausente.');
    return { projects, selectedProjectId: selection.selected_project_id };
  }
  private async assertProject(client: PoolClient, id: string, version?: number) {
    const result = await client.query<{ version: number }>(
      'SELECT version FROM projects WHERE id=$1 FOR UPDATE',
      [id],
    );
    if (!result.rowCount)
      throw new AppError('not_found', 'Projeto não encontrado. Reabra a lista de projetos.');
    if (version !== undefined && version !== result.rows[0].version)
      throw new AppError(
        'conflict',
        'O projeto mudou em outra janela. Reabra a lista de projetos.',
      );
  }
  async create(draft: ProjectDraft): Promise<ProjectState> {
    return transaction(this.pool, async (client) => {
      const id = randomUUID();
      await client.query('INSERT INTO projects(id,title,description) VALUES ($1,$2,$3)', [
        id,
        draft.title,
        draft.description,
      ]);
      await client.query('UPDATE app_settings SET selected_project_id=$1', [id]);
      return this.snapshot(client);
    });
  }
  async update(id: string, draft: ProjectDraft, version: number): Promise<ProjectState> {
    return transaction(this.pool, async (client) => {
      await this.assertProject(client, id, version);
      await client.query(
        'UPDATE projects SET title=$2,description=$3,version=version+1 WHERE id=$1',
        [id, draft.title, draft.description],
      );
      return this.snapshot(client);
    });
  }
  async delete(id: string, version: number): Promise<ProjectState> {
    return transaction(this.pool, async (client) => {
      await this.assertProject(client, id, version);
      await client.query('DELETE FROM projects WHERE id=$1', [id]);
      await client.query(
        'UPDATE app_settings SET selected_project_id=(SELECT id FROM projects ORDER BY created_at,id LIMIT 1) WHERE selected_project_id IS NULL',
      );
      return this.snapshot(client);
    });
  }
  async select(id: string): Promise<ProjectState> {
    return transaction(this.pool, async (client) => {
      await this.assertProject(client, id);
      await client.query('UPDATE app_settings SET selected_project_id=$1', [id]);
      return this.snapshot(client);
    });
  }
}
