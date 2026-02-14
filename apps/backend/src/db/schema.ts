import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// -- Enums --

export const difficultyEnum = pgEnum('difficulty', [
  'easy',
  'medium',
  'hard',
  'expert',
]);

export const reportStatusEnum = pgEnum('report_status', [
  'pending',
  'reviewed',
  'resolved',
  'dismissed',
]);

export const rewardTypeEnum = pgEnum('reward_type', [
  'daily_login',
  'creator_bonus',
  'level_complete',
  'ad_reward',
  'purchase',
]);

// -- Tables --

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    firebaseUid: varchar('firebase_uid', { length: 128 }).unique().notNull(),
    displayName: varchar('display_name', { length: 50 }).notNull(),
    avatarUrl: text('avatar_url'),
    coins: integer('coins').notNull().default(100),
    totalLikes: integer('total_likes').notNull().default(0),
    levelsCreated: integer('levels_created').notNull().default(0),
    levelsPlayed: integer('levels_played').notNull().default(0),
    highScore: integer('high_score').notNull().default(0),
    isPremium: boolean('is_premium').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('users_firebase_uid_idx').on(table.firebaseUid),
    index('users_total_likes_idx').on(table.totalLikes),
  ],
);

export const levels = pgTable(
  'levels',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 30 }).notNull(),
    gridSize: integer('grid_size').notNull().default(8),
    difficulty: difficultyEnum('difficulty').notNull().default('medium'),
    targetLines: integer('target_lines').notNull().default(3),
    maxMoves: integer('max_moves').notNull().default(20),
    levelData: jsonb('level_data').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    likesCount: integer('likes_count').notNull().default(0),
    playsCount: integer('plays_count').notNull().default(0),
    completionRate: real('completion_rate').notNull().default(0),
    avgScore: real('avg_score').notNull().default(0),
    feedScore: real('feed_score').notNull().default(0),
    isOfficial: boolean('is_official').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    isFeatured: boolean('is_featured').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('levels_creator_id_idx').on(table.creatorId),
    index('levels_difficulty_idx').on(table.difficulty),
    index('levels_feed_score_idx').on(table.feedScore),
    index('levels_created_at_idx').on(table.createdAt),
    index('levels_is_official_idx').on(table.isOfficial),
    index('levels_is_featured_idx').on(table.isFeatured),
    index('levels_is_active_idx').on(table.isActive),
    index('levels_likes_count_idx').on(table.likesCount),
  ],
);

export const likes = pgTable(
  'likes',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    levelId: uuid('level_id')
      .notNull()
      .references(() => levels.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('likes_user_level_idx').on(table.userId, table.levelId),
    index('likes_level_id_idx').on(table.levelId),
  ],
);

export const playSessions = pgTable(
  'play_sessions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    levelId: uuid('level_id')
      .notNull()
      .references(() => levels.id, { onDelete: 'cascade' }),
    score: integer('score').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    movesUsed: integer('moves_used').notNull().default(0),
    duration: integer('duration').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('play_sessions_user_id_idx').on(table.userId),
    index('play_sessions_level_id_idx').on(table.levelId),
  ],
);

export const rewards = pgTable(
  'rewards',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: rewardTypeEnum('type').notNull(),
    amount: integer('amount').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('rewards_user_id_idx').on(table.userId),
    index('rewards_created_at_idx').on(table.createdAt),
  ],
);

export const reports = pgTable(
  'reports',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    reporterId: uuid('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    levelId: uuid('level_id')
      .notNull()
      .references(() => levels.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    status: reportStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('reports_level_id_idx').on(table.levelId),
    index('reports_status_idx').on(table.status),
  ],
);
