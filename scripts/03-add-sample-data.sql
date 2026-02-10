-- Add Regulatory Rules for Paint and Solvents programs
-- These rules match the screenshot you provided

-- Paint Site Calculation Rules
INSERT INTO regulatory_rules (
  name, 
  description, 
  program, 
  category, 
  rule_type, 
  parameters, 
  status
) VALUES 
(
  'Paint Sites - Standard Population',
  'One site per 40,000 for 0-500,000 population',
  'Paint',
  'HSP',
  'site_calculation',
  '{
    "minPopulation": 0,
    "maxPopulation": 500000,
    "sitesPerPopulation": 40000,
    "baseRequirement": 1
  }'::jsonb,
  'Active'
),
(
  'Paint Sites - Large Population',
  '13 + one per 150,000 for >500,000 population',
  'Paint',
  'HSP',
  'site_calculation',
  '{
    "minPopulation": 500001,
    "maxPopulation": null,
    "baseRequirement": 13,
    "additionalPerPopulation": 150000
  }'::jsonb,
  'Active'
),
(
  'Paint Sites - Minimum Requirement',
  'At least one site for territories with 1,000+ population',
  'Paint',
  'HSP',
  'minimum_requirement',
  '{
    "minPopulation": 1000,
    "minimumSites": 1
  }'::jsonb,
  'Active'
),
(
  'Paint Events Offset',
  'Events can offset site requirements (up to 35%)',
  'Paint',
  'HSP',
  'offset_limit',
  '{
    "offsetPercentage": 35
  }'::jsonb,
  'Active'
),
(
  'Paint Adjacent Sharing',
  'Adjacent community or upper-tier sharing (up to 10%)',
  'Paint',
  'HSP',
  'sharing_limit',
  '{
    "sharingPercentage": 10
  }'::jsonb,
  'Active'
);

-- Solvents Site Calculation Rules
INSERT INTO regulatory_rules (
  name, 
  description, 
  program, 
  category, 
  rule_type, 
  parameters, 
  status
) VALUES 
(
  'Solvents Sites - Standard Population',
  'One site per 250,000 for 10,000-500,000 population',
  'Solvents',
  'HSP',
  'site_calculation',
  '{
    "minPopulation": 10000,
    "maxPopulation": 500000,
    "sitesPerPopulation": 250000,
    "baseRequirement": 1
  }'::jsonb,
  'Active'
),
(
  'Solvents Sites - Large Population',
  '2 + one per 300,000 for >500,000 population',
  'Solvents',
  'HSP',
  'site_calculation',
  '{
    "minPopulation": 500001,
    "maxPopulation": null,
    "baseRequirement": 2,
    "additionalPerPopulation": 300000
  }'::jsonb,
  'Active'
);

-- Add some sample reallocations
INSERT INTO reallocations (
  site_id,
  from_municipality_id,
  to_municipality_id,
  percentage,
  program,
  reallocation_type,
  rationale,
  status,
  created_by
) 
SELECT 
  cs.id as site_id,
  cs.municipality_id as from_municipality_id,
  (SELECT id FROM municipalities WHERE name = 'Toronto' LIMIT 1) as to_municipality_id,
  15.0 as percentage,
  'Paint' as program,
  'Adjacent Sharing' as reallocation_type,
  'Adjacent community agreement for shared service coverage' as rationale,
  'Approved' as status,
  (SELECT id FROM users WHERE role = 'Admin' LIMIT 1) as created_by
FROM collection_sites cs
WHERE cs.municipality_id != (SELECT id FROM municipalities WHERE name = 'Toronto' LIMIT 1)
LIMIT 3;

-- Verify data was inserted
SELECT 'Regulatory Rules Created: ' || COUNT(*)::text as message FROM regulatory_rules;
SELECT 'Reallocations Created: ' || COUNT(*)::text as message FROM reallocations;
