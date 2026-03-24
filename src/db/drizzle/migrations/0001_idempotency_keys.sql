-- Idempotency Keys Table
-- Tracks processed mutations to prevent duplicate execution on retry

CREATE TABLE IF NOT EXISTS "idempotency_keys" (
    "key" text PRIMARY KEY NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "result" jsonb
);

-- Index for cleanup of old keys
CREATE INDEX IF NOT EXISTS "idempotency_keys_created_at_idx" ON "idempotency_keys" ("created_at");

-- Function to check and claim an idempotency key
-- Returns true if the key was newly claimed, false if it already exists
CREATE OR REPLACE FUNCTION claim_idempotency_key(p_key text, p_result jsonb DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
    inserted boolean;
BEGIN
    INSERT INTO idempotency_keys (key, result)
    VALUES (p_key, p_result)
    ON CONFLICT (key) DO NOTHING;

    GET DIAGNOSTICS inserted = ROW_COUNT;
    RETURN inserted > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old idempotency keys (older than 24 hours)
-- Run this periodically via a scheduled job
CREATE OR REPLACE FUNCTION cleanup_idempotency_keys()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM idempotency_keys
    WHERE created_at < now() - interval '24 hours';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Note: This table does NOT need REPLICA IDENTITY FULL
-- It's not synced to clients via Electric
