-- Golf App Initial Schema
-- All tables have REPLICA IDENTITY FULL for Electric SQL sync

-- ============================================================================
-- Enums
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "trip_golfer_status" AS ENUM('invited', 'accepted', 'declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "tee_box_gender" AS ENUM('male', 'female');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "challenge_type" AS ENUM('closest_to_pin', 'longest_drive', 'most_birdies', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "challenge_scope" AS ENUM('hole', 'round', 'trip');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS "trips" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text DEFAULT '' NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "location" text DEFAULT '' NOT NULL,
    "created_by" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "golfers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "email" text DEFAULT '' NOT NULL,
    "phone" text DEFAULT '' NOT NULL,
    "handicap" real DEFAULT 0 NOT NULL,
    "profile_image_url" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "trip_golfers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
    "golfer_id" uuid NOT NULL REFERENCES "golfers"("id") ON DELETE CASCADE,
    "status" "trip_golfer_status" DEFAULT 'invited' NOT NULL,
    "invited_at" timestamp with time zone DEFAULT now() NOT NULL,
    "accepted_at" timestamp with time zone,
    "included_in_scoring" boolean DEFAULT true NOT NULL,
    "handicap_override" real
);

CREATE TABLE IF NOT EXISTS "courses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "api_id" integer,
    "name" text NOT NULL,
    "club_name" text DEFAULT '' NOT NULL,
    "location" text DEFAULT '' NOT NULL,
    "address" text DEFAULT '' NOT NULL,
    "city" text DEFAULT '' NOT NULL,
    "state" text DEFAULT '' NOT NULL,
    "country" text DEFAULT '' NOT NULL,
    "latitude" real,
    "longitude" real,
    "course_rating" real,
    "slope_rating" integer,
    "total_par" integer DEFAULT 72 NOT NULL
);

CREATE TABLE IF NOT EXISTS "tee_boxes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "tee_name" text NOT NULL,
    "gender" "tee_box_gender" NOT NULL,
    "course_rating" real NOT NULL,
    "slope_rating" integer NOT NULL,
    "total_yards" integer NOT NULL,
    "par_total" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "holes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "hole_number" integer NOT NULL,
    "par" integer NOT NULL,
    "stroke_index" integer NOT NULL,
    "yardage" integer
);

CREATE TABLE IF NOT EXISTS "rounds" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
    "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "round_date" timestamp with time zone NOT NULL,
    "round_number" integer DEFAULT 1 NOT NULL,
    "notes" text DEFAULT '' NOT NULL,
    "included_in_scoring" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "scores" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "round_id" uuid NOT NULL REFERENCES "rounds"("id") ON DELETE CASCADE,
    "golfer_id" uuid NOT NULL REFERENCES "golfers"("id") ON DELETE CASCADE,
    "hole_id" uuid NOT NULL REFERENCES "holes"("id") ON DELETE CASCADE,
    "gross_score" integer NOT NULL,
    "handicap_strokes" integer DEFAULT 0 NOT NULL,
    "net_score" integer NOT NULL,
    "stableford_points" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "round_summaries" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "round_id" uuid NOT NULL REFERENCES "rounds"("id") ON DELETE CASCADE,
    "golfer_id" uuid NOT NULL REFERENCES "golfers"("id") ON DELETE CASCADE,
    "total_gross" integer NOT NULL,
    "total_net" integer NOT NULL,
    "total_stableford" integer NOT NULL,
    "birdies_or_better" integer DEFAULT 0 NOT NULL,
    "kps" integer DEFAULT 0 NOT NULL,
    "included_in_scoring" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "teams" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "color" text DEFAULT '#3b82f6' NOT NULL
);

CREATE TABLE IF NOT EXISTS "team_members" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
    "golfer_id" uuid NOT NULL REFERENCES "golfers"("id") ON DELETE CASCADE,
    "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "challenges" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "description" text DEFAULT '' NOT NULL,
    "challenge_type" "challenge_type" DEFAULT 'custom' NOT NULL,
    "scope" "challenge_scope" DEFAULT 'trip' NOT NULL,
    "round_id" uuid REFERENCES "rounds"("id") ON DELETE SET NULL,
    "hole_id" uuid REFERENCES "holes"("id") ON DELETE SET NULL,
    "prize_description" text DEFAULT '' NOT NULL
);

