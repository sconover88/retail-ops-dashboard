-- Add arriving order columns to inventory
ALTER TABLE inventory ADD COLUMN arriving_qty INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN arriving_date DATE;
