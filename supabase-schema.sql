-- ==========================================
-- 1. Database Design (Tables)
-- ==========================================

-- Agencies Table (Tenant)
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles Table (Extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'agent')) DEFAULT 'agent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('flight', 'hotel', 'visa', 'tour')) NOT NULL,
    description TEXT,
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    type VARCHAR(50) CHECK (type IN ('income', 'expense')) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    payment_method VARCHAR(50),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agency Staff (POS Mode Users)
CREATE TABLE agency_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    pin VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_staff ENABLE ROW LEVEL SECURITY;

-- Helper Function: Get current user's agency_id
CREATE OR REPLACE FUNCTION get_current_agency_id()
RETURNS UUID AS $$
  SELECT agency_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper Function: Get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ==========================================
-- 🟢 THE ROOT CAUSE FIX: INSERT POLICIES
-- ==========================================
-- Allow ANY authenticated user to create an agency (needed during sign-up)
CREATE POLICY "Allow users to create agencies" ON agencies
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow ANY authenticated user to create their own profile
CREATE POLICY "Allow users to create their own profile" ON profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ==========================================

-- Policies for Agencies
CREATE POLICY "Users can view their own agency" ON agencies
    FOR SELECT USING (id = get_current_agency_id());
CREATE POLICY "Users can update their own agency" ON agencies
    FOR UPDATE USING (id = get_current_agency_id());

-- Policies for Profiles
CREATE POLICY "Users can view profiles in their agency" ON profiles
    FOR SELECT USING (agency_id = get_current_agency_id());
CREATE POLICY "Admins can update profiles" ON profiles
    FOR UPDATE USING (agency_id = get_current_agency_id() AND get_current_user_role() = 'admin');

-- Policies for Customers
CREATE POLICY "Agency isolation for customers" ON customers
    FOR ALL USING (agency_id = get_current_agency_id());

-- Policies for Bookings
CREATE POLICY "Agency isolation for bookings" ON bookings
    FOR SELECT USING (agency_id = get_current_agency_id());
CREATE POLICY "Employees and Admins can insert bookings" ON bookings
    FOR INSERT WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Employees and Admins can update bookings" ON bookings
    FOR UPDATE USING (agency_id = get_current_agency_id());
CREATE POLICY "Only Admins can delete bookings" ON bookings
    FOR DELETE USING (agency_id = get_current_agency_id() AND get_current_user_role() = 'admin');

-- Policies for Transactions
CREATE POLICY "Agency isolation for transactions" ON transactions
    FOR SELECT USING (agency_id = get_current_agency_id());
CREATE POLICY "Employees and Admins can insert transactions" ON transactions
    FOR INSERT WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Only Admins can update transactions" ON transactions
    FOR UPDATE USING (agency_id = get_current_agency_id() AND get_current_user_role() = 'admin');
CREATE POLICY "Only Admins can delete transactions" ON transactions
    FOR DELETE USING (agency_id = get_current_agency_id() AND get_current_user_role() = 'admin');

-- Policies for Agency Staff
CREATE POLICY "Agency isolation for staff" ON agency_staff
    FOR ALL USING (agency_id = get_current_agency_id());



-- ==========================================
-- 3. Views for Dashboard (Business Logic)
-- ==========================================

CREATE OR REPLACE VIEW agency_dashboard_stats AS
SELECT 
    agency_id,
    COUNT(DISTINCT id) as total_bookings,
    SUM(selling_price - cost_price) as total_profit,
    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings
FROM bookings
GROUP BY agency_id;
