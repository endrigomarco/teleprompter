import { z } from 'zod';
import { FIELD_LIMITS } from '../shared/limits';
import { versionSchema } from '../shared/validation';
export { versionSchema } from '../shared/validation';
export const noteDraftSchema = z.object({
  title: z.string().trim().min(1, 'Informe um título.').max(FIELD_LIMITS.title),
  description: z.string().trim().max(FIELD_LIMITS.description),
  content: z.string().trim().max(FIELD_LIMITS.content),
  tags: z
    .array(z.string().trim().max(FIELD_LIMITS.tags))
    .max(FIELD_LIMITS.tags)
    .refine(
      (tags) => tags.reduce((size, tag) => size + tag.length, 0) <= FIELD_LIMITS.tags,
      'As tags são muito longas.',
    )
    .transform((tags) => [...new Set(tags.filter(Boolean))]),
});
export const updateNoteSchema = noteDraftSchema.extend({ version: versionSchema.shape.version });
export const reorderSchema = z.object({
  ids: z
    .array(z.string().min(1).max(FIELD_LIMITS.title))
    .refine((ids) => new Set(ids).size === ids.length, 'A ordem contém itens duplicados.'),
});
