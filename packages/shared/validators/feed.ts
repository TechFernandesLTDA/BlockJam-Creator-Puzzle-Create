import { z } from 'zod';
import { difficultySchema } from './level';

export const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['trending', 'new', 'top']).default('trending'),
  difficulty: difficultySchema.optional(),
});
