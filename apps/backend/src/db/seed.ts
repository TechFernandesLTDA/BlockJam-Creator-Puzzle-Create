import { db, closeDb } from './client.js';
import { users, levels } from './schema.js';
import { logger } from '../utils/logger.js';

interface SeedLevel {
  name: string;
  gridSize: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  targetLines: number;
  maxMoves: number;
  levelData: Record<string, unknown>;
}

function makeLevelData(
  name: string,
  gridSize: number,
  difficulty: string,
  targetLines: number,
  maxMoves: number,
  cells: Array<{ r: number; c: number; color: number }>,
): Record<string, unknown> {
  return {
    version: 1,
    meta: {
      name,
      creatorId: '00000000-0000-0000-0000-000000000001',
      createdAt: new Date().toISOString(),
      gridSize,
      difficulty,
      targetLines,
      maxMoves,
      thumbnail: '',
    },
    grid: { cells },
    validation: {
      isSolvable: true,
      minMoves: Math.floor(maxMoves * 0.6),
      checksum: `seed-${name.toLowerCase().replace(/\s/g, '-')}`,
    },
  };
}

async function seed(): Promise<void> {
  logger.info('Starting database seed...');

  // Insert sample users
  const [user1, user2, user3] = await db
    .insert(users)
    .values([
      {
        id: '00000000-0000-0000-0000-000000000001',
        firebaseUid: 'official-blockjam',
        displayName: 'BlockJam Official',
        avatarUrl: null,
        coins: 9999,
        isPremium: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        firebaseUid: 'creator-alice',
        displayName: 'Alice Builder',
        avatarUrl: null,
        coins: 500,
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        firebaseUid: 'creator-bob',
        displayName: 'Bob Designer',
        avatarUrl: null,
        coins: 250,
      },
    ])
    .returning();

  logger.info(`Inserted ${3} users`);

  const officialId = user1!.id;

  // Define 12 campaign levels: 3 easy, 3 medium, 3 hard, 3 expert
  const campaignLevels: SeedLevel[] = [
    // Easy levels (6x6 grid, low targets)
    {
      name: 'First Steps',
      gridSize: 6,
      difficulty: 'easy',
      targetLines: 1,
      maxMoves: 15,
      levelData: makeLevelData('First Steps', 6, 'easy', 1, 15, [
        { r: 0, c: 0, color: 0 },
        { r: 0, c: 1, color: 0 },
        { r: 0, c: 2, color: 0 },
        { r: 1, c: 0, color: 1 },
        { r: 1, c: 3, color: 2 },
      ]),
    },
    {
      name: 'Color Match',
      gridSize: 6,
      difficulty: 'easy',
      targetLines: 2,
      maxMoves: 18,
      levelData: makeLevelData('Color Match', 6, 'easy', 2, 18, [
        { r: 0, c: 0, color: 0 },
        { r: 0, c: 1, color: 1 },
        { r: 0, c: 2, color: 0 },
        { r: 1, c: 0, color: 1 },
        { r: 1, c: 1, color: 0 },
        { r: 2, c: 0, color: 2 },
        { r: 2, c: 3, color: 3 },
      ]),
    },
    {
      name: 'Simple Stack',
      gridSize: 6,
      difficulty: 'easy',
      targetLines: 2,
      maxMoves: 20,
      levelData: makeLevelData('Simple Stack', 6, 'easy', 2, 20, [
        { r: 0, c: 0, color: 2 },
        { r: 0, c: 1, color: 2 },
        { r: 1, c: 0, color: 3 },
        { r: 1, c: 1, color: 3 },
        { r: 2, c: 2, color: 4 },
        { r: 3, c: 0, color: 0 },
      ]),
    },
    // Medium levels (8x8 grid)
    {
      name: 'Block Party',
      gridSize: 8,
      difficulty: 'medium',
      targetLines: 3,
      maxMoves: 20,
      levelData: makeLevelData('Block Party', 8, 'medium', 3, 20, [
        { r: 0, c: 0, color: 0 },
        { r: 0, c: 1, color: 1 },
        { r: 0, c: 2, color: 2 },
        { r: 1, c: 0, color: 3 },
        { r: 1, c: 1, color: 0 },
        { r: 2, c: 0, color: 1 },
        { r: 2, c: 4, color: 4 },
        { r: 3, c: 2, color: 5 },
      ]),
    },
    {
      name: 'Grid Lock',
      gridSize: 8,
      difficulty: 'medium',
      targetLines: 4,
      maxMoves: 25,
      levelData: makeLevelData('Grid Lock', 8, 'medium', 4, 25, [
        { r: 0, c: 0, color: 0 },
        { r: 0, c: 3, color: 1 },
        { r: 0, c: 5, color: 2 },
        { r: 1, c: 1, color: 3 },
        { r: 1, c: 4, color: 0 },
        { r: 2, c: 0, color: 1 },
        { r: 2, c: 2, color: 4 },
        { r: 3, c: 3, color: 5 },
        { r: 4, c: 1, color: 6 },
      ]),
    },
    {
      name: 'Pattern Play',
      gridSize: 8,
      difficulty: 'medium',
      targetLines: 4,
      maxMoves: 22,
      levelData: makeLevelData('Pattern Play', 8, 'medium', 4, 22, [
        { r: 0, c: 0, color: 0 },
        { r: 0, c: 2, color: 0 },
        { r: 0, c: 4, color: 0 },
        { r: 1, c: 1, color: 1 },
        { r: 1, c: 3, color: 1 },
        { r: 2, c: 0, color: 2 },
        { r: 2, c: 2, color: 2 },
        { r: 3, c: 1, color: 3 },
        { r: 3, c: 5, color: 4 },
      ]),
    },
    // Hard levels (8x8 grid, tighter constraints)
    {
      name: 'Tight Squeeze',
      gridSize: 8,
      difficulty: 'hard',
      targetLines: 6,
      maxMoves: 20,
      levelData: makeLevelData('Tight Squeeze', 8, 'hard', 6, 20, [
        { r: 0, c: 0, color: 0 },
        { r: 0, c: 1, color: 1 },
        { r: 0, c: 2, color: 2 },
        { r: 0, c: 3, color: 3 },
        { r: 1, c: 0, color: 4 },
        { r: 1, c: 1, color: 5 },
        { r: 1, c: 4, color: 0 },
        { r: 2, c: 2, color: 6 },
        { r: 2, c: 5, color: 1 },
        { r: 3, c: 0, color: 2 },
        { r: 3, c: 3, color: 7 },
        { r: 4, c: 1, color: 3 },
      ]),
    },
    {
      name: 'Combo King',
      gridSize: 8,
      difficulty: 'hard',
      targetLines: 7,
      maxMoves: 25,
      levelData: makeLevelData('Combo King', 8, 'hard', 7, 25, [
        { r: 0, c: 0, color: 0 },
        { r: 0, c: 2, color: 1 },
        { r: 0, c: 4, color: 2 },
        { r: 0, c: 6, color: 3 },
        { r: 1, c: 1, color: 4 },
        { r: 1, c: 3, color: 5 },
        { r: 1, c: 5, color: 6 },
        { r: 2, c: 0, color: 7 },
        { r: 2, c: 2, color: 0 },
        { r: 3, c: 1, color: 1 },
        { r: 3, c: 4, color: 2 },
        { r: 4, c: 0, color: 3 },
        { r: 4, c: 3, color: 4 },
      ]),
    },
    {
      name: 'Block Blitz',
      gridSize: 8,
      difficulty: 'hard',
      targetLines: 8,
      maxMoves: 22,
      levelData: makeLevelData('Block Blitz', 8, 'hard', 8, 22, [
        { r: 0, c: 0, color: 5 },
        { r: 0, c: 1, color: 3 },
        { r: 0, c: 3, color: 1 },
        { r: 0, c: 5, color: 7 },
        { r: 1, c: 0, color: 2 },
        { r: 1, c: 2, color: 6 },
        { r: 1, c: 4, color: 0 },
        { r: 2, c: 1, color: 4 },
        { r: 2, c: 3, color: 1 },
        { r: 2, c: 5, color: 3 },
        { r: 3, c: 0, color: 7 },
        { r: 3, c: 2, color: 5 },
        { r: 4, c: 4, color: 2 },
      ]),
    },
    // Expert levels (10x10 grid)
    {
      name: 'Master Class',
      gridSize: 10,
      difficulty: 'expert',
      targetLines: 10,
      maxMoves: 25,
      levelData: makeLevelData('Master Class', 10, 'expert', 10, 25, [
        { r: 0, c: 0, color: 0 },
        { r: 0, c: 2, color: 1 },
        { r: 0, c: 4, color: 2 },
        { r: 0, c: 6, color: 3 },
        { r: 0, c: 8, color: 4 },
        { r: 1, c: 1, color: 5 },
        { r: 1, c: 3, color: 6 },
        { r: 1, c: 5, color: 7 },
        { r: 1, c: 7, color: 0 },
        { r: 2, c: 0, color: 1 },
        { r: 2, c: 4, color: 2 },
        { r: 2, c: 8, color: 3 },
        { r: 3, c: 2, color: 4 },
        { r: 3, c: 6, color: 5 },
        { r: 4, c: 0, color: 6 },
        { r: 4, c: 3, color: 7 },
      ]),
    },
    {
      name: 'The Gauntlet',
      gridSize: 10,
      difficulty: 'expert',
      targetLines: 12,
      maxMoves: 30,
      levelData: makeLevelData('The Gauntlet', 10, 'expert', 12, 30, [
        { r: 0, c: 0, color: 0 },
        { r: 0, c: 1, color: 1 },
        { r: 0, c: 3, color: 2 },
        { r: 0, c: 5, color: 3 },
        { r: 0, c: 7, color: 4 },
        { r: 0, c: 9, color: 5 },
        { r: 1, c: 0, color: 6 },
        { r: 1, c: 2, color: 7 },
        { r: 1, c: 4, color: 0 },
        { r: 1, c: 6, color: 1 },
        { r: 1, c: 8, color: 2 },
        { r: 2, c: 1, color: 3 },
        { r: 2, c: 3, color: 4 },
        { r: 2, c: 5, color: 5 },
        { r: 3, c: 0, color: 6 },
        { r: 3, c: 4, color: 7 },
        { r: 3, c: 7, color: 0 },
        { r: 4, c: 2, color: 1 },
      ]),
    },
    {
      name: 'Final Boss',
      gridSize: 10,
      difficulty: 'expert',
      targetLines: 15,
      maxMoves: 30,
      levelData: makeLevelData('Final Boss', 10, 'expert', 15, 30, [
        { r: 0, c: 0, color: 0 },
        { r: 0, c: 1, color: 1 },
        { r: 0, c: 2, color: 2 },
        { r: 0, c: 4, color: 3 },
        { r: 0, c: 6, color: 4 },
        { r: 0, c: 8, color: 5 },
        { r: 1, c: 0, color: 6 },
        { r: 1, c: 1, color: 7 },
        { r: 1, c: 3, color: 0 },
        { r: 1, c: 5, color: 1 },
        { r: 1, c: 7, color: 2 },
        { r: 1, c: 9, color: 3 },
        { r: 2, c: 0, color: 4 },
        { r: 2, c: 2, color: 5 },
        { r: 2, c: 4, color: 6 },
        { r: 2, c: 6, color: 7 },
        { r: 3, c: 1, color: 0 },
        { r: 3, c: 3, color: 1 },
        { r: 3, c: 5, color: 2 },
        { r: 4, c: 0, color: 3 },
        { r: 4, c: 4, color: 4 },
        { r: 4, c: 8, color: 5 },
      ]),
    },
  ];

  // Insert campaign levels
  const levelValues = campaignLevels.map((lvl) => ({
    creatorId: officialId,
    name: lvl.name,
    gridSize: lvl.gridSize,
    difficulty: lvl.difficulty as 'easy' | 'medium' | 'hard' | 'expert',
    targetLines: lvl.targetLines,
    maxMoves: lvl.maxMoves,
    levelData: lvl.levelData,
    isOfficial: true,
    isActive: true,
    isFeatured: false,
  }));

  const insertedLevels = await db
    .insert(levels)
    .values(levelValues)
    .returning();

  logger.info(`Inserted ${insertedLevels.length} campaign levels`);

  // Update official user's levelsCreated count
  const { eq } = await import('drizzle-orm');
  await db
    .update(users)
    .set({ levelsCreated: insertedLevels.length })
    .where(eq(users.id, officialId));

  logger.info('Seed complete!');
}

seed()
  .then(() => closeDb())
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, 'Seed failed');
    closeDb()
      .then(() => process.exit(1))
      .catch(() => process.exit(1));
  });
