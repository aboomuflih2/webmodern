-- Add exit_date_time field to gate_pass_tickets table
ALTER TABLE gate_pass_tickets 
ADD COLUMN exit_date_time TIMESTAMPTZ;

-- Add comment for the new column
COMMENT ON COLUMN gate_pass_tickets.exit_date_time IS 'Permitted exit date and time for the gate pass';

-- Update the updated_at trigger to include the new column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';