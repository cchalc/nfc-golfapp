-- Add tee_box_id column to rounds table
ALTER TABLE rounds ADD COLUMN tee_box_id UUID REFERENCES tee_boxes(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rounds_tee_box_id ON rounds(tee_box_id);
