-- Run this entire script in Supabase SQL Editor to fix the UPDATE and DELETE issues

-- 1. Drop existing policies on profiles temporarily to ensure no cyclic references during function recreation
DROP POLICY IF EXISTS "Users can view profiles in their agency" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to create their own profile" ON profiles;

-- 2. Recreate get_current_agency_id securely with plpgsql to prevent inlining
CREATE OR REPLACE FUNCTION get_current_agency_id()
RETURNS UUID AS
$$
DECLARE
  v_agency_id UUID;
BEGIN
  SELECT agency_id INTO v_agency_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  RETURN v_agency_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- 3. Recreate get_current_user_role securely with plpgsql to prevent inlining
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS
$$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- 4. Recreate profile policies correctly
CREATE POLICY "Users can view profiles in their agency" ON public.profiles
    FOR SELECT USING (agency_id = get_current_agency_id());

CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE USING (agency_id = get_current_agency_id() AND get_current_user_role() = 'admin');
    
CREATE POLICY "Allow users to create their own profile" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- 5. explicitly drop and recreate Customers policies with BOTH using and with check
DROP POLICY IF EXISTS "Agency isolation for customers" ON customers;
CREATE POLICY "Customers SELECT" ON customers FOR SELECT USING (agency_id = get_current_agency_id());
CREATE POLICY "Customers INSERT" ON customers FOR INSERT WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Customers UPDATE" ON customers FOR UPDATE USING (agency_id = get_current_agency_id()) WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Customers DELETE" ON customers FOR DELETE USING (agency_id = get_current_agency_id());

-- 6. explicitly drop and recreate Suppliers policies
DROP POLICY IF EXISTS "Agency isolation for suppliers" ON suppliers;
CREATE POLICY "Suppliers SELECT" ON suppliers FOR SELECT USING (agency_id = get_current_agency_id());
CREATE POLICY "Suppliers INSERT" ON suppliers FOR INSERT WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Suppliers UPDATE" ON suppliers FOR UPDATE USING (agency_id = get_current_agency_id()) WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Suppliers DELETE" ON suppliers FOR DELETE USING (agency_id = get_current_agency_id());

-- 7. explicitly drop and recreate Employees policies
DROP POLICY IF EXISTS "Agency isolation for employees" ON employees;
CREATE POLICY "Employees SELECT" ON employees FOR SELECT USING (agency_id = get_current_agency_id());
CREATE POLICY "Employees INSERT" ON employees FOR INSERT WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Employees UPDATE" ON employees FOR UPDATE USING (agency_id = get_current_agency_id()) WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Employees DELETE" ON employees FOR DELETE USING (agency_id = get_current_agency_id());

-- 8. explicitly drop and recreate Bookings policies
DROP POLICY IF EXISTS "Agency isolation for bookings" ON bookings;
DROP POLICY IF EXISTS "Employees and Admins can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Employees and Admins can update bookings" ON bookings;
DROP POLICY IF EXISTS "Only Admins can delete bookings" ON bookings;
CREATE POLICY "Bookings SELECT" ON bookings FOR SELECT USING (agency_id = get_current_agency_id());
CREATE POLICY "Bookings INSERT" ON bookings FOR INSERT WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Bookings UPDATE" ON bookings FOR UPDATE USING (agency_id = get_current_agency_id()) WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Bookings DELETE" ON bookings FOR DELETE USING (agency_id = get_current_agency_id() AND get_current_user_role() = 'admin');

-- 9. explicitly drop and recreate Transactions policies
DROP POLICY IF EXISTS "Agency isolation for transactions" ON transactions;
DROP POLICY IF EXISTS "Employees and Admins can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Only Admins can update transactions" ON transactions;
DROP POLICY IF EXISTS "Only Admins can delete transactions" ON transactions;
CREATE POLICY "Transactions SELECT" ON transactions FOR SELECT USING (agency_id = get_current_agency_id());
CREATE POLICY "Transactions INSERT" ON transactions FOR INSERT WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Transactions UPDATE" ON transactions FOR UPDATE USING (agency_id = get_current_agency_id() AND get_current_user_role() = 'admin') WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Transactions DELETE" ON transactions FOR DELETE USING (agency_id = get_current_agency_id() AND get_current_user_role() = 'admin');

-- 10. explicitly drop and recreate Staff (agency_staff) policies
DROP POLICY IF EXISTS "Agency isolation for staff" ON agency_staff;
CREATE POLICY "Staff SELECT" ON agency_staff FOR SELECT USING (agency_id = get_current_agency_id());
CREATE POLICY "Staff INSERT" ON agency_staff FOR INSERT WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Staff UPDATE" ON agency_staff FOR UPDATE USING (agency_id = get_current_agency_id()) WITH CHECK (agency_id = get_current_agency_id());
CREATE POLICY "Staff DELETE" ON agency_staff FOR DELETE USING (agency_id = get_current_agency_id());