CREATE TABLE IF NOT EXISTS "challenge_results" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "challenge_id" uuid NOT NULL REFERENCES "challenges"("id") ON DELETE CASCADE,
    "golfer_id" uuid NOT NULL REFERENCES "golfers"("id") ON DELETE CASCADE,
    "result_value" text DEFAULT '' NOT NULL,
    "result_numeric" real,
    "is_winner" boolean DEFAULT false NOT NULL
);

-- ============================================================================
-- Indexes for common queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS "trip_golfers_trip_id_idx" ON "trip_golfers" ("trip_id");
CREATE INDEX IF NOT EXISTS "trip_golfers_golfer_id_idx" ON "trip_golfers" ("golfer_id");
CREATE INDEX IF NOT EXISTS "tee_boxes_course_id_idx" ON "tee_boxes" ("course_id");
CREATE INDEX IF NOT EXISTS "holes_course_id_idx" ON "holes" ("course_id");
CREATE INDEX IF NOT EXISTS "rounds_trip_id_idx" ON "rounds" ("trip_id");
CREATE INDEX IF NOT EXISTS "rounds_course_id_idx" ON "rounds" ("course_id");
CREATE INDEX IF NOT EXISTS "scores_round_id_idx" ON "scores" ("round_id");
CREATE INDEX IF NOT EXISTS "scores_golfer_id_idx" ON "scores" ("golfer_id");
CREATE INDEX IF NOT EXISTS "scores_hole_id_idx" ON "scores" ("hole_id");
CREATE INDEX IF NOT EXISTS "round_summaries_round_id_idx" ON "round_summaries" ("round_id");
CREATE INDEX IF NOT EXISTS "round_summaries_golfer_id_idx" ON "round_summaries" ("golfer_id");
CREATE INDEX IF NOT EXISTS "teams_trip_id_idx" ON "teams" ("trip_id");
CREATE INDEX IF NOT EXISTS "team_members_team_id_idx" ON "team_members" ("team_id");
CREATE INDEX IF NOT EXISTS "team_members_golfer_id_idx" ON "team_members" ("golfer_id");
CREATE INDEX IF NOT EXISTS "team_members_trip_id_idx" ON "team_members" ("trip_id");
CREATE INDEX IF NOT EXISTS "challenges_trip_id_idx" ON "challenges" ("trip_id");
CREATE INDEX IF NOT EXISTS "challenges_round_id_idx" ON "challenges" ("round_id");
CREATE INDEX IF NOT EXISTS "challenges_hole_id_idx" ON "challenges" ("hole_id");
CREATE INDEX IF NOT EXISTS "challenge_results_challenge_id_idx" ON "challenge_results" ("challenge_id");
CREATE INDEX IF NOT EXISTS "challenge_results_golfer_id_idx" ON "challenge_results" ("golfer_id");

-- ============================================================================
-- REPLICA IDENTITY FULL for Electric SQL sync
-- Required for Electric to track all column changes
-- ============================================================================

ALTER TABLE "trips" REPLICA IDENTITY FULL;
ALTER TABLE "golfers" REPLICA IDENTITY FULL;
ALTER TABLE "trip_golfers" REPLICA IDENTITY FULL;
ALTER TABLE "courses" REPLICA IDENTITY FULL;
ALTER TABLE "tee_boxes" REPLICA IDENTITY FULL;
ALTER TABLE "holes" REPLICA IDENTITY FULL;
ALTER TABLE "rounds" REPLICA IDENTITY FULL;
ALTER TABLE "scores" REPLICA IDENTITY FULL;
ALTER TABLE "round_summaries" REPLICA IDENTITY FULL;
ALTER TABLE "teams" REPLICA IDENTITY FULL;
ALTER TABLE "team_members" REPLICA IDENTITY FULL;
ALTER TABLE "challenges" REPLICA IDENTITY FULL;
ALTER TABLE "challenge_results" REPLICA IDENTITY FULL;
