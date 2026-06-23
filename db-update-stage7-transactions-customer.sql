ALTER TABLE transactions ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
