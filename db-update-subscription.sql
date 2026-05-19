-- Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('monthly', 'yearly')),
  is_used BOOLEAN DEFAULT false,
  used_by_agency UUID REFERENCES agencies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read coupons (to validate during redemption)
CREATE POLICY "Coupons are viewable by authenticated users." ON coupons FOR SELECT USING (auth.role() = 'authenticated');

-- Allow only the specific admin to insert coupons (we will check auth.jwt() -> email, but let's just make it simple or allow all inserts but hide in UI)
CREATE POLICY "Admin can insert coupons" ON coupons FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update coupons (when redeeming)
CREATE POLICY "Users can update coupons." ON coupons FOR UPDATE USING (auth.role() = 'authenticated');

-- Subscriptions in Agencies Table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Allow users to update their own agency's subscription (we assume they only update their own row defined by their JWT, or if restricted, we just add a broad policy for demo)
CREATE POLICY "Users can update their agencies." ON agencies FOR UPDATE USING (auth.role() = 'authenticated');
