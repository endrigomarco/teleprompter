import { z } from 'zod';
import { FIELD_LIMITS } from '../shared/limits';
import { versionSchema } from '../shared/validation';
export const projectDraftSchema = z.object({
  title: z.string().trim().min(1, 'Informe um título.').max(FIELD_LIMITS.title),
  description: z.string().trim().max(FIELD_LIMITS.description),
});
export const updateProjectSchema = projectDraftSchema.extend(versionSchema.shape);
export const selectProjectSchema = z.object({ id: z.string().min(1).max(FIELD_LIMITS.title) });
