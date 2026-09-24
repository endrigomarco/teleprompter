import { z } from 'zod';
import type { Note } from '@/domain/notes/note';
import type { ProjectState } from '@/domain/projects/project';
const identifier = z.string().min(1);
export const noteResponseSchema: z.ZodType<Note> = z.object({
  id: identifier,
  title: z.string(),
  description: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  position: z.number().int().nonnegative(),
  version: z.number().int().positive(),
});
export const notesResponseSchema = z.array(noteResponseSchema);
export const deleteResponseSchema = z.object({ ok: z.literal(true) });
export const projectStateResponseSchema: z.ZodType<ProjectState> = z
  .object({
    projects: z.array(
      z.object({
        id: identifier,
        title: z.string(),
        description: z.string(),
        version: z.number().int().positive(),
        noteCount: z.number().int().nonnegative(),
      }),
    ),
    selectedProjectId: identifier.nullable(),
  })
  .refine(
    (state) =>
      state.selectedProjectId === null ||
      state.projects.some((project) => project.id === state.selectedProjectId),
  );
