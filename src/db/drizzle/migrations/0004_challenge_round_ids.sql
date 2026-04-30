-- Add round_ids array column to challenges table
ALTER TABLE challenges ADD COLUMN round_ids UUID[] DEFAULT '{}';

-- Migrate existing roundId data to round_ids array
UPDATE challenges
SET round_ids = CASE
  WHEN round_id IS NOT NULL THEN ARRAY[round_id]
  ELSE '{}'
END;

-- Note: Keep round_id for backwards compatibility
-- Frontend will read from round_ids and fall back to round_id
