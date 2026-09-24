import type { AutomationOperations } from '@/domain/automation/ports';
import type { AutomationActor } from '@/domain/automation/models';
import { z } from 'zod';
import * as contracts from '@/domain/automation/validation';
import type { NoteRepository } from '@/domain/notes/note';
import type { ProjectRepository } from '@/domain/projects/project';
import { indexNotes, searchNotes } from '@/domain/notes/search';
import { AppError } from '@/domain/shared/app-error';

export class AutomationService {
  constructor(
    private readonly operations: AutomationOperations,
    private readonly notes: (projectId: string) => NoteRepository,
    private readonly projects: ProjectRepository,
    private readonly actor: AutomationActor,
  ) {}
  private authorize(projectId: string, write = false): void {
    if (this.actor.projectIds !== '*' && !this.actor.projectIds.includes(projectId))
      throw new AppError('forbidden', 'Projeto fora do escopo desta credencial.');
    if (write && !this.actor.writable)
      throw new AppError('forbidden', 'Credencial somente para leitura.');
  }
  async listProjects() {
    const state = await this.projects.state();
    return state.projects.filter(
      (project) => this.actor.projectIds === '*' || this.actor.projectIds.includes(project.id),
    );
  }
  async listNotes(input: unknown) {
    const data = contracts.listInput.parse(input);
    this.authorize(data.projectId);
    const matches = searchNotes(indexNotes(await this.notes(data.projectId).list()), data.query);
    return {
      total: matches.length,
      offset: data.offset,
      items: matches
        .slice(data.offset, data.offset + data.limit)
        .map(({ content, ...note }) => ({ ...note, excerpt: content.slice(0, 300) })),
    };
  }
  async getNote(input: unknown) {
    const data = contracts.noteInput.parse(input);
    this.authorize(data.projectId);
    const note = (await this.notes(data.projectId).list()).find((note) => note.id === data.noteId);
    if (!note) throw new AppError('not_found', 'Anotação não encontrada neste projeto.');
    return note;
  }
  private writeInput<T extends { projectId: string }>(schema: z.ZodType<T>, input: unknown): T {
    const data = schema.parse(input);
    this.authorize(data.projectId, true);
    return data;
  }
  create(input: unknown) {
    return this.operations.create(this.writeInput(contracts.createInput, input), this.actor.id);
  }
  update(input: unknown) {
    return this.operations.update(this.writeInput(contracts.updateInput, input), this.actor.id);
  }
  reorder(input: unknown) {
    return this.operations.reorder(this.writeInput(contracts.reorderInput, input), this.actor.id);
  }
  prepareDeletion(input: unknown) {
    return this.operations.prepareDeletion(
      this.writeInput(contracts.prepareDeleteInput, input),
      this.actor.id,
    );
  }
  executeDeletion(input: unknown) {
    return this.operations.executeDeletion(
      this.writeInput(contracts.executeDeleteInput, input),
      this.actor.id,
    );
  }
  restore(input: unknown) {
    return this.operations.restore(this.writeInput(contracts.restoreInput, input), this.actor.id);
  }
  deleted(input: unknown) {
    const data = contracts.deletedInput.parse(input);
    this.authorize(data.projectId);
    return this.operations.deleted(data);
  }
  history(input: unknown) {
    const data = contracts.historyInput.parse(input);
    this.authorize(data.projectId);
    return this.operations.history(data);
  }
}
