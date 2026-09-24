import type { Note } from '@/domain/notes/note';
import type {
  AutomationOperations,
  AutomationUnitOfWork,
  NoteHistoryReader,
} from '@/domain/automation/ports';
import type {
  CreateBatch,
  UpdateBatch,
  ReorderBatch,
  PrepareDeletion,
  ExecuteDeletion,
  RestoreNote,
  DeletedQuery,
  HistoryQuery,
} from '@/domain/automation/validation';
import { AppError } from '@/domain/shared/app-error';

const DELETION_PREVIEW_MINUTES = 10;
export class AutomationOperationService implements AutomationOperations {
  constructor(
    private readonly transactions: AutomationUnitOfWork,
    private readonly revisions: NoteHistoryReader,
  ) {}
  create(input: CreateBatch, actor: string): Promise<Note[]> {
    return this.transactions.execute(actor, { name: 'create', input }, async ({ notes }) => {
      const result: Note[] = [];
      for (const draft of input.items) result.push(await notes.create(draft));
      return result;
    });
  }
  update(input: UpdateBatch, actor: string): Promise<Note[]> {
    return this.transactions.execute(actor, { name: 'update', input }, async ({ notes }) => {
      const existing = new Map((await notes.list()).map((note) => [note.id, note]));
      const result: Note[] = [];
      for (const item of input.items) {
        const note = existing.get(item.noteId);
        if (!note) throw new AppError('not_found', 'Anotação não encontrada neste projeto.');
        result.push(
          await notes.update(item.noteId, { ...note, ...item.changes }, item.expectedVersion),
        );
      }
      return result;
    });
  }
  reorder(input: ReorderBatch, actor: string): Promise<Note[]> {
    return this.transactions.execute(actor, { name: 'reorder', input }, ({ notes }) =>
      notes.reorder(input.ids),
    );
  }
  prepareDeletion(input: PrepareDeletion, actor: string) {
    return this.transactions.withinProject(input.projectId, async ({ notes, deletionPlans }) => {
      const existing = await notes.list();
      const targets = input.all
        ? existing
        : existing.filter((note) => input.noteIds?.includes(note.id));
      if (!input.all && targets.length !== input.noteIds?.length)
        throw new AppError('not_found', 'Uma ou mais anotações não pertencem ao projeto.');
      return deletionPlans.create(
        actor,
        targets.map(({ id, title, version }) => ({ id, title, version })),
        DELETION_PREVIEW_MINUTES,
      );
    });
  }
  executeDeletion(input: ExecuteDeletion, actor: string) {
    return this.transactions.execute(
      actor,
      { name: 'delete', input },
      async ({ notes, deletionPlans }) => {
        const plan = await deletionPlans.find(input.confirmationToken, actor);
        if (!plan) throw new AppError('not_found', 'Prévia de exclusão não encontrada.');
        if (plan.expired || plan.used)
          throw new AppError(
            'conflict',
            'Prévia expirada ou utilizada. Gere outra prévia e peça confirmação.',
          );
        for (const item of plan.targets) await notes.delete(item.id, item.version);
        await deletionPlans.consume(input.confirmationToken);
        return { deleted: plan.targets.length, noteIds: plan.targets.map((item) => item.id) };
      },
    );
  }
  restore(input: RestoreNote, actor: string): Promise<Note> {
    return this.transactions.execute(
      actor,
      { name: 'restore', input },
      async ({ notes, history }) => {
        const current = (await notes.list()).find((note) => note.id === input.noteId);
        if ((current?.version ?? null) !== input.expectedVersion)
          throw new AppError(
            'conflict',
            'Estado da anotação mudou. Leia a versão atual antes de restaurar.',
          );
        const snapshot = await history.findRevision(input.noteId, input.revisionId);
        if (!snapshot) throw new AppError('not_found', 'Revisão não encontrada neste projeto.');
        return current
          ? notes.update(current.id, snapshot, current.version)
          : history.restoreDeleted(input.noteId, snapshot);
      },
    );
  }
  deleted(input: DeletedQuery) {
    return this.revisions.deleted(input);
  }
  history(input: HistoryQuery) {
    return this.revisions.history(input);
  }
}
