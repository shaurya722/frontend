-- Fix RLS infinite recursion issue
-- The problem: Policies that check the users table cause infinite recursion
-- Solution: Create a security definer function that bypasses RLS

-- Drop ALL existing policies that cause recursion
-- Drop users table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Drop municipalities table policies
DROP POLICY IF EXISTS "All authenticated users can view municipalities" ON municipalities;
DROP POLICY IF EXISTS "Admins and analysts can modify municipalities" ON municipalities;

-- Drop collection_sites table policies
DROP POLICY IF EXISTS "All authenticated users can view sites" ON collection_sites;
DROP POLICY IF EXISTS "Admins and analysts can modify sites" ON collection_sites;

-- Drop reallocations table policies
DROP POLICY IF EXISTS "All authenticated users can view reallocations" ON reallocations;
DROP POLICY IF EXISTS "Admins and analysts can create reallocations" ON reallocations;
DROP POLICY IF EXISTS "Admins can approve reallocations" ON reallocations;

-- Drop compliance_calculations table policies
DROP POLICY IF EXISTS "All authenticated users can view compliance data" ON compliance_calculations;
DROP POLICY IF EXISTS "Admins and analysts can modify compliance data" ON compliance_calculations;

-- Drop audit_logs table policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;

-- Create a security definer function to check user role without RLS recursion
-- SECURITY DEFINER functions run with the privileges of the function owner (postgres/supabase_admin)
-- which bypasses RLS by default
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS VARCHAR(50)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role VARCHAR(50);
BEGIN
  -- SECURITY DEFINER functions bypass RLS automatically
  -- Query the users table directly without RLS checks
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'Viewer');
END;
$$;

-- Create a function to check if user is admin or analyst
CREATE OR REPLACE FUNCTION is_admin_or_analyst(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role VARCHAR(50);
BEGIN
  -- SECURITY DEFINER functions bypass RLS automatically
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id
  LIMIT 1;
  
  RETURN COALESCE(user_role, '') IN ('Administrator', 'Compliance Analyst');
END;
$$;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role VARCHAR(50);
BEGIN
  -- SECURITY DEFINER functions bypass RLS automatically
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id
  LIMIT 1;
  
  RETURN user_role = 'Administrator';
END;
$$;

-- Recreate policies using the security definer functions
-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (is_admin(auth.uid()));

-- Municipalities table policies
-- Allow all authenticated users to read (no role check to avoid recursion)
CREATE POLICY "All authenticated users can view municipalities" ON municipalities
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only check roles for write operations (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins and analysts can modify municipalities" ON municipalities
  FOR INSERT WITH CHECK (is_admin_or_analyst(auth.uid()));

CREATE POLICY "Admins and analysts can update municipalities" ON municipalities
  FOR UPDATE USING (is_admin_or_analyst(auth.uid()));

CREATE POLICY "Admins and analysts can delete municipalities" ON municipalities
  FOR DELETE USING (is_admin_or_analyst(auth.uid()));

-- Collection sites table policies
-- Allow all authenticated users to read (no role check to avoid recursion)
CREATE POLICY "All authenticated users can view sites" ON collection_sites
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only check roles for write operations (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins and analysts can insert sites" ON collection_sites
  FOR INSERT WITH CHECK (is_admin_or_analyst(auth.uid()));

CREATE POLICY "Admins and analysts can update sites" ON collection_sites
  FOR UPDATE USING (is_admin_or_analyst(auth.uid()));

CREATE POLICY "Admins and analysts can delete sites" ON collection_sites
  FOR DELETE USING (is_admin_or_analyst(auth.uid()));

-- Reallocations table policies
CREATE POLICY "All authenticated users can view reallocations" ON reallocations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can create reallocations" ON reallocations
  FOR INSERT WITH CHECK (is_admin_or_analyst(auth.uid()));

CREATE POLICY "Admins can approve reallocations" ON reallocations
  FOR UPDATE USING (is_admin(auth.uid()));

-- Compliance calculations table policies
CREATE POLICY "All authenticated users can view compliance data" ON compliance_calculations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can insert compliance data" ON compliance_calculations
  FOR INSERT WITH CHECK (is_admin_or_analyst(auth.uid()));

CREATE POLICY "Admins and analysts can update compliance data" ON compliance_calculations
  FOR UPDATE USING (is_admin_or_analyst(auth.uid()));

CREATE POLICY "Admins and analysts can delete compliance data" ON compliance_calculations
  FOR DELETE USING (is_admin_or_analyst(auth.uid()));

-- Audit logs table policies
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- Regulatory rules policies (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'regulatory_rules') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "All authenticated users can view regulatory rules" ON regulatory_rules;
    DROP POLICY IF EXISTS "Admins and analysts can modify regulatory rules" ON regulatory_rules;
    
    -- Create new policies
    CREATE POLICY "All authenticated users can view regulatory rules" ON regulatory_rules
      FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Admins and analysts can modify regulatory rules" ON regulatory_rules
      FOR ALL USING (is_admin_or_analyst(auth.uid()));
  END IF;
END $$;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_analyst(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;

