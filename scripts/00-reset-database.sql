-- ============================================================================
-- RESET DATABASE SCRIPT
-- This script will DROP ALL TABLES and recreate everything from scratch
-- WARNING: This will DELETE ALL DATA in the database!
-- ============================================================================

-- Drop all tables in reverse dependency order to avoid foreign key constraint issues
-- Using CASCADE to automatically drop dependent objects

-- Drop tables that depend on other tables first
DROP TABLE IF EXISTS event_applications CASCADE;
DROP TABLE IF EXISTS community_offsets CASCADE;
DROP TABLE IF EXISTS direct_service_offsets CASCADE;
DROP TABLE IF EXISTS adjacent_communities CASCADE;
DROP TABLE IF EXISTS census_data_history CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS compliance_calculations CASCADE;
DROP TABLE IF EXISTS reallocations CASCADE;
DROP TABLE IF EXISTS collection_sites CASCADE;
DROP TABLE IF EXISTS regulatory_rules CASCADE;
DROP TABLE IF EXISTS municipalities CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any policies that might exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "All authenticated users can view municipalities" ON municipalities;
DROP POLICY IF EXISTS "Admins and analysts can modify municipalities" ON municipalities;
DROP POLICY IF EXISTS "All authenticated users can view sites" ON collection_sites;
DROP POLICY IF EXISTS "Admins and analysts can modify sites" ON collection_sites;
DROP POLICY IF EXISTS "All authenticated users can view reallocations" ON reallocations;
DROP POLICY IF EXISTS "Admins and analysts can create reallocations" ON reallocations;
DROP POLICY IF EXISTS "Admins can approve reallocations" ON reallocations;
DROP POLICY IF EXISTS "All authenticated users can view compliance data" ON compliance_calculations;
DROP POLICY IF EXISTS "Admins and analysts can modify compliance data" ON compliance_calculations;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;

-- Verify all tables are dropped
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Remaining tables in public schema: %', table_count;
    
    IF table_count > 0 THEN
        RAISE WARNING 'Some tables still exist. Please check manually.';
    ELSE
        RAISE NOTICE 'All tables dropped successfully.';
    END IF;
END $$;

-- Now the database is clean. Run the following scripts in order:
-- 1. 01-create-tables.sql (creates all base tables)
-- 2. 02-seed-data.sql (seeds initial data)
-- 3. 03-create-policies.sql (creates RLS policies)
-- 4. 03-add-sample-data.sql (adds sample regulatory rules and reallocations)
-- 5. 04-create-new-tables.sql (creates additional tables)
-- 6. 05-add-operator-types.sql (adds operator_type column and data)

RAISE NOTICE 'Database reset complete. Please run the numbered scripts in order to recreate tables and seed data.';

