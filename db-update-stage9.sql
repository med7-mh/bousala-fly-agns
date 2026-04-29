-- Update customers table with national_id and passport_number
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS national_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50);
