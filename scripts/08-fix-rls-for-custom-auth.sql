-- Fix RLS Policies for Custom Authentication
-- Since this app uses custom auth (localStorage) instead of Supabase Auth,
-- auth.uid() and auth.role() will always be NULL, blocking all queries.
-- This script updates policies to allow reads for all users (auth handled at app level).

-- Drop existing policies that use auth.uid() or auth.role()
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "All authenticated users can view municipalities" ON municipalities;
DROP POLICY IF EXISTS "All authenticated users can view sites" ON collection_sites;
DROP POLICY IF EXISTS "All authenticated users can view reallocations" ON reallocations;
DROP POLICY IF EXISTS "All authenticated users can view compliance data" ON compliance_calculations;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;

-- Create new policies that allow reads for all users
-- (Authentication is handled at the application level via localStorage)

-- Users table: Allow all users to read (app-level auth controls access)
CREATE POLICY "Allow all users to read users table" ON users
  FOR SELECT USING (true);

-- Municipalities table: Allow all users to read
CREATE POLICY "Allow all users to read municipalities" ON municipalities
  FOR SELECT USING (true);

-- Collection sites table: Allow all users to read
CREATE POLICY "Allow all users to read collection sites" ON collection_sites
  FOR SELECT USING (true);

-- Reallocations table: Allow all users to read
CREATE POLICY "Allow all users to read reallocations" ON reallocations
  FOR SELECT USING (true);

-- Compliance calculations table: Allow all users to read
CREATE POLICY "Allow all users to read compliance calculations" ON compliance_calculations
  FOR SELECT USING (true);

-- Audit logs table: Allow all users to read
CREATE POLICY "Allow all users to read audit logs" ON audit_logs
  FOR SELECT USING (true);

-- Regulatory rules table: Allow all users to read
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'regulatory_rules') THEN
    DROP POLICY IF EXISTS "All authenticated users can view regulatory rules" ON regulatory_rules;
    CREATE POLICY "Allow all users to read regulatory rules" ON regulatory_rules
      FOR SELECT USING (true);
  END IF;
END $$;

-- Note: Write operations (INSERT, UPDATE, DELETE) still use the security definer functions
-- which check user roles. These remain unchanged as they work correctly.

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('users', 'municipalities', 'collection_sites', 'reallocations', 'compliance_calculations', 'audit_logs', 'regulatory_rules')
ORDER BY tablename, policyname;

