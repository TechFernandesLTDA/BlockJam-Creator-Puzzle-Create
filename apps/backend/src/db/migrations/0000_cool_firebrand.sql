CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard', 'expert');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewed', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."reward_type" AS ENUM('daily_login', 'creator_bonus', 'level_complete', 'ad_reward', 'purchase');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"name" varchar(30) NOT NULL,
	"grid_size" integer DEFAULT 8 NOT NULL,
	"difficulty" "difficulty" DEFAULT 'medium' NOT NULL,
	"target_lines" integer DEFAULT 3 NOT NULL,
	"max_moves" integer DEFAULT 20 NOT NULL,
	"level_data" jsonb NOT NULL,
	"thumbnail_url" text,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"plays_count" integer DEFAULT 0 NOT NULL,
	"completion_rate" real DEFAULT 0 NOT NULL,
	"avg_score" real DEFAULT 0 NOT NULL,
	"feed_score" real DEFAULT 0 NOT NULL,
	"is_official" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"level_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "play_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"level_id" uuid NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"moves_used" integer DEFAULT 0 NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"level_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "reward_type" NOT NULL,
	"amount" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" varchar(128) NOT NULL,
	"display_name" varchar(50) NOT NULL,
	"avatar_url" text,
	"coins" integer DEFAULT 100 NOT NULL,
	"total_likes" integer DEFAULT 0 NOT NULL,
	"levels_created" integer DEFAULT 0 NOT NULL,
	"levels_played" integer DEFAULT 0 NOT NULL,
	"high_score" integer DEFAULT 0 NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "levels" ADD CONSTRAINT "levels_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "likes" ADD CONSTRAINT "likes_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rewards" ADD CONSTRAINT "rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "levels_creator_id_idx" ON "levels" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "levels_difficulty_idx" ON "levels" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "levels_feed_score_idx" ON "levels" USING btree ("feed_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "levels_created_at_idx" ON "levels" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "levels_is_official_idx" ON "levels" USING btree ("is_official");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "levels_is_featured_idx" ON "levels" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "levels_is_active_idx" ON "levels" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "levels_likes_count_idx" ON "levels" USING btree ("likes_count");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "likes_user_level_idx" ON "likes" USING btree ("user_id","level_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "likes_level_id_idx" ON "likes" USING btree ("level_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "play_sessions_user_id_idx" ON "play_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "play_sessions_level_id_idx" ON "play_sessions" USING btree ("level_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_level_id_idx" ON "reports" USING btree ("level_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_user_id_idx" ON "rewards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_created_at_idx" ON "rewards" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_firebase_uid_idx" ON "users" USING btree ("firebase_uid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_total_likes_idx" ON "users" USING btree ("total_likes");