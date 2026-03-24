-- Authentication Schema
-- Magic link auth with identities, sessions, and trip organizers

-- ============================================================================
-- Enums
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "trip_organizer_role" AS ENUM('owner', 'organizer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- Tables
-- ============================================================================

-- Identities (authenticated users)
CREATE TABLE IF NOT EXISTS "identities" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL UNIQUE,
    "golfer_id" uuid REFERENCES "golfers"("id") ON DELETE SET NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "last_login_at" timestamp with time zone
);

-- Sessions (HttpOnly cookies, 30-day expiry)
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "identity_id" uuid NOT NULL REFERENCES "identities"("id") ON DELETE CASCADE,
    "token" text NOT NULL UNIQUE,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "last_active_at" timestamp with time zone,
    "user_agent" text,
    "ip_address" text
);

-- Magic links (6-char code, 15-min expiry)
CREATE TABLE IF NOT EXISTS "magic_links" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL,
    "code" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Trip organizers (multiple per trip)
CREATE TABLE IF NOT EXISTS "trip_organizers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
    "identity_id" uuid NOT NULL REFERENCES "identities"("id") ON DELETE CASCADE,
    "role" "trip_organizer_role" DEFAULT 'organizer' NOT NULL,
    "added_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE("trip_id", "identity_id")
);

-- Trip invites (7-day links)
CREATE TABLE IF NOT EXISTS "trip_invites" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
    "token" text NOT NULL UNIQUE,
    "created_by" uuid NOT NULL REFERENCES "identities"("id") ON DELETE CASCADE,
    "expires_at" timestamp with time zone NOT NULL,
    "max_uses" integer,
    "use_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS "identities_email_idx" ON "identities" ("email");
CREATE INDEX IF NOT EXISTS "identities_golfer_id_idx" ON "identities" ("golfer_id");
CREATE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions" ("token");
CREATE INDEX IF NOT EXISTS "sessions_identity_id_idx" ON "sessions" ("identity_id");
CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions" ("expires_at");
CREATE INDEX IF NOT EXISTS "magic_links_email_code_idx" ON "magic_links" ("email", "code");
CREATE INDEX IF NOT EXISTS "magic_links_expires_at_idx" ON "magic_links" ("expires_at");
CREATE INDEX IF NOT EXISTS "trip_organizers_trip_id_idx" ON "trip_organizers" ("trip_id");
CREATE INDEX IF NOT EXISTS "trip_organizers_identity_id_idx" ON "trip_organizers" ("identity_id");
CREATE INDEX IF NOT EXISTS "trip_invites_token_idx" ON "trip_invites" ("token");
CREATE INDEX IF NOT EXISTS "trip_invites_trip_id_idx" ON "trip_invites" ("trip_id");

-- ============================================================================
-- REPLICA IDENTITY FULL for Electric SQL sync
-- Required for Electric to track all column changes
-- ============================================================================

ALTER TABLE "identities" REPLICA IDENTITY FULL;
ALTER TABLE "trip_organizers" REPLICA IDENTITY FULL;
ALTER TABLE "trip_invites" REPLICA IDENTITY FULL;

-- Note: sessions and magic_links don't need REPLICA IDENTITY FULL
-- as they are server-only tables not synced to clients
