-- ============================================================================
-- COMPLETE DATABASE RESET AND SEED SCRIPT
-- This script will DROP ALL TABLES and recreate everything from scratch
-- WARNING: This will DELETE ALL DATA in the database!
-- ============================================================================

-- Drop all tables in reverse dependency order to avoid foreign key constraint issues
-- Using CASCADE to automatically drop dependent objects

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

-- Now run all creation and seed scripts
-- This will be done by running the individual scripts in order

RAISE NOTICE 'All tables dropped. Please run the following scripts in order:';
RAISE NOTICE '1. 01-create-tables.sql';
RAISE NOTICE '2. 02-seed-data.sql';
RAISE NOTICE '3. 03-create-policies.sql';
RAISE NOTICE '4. 03-add-sample-data.sql';
RAISE NOTICE '5. 04-create-new-tables.sql';
RAISE NOTICE '6. 05-add-operator-types.sql';

