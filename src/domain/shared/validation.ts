import { z } from 'zod';
export const versionSchema = z.object({ version: z.number().int().positive() });
