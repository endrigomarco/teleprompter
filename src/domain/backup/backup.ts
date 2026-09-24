import { z } from 'zod';
import { FIELD_LIMITS } from '../shared/limits';
export const INITIAL_PROJECT_ID = 'interview-copilot';
export const IMPORT_MARKER = 'legacy-json-v1';
const identifier = z.string().min(1);
const title = z.string().min(1).max(FIELD_LIMITS.title);
const description = z.string().max(FIELD_LIMITS.description);
const content = z.string().max(FIELD_LIMITS.content);
const tags = z.array(z.string());
const version = z.number().int().positive();
const timestamp = z.iso.datetime({ offset: true });
const legacyNoteSchema = z.object({
  id: identifier,
  titulo: title,
  descricao: description,
  conteudo: content,
  tags,
});
const projectSchema = z.object({
  id: identifier,
  title,
  description,
  version,
  created_at: timestamp,
});
const noteSchema = z.object({
  id: identifier,
  project_id: identifier,
  title,
  description,
  content,
  tags,
  position: z.number().int().nonnegative(),
  version,
  created_at: timestamp,
  updated_at: timestamp,
});
export const backupSchema = z.object({
  format: z.literal('teleprompter-projects-v1'),
  selectedProjectId: identifier.nullable(),
  projects: z.array(projectSchema),
  notes: z.array(noteSchema),
});
export type Backup = z.infer<typeof backupSchema>;
export type LegacyNote = z.infer<typeof legacyNoteSchema>;
export type ImportData =
  { kind: 'legacy'; notes: LegacyNote[] } | { kind: 'backup'; backup: Backup };
function assertUnique(ids: string[]): void {
  if (new Set(ids).size !== ids.length) throw new Error('IDs duplicados no arquivo.');
}
function validateBackup(backup: Backup): void {
  assertUnique(backup.projects.map((project) => project.id));
  assertUnique(backup.notes.map((note) => note.id));
  const projectIds = new Set(backup.projects.map((project) => project.id));
  if (backup.selectedProjectId !== null && !projectIds.has(backup.selectedProjectId))
    throw new Error('Projeto selecionado ausente no backup.');
  const positions = new Set<string>();
  for (const note of backup.notes) {
    if (!projectIds.has(note.project_id)) throw new Error('Anotação sem projeto correspondente.');
    const key = JSON.stringify([note.project_id, note.position]);
    if (positions.has(key)) throw new Error('Posição duplicada no projeto.');
    positions.add(key);
  }
}
export function parseImportData(input: unknown): ImportData {
  if (Array.isArray(input)) {
    const notes = z.array(legacyNoteSchema).parse(input);
    assertUnique(notes.map((note) => note.id));
    return { kind: 'legacy', notes };
  }
  const backup = backupSchema.parse(input);
  validateBackup(backup);
  return { kind: 'backup', backup };
}
