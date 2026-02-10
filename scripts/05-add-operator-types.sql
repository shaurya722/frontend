-- Add operator_type column to collection_sites table if it doesn't exist
ALTER TABLE collection_sites 
ADD COLUMN IF NOT EXISTS operator_type VARCHAR(100);

-- Create index for operator_type
CREATE INDEX IF NOT EXISTS idx_collection_sites_operator_type ON collection_sites(operator_type);

-- Update existing sites with operator_type based on site_type and name patterns
-- Municipal Depots -> Municipal
UPDATE collection_sites 
SET operator_type = 'Municipal' 
WHERE (site_type LIKE '%Municipal%' OR site_type LIKE '%Depot%')
  AND operator_type IS NULL;

-- Return to Retail sites -> Retailer
UPDATE collection_sites 
SET operator_type = 'Retailer' 
WHERE site_type LIKE '%Retail%'
  AND operator_type IS NULL;

-- Home Depot, Canadian Tire, Rona, Best Buy, Future Shop, The Source, Staples -> Retailer
UPDATE collection_sites 
SET operator_type = 'Retailer' 
WHERE (name LIKE '%Home Depot%' 
   OR name LIKE '%Canadian Tire%' 
   OR name LIKE '%Rona%'
   OR name LIKE '%Best Buy%'
   OR name LIKE '%Future Shop%'
   OR name LIKE '%The Source%'
   OR name LIKE '%Staples%')
  AND operator_type IS NULL;

-- Product Care sites
UPDATE collection_sites 
SET operator_type = 'Product Care' 
WHERE name LIKE '%Product Care%'
  AND operator_type IS NULL;

-- Regional District sites
UPDATE collection_sites 
SET operator_type = 'Regional District' 
WHERE (name LIKE '%Regional District%' OR name LIKE '%Reg. District%')
  AND operator_type IS NULL;

-- First Nation/Indigenous sites
UPDATE collection_sites 
SET operator_type = 'First Nation/Indigenous' 
WHERE (name LIKE '%First Nation%' 
   OR name LIKE '%Indigenous%'
   OR name LIKE '%FN/%')
  AND operator_type IS NULL;

-- Private Depot sites
UPDATE collection_sites 
SET operator_type = 'Private Depot' 
WHERE site_type LIKE '%Private%'
  AND operator_type IS NULL;

-- Distributor sites (if any)
UPDATE collection_sites 
SET operator_type = 'Distributor' 
WHERE name LIKE '%Distributor%'
  AND operator_type IS NULL;

-- Set default to 'Other' for any remaining NULL values
UPDATE collection_sites 
SET operator_type = 'Other' 
WHERE operator_type IS NULL;

-- Now add sample sites with all operator types to ensure we have data for each type
-- This ensures we have at least one site for each operator type

