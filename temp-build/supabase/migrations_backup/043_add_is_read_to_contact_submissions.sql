-- Add is_read column to contact_submissions table
ALTER TABLE contact_submissions 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- Update existing records to be unread by default
UPDATE contact_submissions SET is_read = FALSE WHERE is_read IS NULL;

-- Grant permissions for the new column
GRANT SELECT, UPDATE ON contact_submissions TO authenticated;
GRANT SELECT ON contact_submissions TO anon;