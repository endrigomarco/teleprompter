import { z } from 'zod';
import { noteDraftSchema } from '../notes/validation';

export const MAX_BATCH_ITEMS = 50;
const id = z.string().min(1).max(200);
const version = z.number().int().positive();
const project = { projectId: id };
const request = { ...project, requestId: z.string().uuid() };
const uniqueIds = z
  .array(id)
  .max(5000)
  .refine((ids) => new Set(ids).size === ids.length, 'IDs duplicados.');
export const projectInput = z.object(project).strict();
export const listInput = projectInput.extend({
  query: z.string().max(500).default(''),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(25),
});
export const noteInput = projectInput.extend({ noteId: id }).strict();
export const createInput = z
  .object({ ...request, items: z.array(noteDraftSchema.strict()).min(1).max(MAX_BATCH_ITEMS) })
  .strict();
export const updateInput = z
  .object({
    ...request,
    items: z
      .array(
        z
          .object({
            noteId: id,
            expectedVersion: version,
            changes: noteDraftSchema
              .partial()
              .strict()
              .refine((value) => Object.keys(value).length > 0, 'Informe campos para alterar.'),
          })
          .strict(),
      )
      .min(1)
      .max(MAX_BATCH_ITEMS)
      .refine(
        (items) => new Set(items.map((item) => item.noteId)).size === items.length,
        'IDs duplicados.',
      ),
  })
  .strict();
export const reorderInput = z.object({ ...request, ids: uniqueIds }).strict();
export const prepareDeleteInput = projectInput
  .extend({
    noteIds: uniqueIds.optional(),
    all: z.boolean().default(false),
  })
  .strict()
  .refine(
    (input) => (input.all ? input.noteIds === undefined : Boolean(input.noteIds?.length)),
    'Informe noteIds ou all=true, nunca ambos.',
  );
export const executeDeleteInput = z
  .object({ ...request, confirmationToken: z.string().uuid() })
  .strict();
export const historyInput = noteInput
  .extend({
    beforeRevisionId: z
      .string()
      .regex(/^[1-9]\d{0,17}$/)
      .optional(),
    limit: z.number().int().min(1).max(100).default(20),
  })
  .strict();
export const deletedInput = historyInput.omit({ noteId: true });
export type DeletedQuery = z.infer<typeof deletedInput>;

export const restoreInput = z
  .object({
    ...request,
    noteId: id,
    revisionId: z.string().regex(/^[1-9]\d{0,17}$/),
    expectedVersion: version.nullable(),
  })
  .strict();

export type CreateBatch = z.infer<typeof createInput>;
export type UpdateBatch = z.infer<typeof updateInput>;
export type ReorderBatch = z.infer<typeof reorderInput>;
export type PrepareDeletion = z.infer<typeof prepareDeleteInput>;
export type ExecuteDeletion = z.infer<typeof executeDeleteInput>;
export type HistoryQuery = z.infer<typeof historyInput>;
export type RestoreNote = z.infer<typeof restoreInput>;