-- Add Retailer sites (if we don't have enough)
INSERT INTO collection_sites (name, address, municipality_id, site_type, programs, population_served, status, latitude, longitude, operator_type, active_dates)
SELECT 
  'Walmart - ' || m.name || ' Collection',
  '123 Main St, ' || m.name || ', ON',
  m.id,
  'Return to Retail',
  ARRAY['Paint', 'Lighting'],
  m.population,
  'Active',
  43.6532 + (RANDOM() * 0.5 - 0.25),
  -79.3832 + (RANDOM() * 0.5 - 0.25),
  'Retailer',
  '[2024-01-01,)'
FROM municipalities m
WHERE m.name IN ('Toronto', 'Ottawa', 'Hamilton')
  AND NOT EXISTS (
    SELECT 1 FROM collection_sites cs 
    WHERE cs.municipality_id = m.id 
    AND cs.operator_type = 'Retailer'
    LIMIT 1
  )
LIMIT 3;

-- Add Distributor sites
INSERT INTO collection_sites (name, address, municipality_id, site_type, programs, population_served, status, latitude, longitude, operator_type, active_dates)
SELECT 
  'ABC Distribution - ' || m.name,
  '456 Industrial Blvd, ' || m.name || ', ON',
  m.id,
  'Collection Site',
  ARRAY['Paint', 'Solvents'],
  m.population,
  'Active',
  43.6532 + (RANDOM() * 0.5 - 0.25),
  -79.3832 + (RANDOM() * 0.5 - 0.25),
  'Distributor',
  '[2024-01-01,)'
FROM municipalities m
WHERE m.name IN ('Mississauga', 'Brampton', 'Markham')
  AND NOT EXISTS (
    SELECT 1 FROM collection_sites cs 
    WHERE cs.municipality_id = m.id 
    AND cs.operator_type = 'Distributor'
    LIMIT 1
  )
LIMIT 3;

-- Add Municipal sites (should already exist, but ensure we have them)
-- These are already covered by the UPDATE above

-- Add First Nation/Indigenous sites
INSERT INTO collection_sites (name, address, municipality_id, site_type, programs, population_served, status, latitude, longitude, operator_type, active_dates)
SELECT 
  'First Nation Collection Centre - ' || m.name,
  '789 Reserve Rd, ' || m.name || ', ON',
  m.id,
  'Collection Site',
  ARRAY['Paint', 'Lighting', 'Pesticides'],
  m.population,
  'Active',
  43.6532 + (RANDOM() * 0.5 - 0.25),
  -79.3832 + (RANDOM() * 0.5 - 0.25),
  'First Nation/Indigenous',
  '[2024-01-01,)'
FROM municipalities m
WHERE m.name IN ('Thunder Bay', 'Sudbury', 'North Bay')
  AND NOT EXISTS (
    SELECT 1 FROM collection_sites cs 
    WHERE cs.municipality_id = m.id 
    AND cs.operator_type = 'First Nation/Indigenous'
    LIMIT 1
  )
LIMIT 3;

-- Add Private Depot sites
INSERT INTO collection_sites (name, address, municipality_id, site_type, programs, population_served, status, latitude, longitude, operator_type, active_dates)
SELECT 
  'Private Waste Depot - ' || m.name,
  '321 Commercial Dr, ' || m.name || ', ON',
  m.id,
  'Private Depot',
  ARRAY['Paint', 'Solvents'],
  m.population,
  'Active',
  43.6532 + (RANDOM() * 0.5 - 0.25),
  -79.3832 + (RANDOM() * 0.5 - 0.25),
  'Private Depot',
  '[2024-01-01,)'
FROM municipalities m
WHERE m.name IN ('London', 'Windsor', 'Kitchener')
  AND NOT EXISTS (
    SELECT 1 FROM collection_sites cs 
    WHERE cs.municipality_id = m.id 
    AND cs.operator_type = 'Private Depot'
    LIMIT 1
  )
LIMIT 3;

-- Add Product Care sites
INSERT INTO collection_sites (name, address, municipality_id, site_type, programs, population_served, status, latitude, longitude, operator_type, active_dates)
SELECT 
  'Product Care Collection Point - ' || m.name,
  '555 Service Rd, ' || m.name || ', ON',
  m.id,
  'Collection Site',
  ARRAY['Paint', 'Lighting', 'Solvents', 'Pesticides'],
  m.population,
  'Active',
  43.6532 + (RANDOM() * 0.5 - 0.25),
  -79.3832 + (RANDOM() * 0.5 - 0.25),
  'Product Care',
  '[2024-01-01,)'
FROM municipalities m
WHERE m.name IN ('Toronto', 'Ottawa', 'Hamilton')
  AND NOT EXISTS (
    SELECT 1 FROM collection_sites cs 
    WHERE cs.municipality_id = m.id 
    AND cs.operator_type = 'Product Care'
    LIMIT 1
  )
LIMIT 3;

-- Add Regional District sites
INSERT INTO collection_sites (name, address, municipality_id, site_type, programs, population_served, status, latitude, longitude, operator_type, active_dates)
SELECT 
  'Regional District Collection - ' || m.name,
  '999 Regional Way, ' || m.name || ', ON',
  m.id,
  'Collection Site',
  ARRAY['Paint', 'Lighting'],
  m.population,
  'Active',
  43.6532 + (RANDOM() * 0.5 - 0.25),
  -79.3832 + (RANDOM() * 0.5 - 0.25),
  'Regional District',
  '[2024-01-01,)'
FROM municipalities m
WHERE m.tier = 'Upper'
  AND NOT EXISTS (
    SELECT 1 FROM collection_sites cs 
    WHERE cs.municipality_id = m.id 
    AND cs.operator_type = 'Regional District'
    LIMIT 1
  )
LIMIT 3;

-- Add Other sites
INSERT INTO collection_sites (name, address, municipality_id, site_type, programs, population_served, status, latitude, longitude, operator_type, active_dates)
SELECT 
  'Community Collection Site - ' || m.name,
  '111 Community Ave, ' || m.name || ', ON',
  m.id,
  'Collection Site',
  ARRAY['Paint'],
  m.population,
  'Active',
  43.6532 + (RANDOM() * 0.5 - 0.25),
  -79.3832 + (RANDOM() * 0.5 - 0.25),
  'Other',
  '[2024-01-01,)'
FROM municipalities m
WHERE m.name IN ('Guelph', 'Kingston', 'Barrie')
  AND NOT EXISTS (
    SELECT 1 FROM collection_sites cs 
    WHERE cs.municipality_id = m.id 
    AND cs.operator_type = 'Other'
    LIMIT 1
  )
LIMIT 3;

-- Verify operator types distribution
SELECT 
  operator_type,
  COUNT(*) as site_count
FROM collection_sites
GROUP BY operator_type
ORDER BY operator_type;

