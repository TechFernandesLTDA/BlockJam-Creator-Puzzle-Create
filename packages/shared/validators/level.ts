import { z } from 'zod';

export const gridSizeSchema = z.union([z.literal(6), z.literal(8), z.literal(10)]);

export const difficultySchema = z.enum(['easy', 'medium', 'hard', 'expert']);

export const gridCellSchema = z.object({
  r: z.number().int().min(0),
  c: z.number().int().min(0),
  color: z.number().int().min(0).max(7),
});

export const levelMetaSchema = z.object({
  name: z.string().min(1).max(30),
  creatorId: z.string().uuid(),
  createdAt: z.string().datetime(),
  gridSize: gridSizeSchema,
  difficulty: difficultySchema,
  targetLines: z.number().int().min(1).max(20),
  maxMoves: z.number().int().min(1).max(100),
  thumbnail: z.string(),
});

export const levelDataSchema = z.object({
  version: z.literal(1),
  meta: levelMetaSchema,
  grid: z.object({
    cells: z.array(gridCellSchema),
  }),
  pieces: z
    .object({
      sequence: z.array(
        z.object({
          shape: z.number().int().min(0),
          color: z.number().int().min(0).max(7),
        }),
      ),
    })
    .optional(),
  validation: z.object({
    isSolvable: z.boolean(),
    minMoves: z.number().int().min(0),
    checksum: z.string(),
  }),
});

export const createLevelSchema = z.object({
  name: z.string().min(1).max(30),
  gridSize: gridSizeSchema,
  difficulty: difficultySchema,
  targetLines: z.number().int().min(1).max(20),
  maxMoves: z.number().int().min(1).max(100),
  levelData: levelDataSchema,
});
