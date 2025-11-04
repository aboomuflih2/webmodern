-- Add unique constraint on position if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_leadership_position'
    ) THEN
        ALTER TABLE leadership_messages 
        ADD CONSTRAINT unique_leadership_position 
        UNIQUE (position);
    END IF;
END $$;

-- Insert default leadership positions
INSERT INTO leadership_messages (position, person_name, person_title, message_content, display_order, is_active)
VALUES 
  ('chairman', '', '', '', 1, true),
  ('principal', '', '', '', 2, true),
  ('vice_principal', '', '', '', 3, true)
ON CONFLICT (position) DO NOTHING;