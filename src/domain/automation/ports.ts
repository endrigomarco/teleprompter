import type { Note, NoteRepository } from '../notes/note';
import type {
  CreateBatch,
  UpdateBatch,
  ReorderBatch,
  PrepareDeletion,
  ExecuteDeletion,
  HistoryQuery,
  RestoreNote,
  DeletedQuery,
} from './validation';
import type { DeletionPlan, DeletedNote, NoteRevision } from './models';
export interface AutomationOperations {
  create(input: CreateBatch, actor: string): Promise<Note[]>;
  update(input: UpdateBatch, actor: string): Promise<Note[]>;
  reorder(input: ReorderBatch, actor: string): Promise<Note[]>;
  prepareDeletion(input: PrepareDeletion, actor: string): Promise<DeletionPlan>;
  executeDeletion(
    input: ExecuteDeletion,
    actor: string,
  ): Promise<{ deleted: number; noteIds: string[] }>;
  deleted(input: DeletedQuery): Promise<DeletedNote[]>;
  history(input: HistoryQuery): Promise<NoteRevision[]>;
  restore(input: RestoreNote, actor: string): Promise<Note>;
}

export interface NoteHistoryReader {
  deleted(input: DeletedQuery): Promise<DeletedNote[]>;
  history(input: HistoryQuery): Promise<NoteRevision[]>;
}
export interface TransactionHistory {
  findRevision(noteId: string, revisionId: string): Promise<Note | null>;
  restoreDeleted(noteId: string, snapshot: Note): Promise<Note>;
}
export interface StoredDeletionPlan {
  targets: DeletionPlan['items'];
  expired: boolean;
  used: boolean;
}
export interface DeletionPlanStore {
  create(
    actor: string,
    items: DeletionPlan['items'],
    expiresInMinutes: number,
  ): Promise<DeletionPlan>;
  find(token: string, actor: string): Promise<StoredDeletionPlan | null>;
  consume(token: string): Promise<void>;
}
export interface AutomationSession {
  notes: NoteRepository;
  history: TransactionHistory;
  deletionPlans: DeletionPlanStore;
}
export interface AutomationCommand {
  name: string;
  input: { projectId: string; requestId: string };
}
export interface AutomationUnitOfWork {
  withinProject<T>(
    projectId: string,
    operation: (session: AutomationSession) => Promise<T>,
  ): Promise<T>;
  execute<T>(
    actor: string,
    command: AutomationCommand,
    operation: (session: AutomationSession) => Promise<T>,
  ): Promise<T>;
}
