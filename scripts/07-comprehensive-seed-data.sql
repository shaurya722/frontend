-- Comprehensive Seed Data for ArcGIS Compliance System
-- This script provides extensive data for all features of the application
-- Run this after creating tables and fixing RLS policies

-- ============================================================================
-- 1. USERS - Multiple users with different roles
-- ============================================================================
INSERT INTO users (username, email, password_hash, name, role, is_active, created_at, updated_at, last_login) VALUES
('admin', 'admin@arcgis-compliance.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'John Cardella', 'Administrator', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00', '2024-01-20 14:30:00'),
('analyst', 'analyst@arcgis-compliance.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Sarah Wilson', 'Compliance Analyst', true, '2024-01-16 09:00:00', '2024-01-16 09:00:00', '2024-01-19 16:45:00'),
('analyst2', 'analyst2@arcgis-compliance.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Michael Chen', 'Compliance Analyst', true, '2024-01-17 08:00:00', '2024-01-17 08:00:00', '2024-01-20 09:15:00'),
('viewer', 'viewer@arcgis-compliance.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Mike Johnson', 'Viewer', true, '2024-01-17 11:00:00', '2024-01-17 11:00:00', '2024-01-18 13:20:00'),
('viewer2', 'viewer2@arcgis-compliance.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Emily Davis', 'Viewer', true, '2024-01-18 10:00:00', '2024-01-18 10:00:00', '2024-01-19 11:30:00'),
('pending_user', 'newuser@municipality.ca', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Jennifer Smith', 'Compliance Analyst', false, '2024-01-19 15:00:00', '2024-01-19 15:00:00', NULL),
('inactive_user', 'olduser@consultant.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Robert Brown', 'Viewer', false, '2023-12-01 10:00:00', '2024-01-10 10:00:00', '2023-12-15 10:00:00')
ON CONFLICT (username) DO NOTHING;

-- ============================================================================ 
-- 2. MUNICIPALITIES - Comprehensive list of Ontario municipalities
-- ============================================================================
INSERT INTO municipalities (name, population, tier, region, province) VALUES
-- Major Cities (Single Tier)
('Toronto', 2794356, 'Single', 'GTA', 'Ontario'),
('Ottawa', 994837, 'Single', 'Ottawa', 'Ontario'),
('Hamilton', 536917, 'Single', 'Hamilton', 'Ontario'),
('London', 422324, 'Single', 'London', 'Ontario'),
('Windsor', 229660, 'Single', 'Windsor-Essex', 'Ontario'),
('Sudbury', 166004, 'Single', 'Sudbury', 'Ontario'),
('Kingston', 123798, 'Single', 'Kingston', 'Ontario'),
('Guelph', 131794, 'Single', 'Guelph', 'Ontario'),
('Thunder Bay', 107909, 'Single', 'Thunder Bay', 'Ontario'),
('Brantford', 104688, 'Single', 'Brant', 'Ontario'),
('Barrie', 147829, 'Single', 'Simcoe', 'Ontario'),
('Peterborough', 81032, 'Single', 'Peterborough', 'Ontario'),
('Sarnia', 71594, 'Single', 'Lambton', 'Ontario'),
('Sault Ste. Marie', 73368, 'Single', 'Algoma', 'Ontario'),
('North Bay', 51553, 'Single', 'Nipissing', 'Ontario'),
('Belleville', 50716, 'Single', 'Hastings', 'Ontario'),
('Cornwall', 47845, 'Single', 'Stormont', 'Ontario'),
('Chatham-Kent', 103988, 'Single', 'Chatham-Kent', 'Ontario'),
('Kawartha Lakes', 75423, 'Single', 'Kawartha Lakes', 'Ontario'),

-- Regional Municipalities (Upper Tier)
('York Region', 1109909, 'Upper', 'York', 'Ontario'),
('Peel Region', 1381739, 'Upper', 'Peel', 'Ontario'),
('Halton Region', 548435, 'Upper', 'Halton', 'Ontario'),
('Durham Region', 645862, 'Upper', 'Durham', 'Ontario'),
('Waterloo Region', 535154, 'Upper', 'Waterloo', 'Ontario'),
('Niagara Region', 447888, 'Upper', 'Niagara', 'Ontario'),
('Simcoe County', 479650, 'Upper', 'Simcoe', 'Ontario'),
('Muskoka', 60599, 'Upper', 'Muskoka', 'Ontario'),

-- Lower Tier Municipalities in Peel
('Mississauga', 717961, 'Lower', 'Peel', 'Ontario'),
('Brampton', 656480, 'Lower', 'Peel', 'Ontario'),
('Caledon', 66502, 'Lower', 'Peel', 'Ontario'),

-- Lower Tier Municipalities in York
('Markham', 338503, 'Lower', 'York', 'Ontario'),
('Vaughan', 323103, 'Lower', 'York', 'Ontario'),
('Richmond Hill', 195022, 'Lower', 'York', 'Ontario'),
('Newmarket', 87942, 'Lower', 'York', 'Ontario'),
('Aurora', 62057, 'Lower', 'York', 'Ontario'),
('Whitchurch-Stouffville', 49864, 'Lower', 'York', 'Ontario'),
('King', 27333, 'Lower', 'York', 'Ontario'),
('East Gwillimbury', 24072, 'Lower', 'York', 'Ontario'),
('Georgina', 48810, 'Lower', 'York', 'Ontario'),

-- Lower Tier Municipalities in Halton
('Oakville', 193832, 'Lower', 'Halton', 'Ontario'),
('Burlington', 183314, 'Lower', 'Halton', 'Ontario'),
('Milton', 132979, 'Lower', 'Halton', 'Ontario'),
('Halton Hills', 61161, 'Lower', 'Halton', 'Ontario'),

-- Lower Tier Municipalities in Durham
('Oshawa', 166000, 'Lower', 'Durham', 'Ontario'),
('Whitby', 128377, 'Lower', 'Durham', 'Ontario'),
('Pickering', 91771, 'Lower', 'Durham', 'Ontario'),
('Ajax', 119677, 'Lower', 'Durham', 'Ontario'),
('Clarington', 92013, 'Lower', 'Durham', 'Ontario'),
('Scugog', 22559, 'Lower', 'Durham', 'Ontario'),
('Uxbridge', 21176, 'Lower', 'Durham', 'Ontario'),
('Brock', 11642, 'Lower', 'Durham', 'Ontario'),

-- Lower Tier Municipalities in Waterloo
('Kitchener', 256885, 'Lower', 'Waterloo', 'Ontario'),
('Cambridge', 129920, 'Lower', 'Waterloo', 'Ontario'),
('Waterloo', 104986, 'Lower', 'Waterloo', 'Ontario'),
('North Dumfries', 10424, 'Lower', 'Waterloo', 'Ontario'),
('Wellesley', 11260, 'Lower', 'Waterloo', 'Ontario'),
('Wilmot', 21054, 'Lower', 'Waterloo', 'Ontario'),
('Woolwich', 26999, 'Lower', 'Waterloo', 'Ontario'),

-- Lower Tier Municipalities in Niagara
('St. Catharines', 133113, 'Lower', 'Niagara', 'Ontario'),
('Niagara Falls', 88071, 'Lower', 'Niagara', 'Ontario'),
('Welland', 52293, 'Lower', 'Niagara', 'Ontario'),
('Thorold', 18801, 'Lower', 'Niagara', 'Ontario'),
('Port Colborne', 18306, 'Lower', 'Niagara', 'Ontario'),
('Fort Erie', 30710, 'Lower', 'Niagara', 'Ontario'),
('Lincoln', 24722, 'Lower', 'Niagara', 'Ontario'),
('Pelham', 17110, 'Lower', 'Niagara', 'Ontario'),
('Grimsby', 27314, 'Lower', 'Niagara', 'Ontario'),
('West Lincoln', 14500, 'Lower', 'Niagara', 'Ontario'),
('Wainfleet', 6372, 'Lower', 'Niagara', 'Ontario'),
('Niagara-on-the-Lake', 17511, 'Lower', 'Niagara', 'Ontario'),

-- Single Tier Counties
('Haldimand County', 45608, 'Single', 'Haldimand-Norfolk', 'Ontario'),
('Norfolk County', 64044, 'Single', 'Haldimand-Norfolk', 'Ontario'),
('Prince Edward County', 24735, 'Single', 'Prince Edward', 'Ontario'),
('Brant County', 36707, 'Single', 'Brant', 'Ontario'),
('Elgin County', 88978, 'Single', 'Elgin', 'Ontario'),
('Essex County', 398953, 'Single', 'Windsor-Essex', 'Ontario'),
('Lambton County', 126199, 'Single', 'Lambton', 'Ontario'),
('Middlesex County', 473157, 'Single', 'London', 'Ontario'),

-- Northern Ontario Municipalities
('Timmins', 41788, 'Single', 'Cochrane', 'Ontario'),
('Greater Sudbury', 166004, 'Single', 'Sudbury', 'Ontario'),
('Kenora', 15096, 'Single', 'Kenora', 'Ontario'),
('Dryden', 7749, 'Single', 'Kenora', 'Ontario'),
('Elliot Lake', 10741, 'Single', 'Algoma', 'Ontario'),
('Temiskaming Shores', 9634, 'Single', 'Temiskaming', 'Ontario'),

-- First Nation Communities (for testing First Nation/Indigenous operator type)
('Six Nations of the Grand River', 12500, 'Single', 'Brant', 'Ontario'),
('Mississaugas of the Credit First Nation', 2800, 'Single', 'Peel', 'Ontario'),
('Chippewas of Rama First Nation', 1800, 'Single', 'Simcoe', 'Ontario')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. COLLECTION SITES - Comprehensive data with all operator types, statuses, and programs
-- ============================================================================
WITH municipality_ids AS (
  SELECT id, name FROM municipalities
),
user_ids AS (
  SELECT id FROM users WHERE role = 'Administrator' LIMIT 1
)
INSERT INTO collection_sites (name, address, municipality_id, site_type, programs, population_served, status, latitude, longitude, active_dates, operator_type, created_by)
SELECT 
  site_data.name,
  site_data.address,
  m.id,
  site_data.site_type,
  site_data.programs,
  site_data.population_served,
  site_data.status,
  site_data.latitude,
  site_data.longitude,
  CASE 
    WHEN site_data.active_end_date IS NULL THEN 
      daterange(site_data.active_start_date::date, NULL, '[)')
    ELSE 
      daterange(site_data.active_start_date::date, site_data.active_end_date::date, '[)')
  END as active_dates,
  site_data.operator_type,
  (SELECT id FROM user_ids LIMIT 1)
FROM (
  VALUES
    -- ===== MUNICIPAL OPERATOR TYPE =====
    ('Toronto Municipal Depot - North York', '5100 Yonge St, North York, ON M2N 5V7', 'Toronto', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 2794356, 'Active', 43.7615, -79.4111, '2020-01-01', NULL, 'Municipal'),
    ('Toronto Municipal Depot - Scarborough', '1900 Ellesmere Rd, Scarborough, ON M1H 2V1', 'Toronto', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Pesticides'], 2794356, 'Active', 43.7735, -79.2663, '2020-01-01', NULL, 'Municipal'),
    ('Toronto Municipal Depot - Etobicoke', '399 The West Mall, Etobicoke, ON M9C 2Y2', 'Toronto', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 2794356, 'Active', 43.6426, -79.5481, '2020-01-01', NULL, 'Municipal'),
    ('Ottawa Municipal Depot - Trail Road', '3904 Innes Rd, Ottawa, ON K1W 1K7', 'Ottawa', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 994837, 'Active', 45.4215, -75.6219, '2020-01-01', NULL, 'Municipal'),
    ('Hamilton Municipal Depot', '1211 Woodward Ave, Hamilton, ON L8H 7P1', 'Hamilton', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 536917, 'Active', 43.2557, -79.8711, '2020-01-01', NULL, 'Municipal'),
    ('London Environmental Depot', '1485 Hargreaves Rd, London, ON N6E 1P5', 'London', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 422324, 'Active', 42.9849, -81.2453, '2020-01-01', NULL, 'Municipal'),
    ('Mississauga Depot - Heartland', '7171 Torbram Rd, Mississauga, ON L4T 3W4', 'Mississauga', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 717961, 'Active', 43.5890, -79.6441, '2020-01-01', NULL, 'Municipal'),
    ('Brampton Waste Depot', '2185 Williams Pkwy, Brampton, ON L6S 5V4', 'Brampton', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 656480, 'Active', 43.7315, -79.7624, '2020-01-01', NULL, 'Municipal'),
    ('Kitchener Waste Depot', '925 Frederick St, Kitchener, ON N2B 2B3', 'Kitchener', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 256885, 'Active', 43.4516, -80.4925, '2020-01-01', NULL, 'Municipal'),
    ('Windsor Environmental Depot', '3540 North Service Rd E, Windsor, ON N8W 5X7', 'Windsor', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 229660, 'Active', 42.3149, -83.0364, '2020-01-01', NULL, 'Municipal'),
    
    -- ===== RETAILER OPERATOR TYPE =====
    ('Home Depot - Toronto Downtown', '50 Canoe Landing Blvd, Toronto, ON M5V 3S8', 'Toronto', 'Return to Retail', ARRAY['Paint'], 2794356, 'Active', 43.6426, -79.3871, '2019-06-01', NULL, 'Retailer'),
    ('Canadian Tire - Toronto East', '1405 Victoria Park Ave, Toronto, ON M4A 2L8', 'Toronto', 'Return to Retail', ARRAY['Paint'], 2794356, 'Active', 43.6896, -79.2958, '2019-01-01', NULL, 'Retailer'),
    ('Rona - Toronto West', '2300 Dundas St W, Toronto, ON M6P 4B2', 'Toronto', 'Return to Retail', ARRAY['Paint'], 2794356, 'Active', 43.6532, -79.4481, '2019-01-01', NULL, 'Retailer'),
    ('Home Depot - Mississauga', '6677 Meadowvale Town Centre Cir, Mississauga, ON L5N 2V4', 'Mississauga', 'Return to Retail', ARRAY['Paint'], 717961, 'Active', 43.5890, -79.7330, '2019-01-01', NULL, 'Retailer'),
    ('Canadian Tire - Square One', '100 City Centre Dr, Mississauga, ON L5B 2C9', 'Mississauga', 'Return to Retail', ARRAY['Paint'], 717961, 'Active', 43.5890, -79.6441, '2019-01-01', NULL, 'Retailer'),
    ('Home Depot - Hamilton Mountain', '1550 Upper James St, Hamilton, ON L9B 2L6', 'Hamilton', 'Return to Retail', ARRAY['Paint'], 536917, 'Active', 43.2557, -79.8711, '2019-01-01', NULL, 'Retailer'),
    ('Canadian Tire - Hamilton', '1240 Barton St E, Hamilton, ON L8H 2V4', 'Hamilton', 'Return to Retail', ARRAY['Paint'], 536917, 'Active', 43.2557, -79.8711, '2019-01-01', NULL, 'Retailer'),
    ('Home Depot - London North', '1205 Oxford St W, London, ON N6H 1V1', 'London', 'Return to Retail', ARRAY['Paint'], 422324, 'Active', 42.9849, -81.2453, '2019-01-01', NULL, 'Retailer'),
    ('Canadian Tire - London South', '1280 Commissioners Rd W, London, ON N6K 1C7', 'London', 'Return to Retail', ARRAY['Paint'], 422324, 'Active', 42.9849, -81.2453, '2019-01-01', NULL, 'Retailer'),
    ('Home Depot - Kitchener', '2960 Kingsway Dr, Kitchener, ON N2C 1X1', 'Kitchener', 'Return to Retail', ARRAY['Paint'], 256885, 'Active', 43.4516, -80.4925, '2019-01-01', NULL, 'Retailer'),
    ('Canadian Tire - Kitchener', '1405 Victoria St N, Kitchener, ON N2B 3E2', 'Kitchener', 'Return to Retail', ARRAY['Paint'], 256885, 'Active', 43.4516, -80.4925, '2019-01-01', NULL, 'Retailer'),
    ('Home Depot - Windsor', '4371 Walker Rd, Windsor, ON N9G 1R1', 'Windsor', 'Return to Retail', ARRAY['Paint'], 229660, 'Active', 42.3149, -83.0364, '2019-01-01', NULL, 'Retailer'),
    ('Home Depot - Vaughan', '3555 Major Mackenzie Dr W, Vaughan, ON L4H 4C3', 'Vaughan', 'Return to Retail', ARRAY['Paint'], 323103, 'Active', 43.8361, -79.5083, '2019-01-01', NULL, 'Retailer'),
    ('Home Depot - Markham', '15 Riocan Ave, Markham, ON L3R 0G1', 'Markham', 'Return to Retail', ARRAY['Paint'], 338503, 'Active', 43.8561, -79.3370, '2019-01-01', NULL, 'Retailer'),
    ('Home Depot - Brampton', '50 Great Lakes Dr, Brampton, ON L6R 2K7', 'Brampton', 'Return to Retail', ARRAY['Paint'], 656480, 'Active', 43.7315, -79.7624, '2019-01-01', NULL, 'Retailer'),
    
    -- ===== LIGHTING RETAILERS =====
    ('Best Buy - Toronto Yonge', '2200 Yonge St, Toronto, ON M4S 2C6', 'Toronto', 'Return to Retail', ARRAY['Lighting'], 2794356, 'Active', 43.7048, -79.3971, '2018-01-01', NULL, 'Retailer'),
    ('The Source - Toronto', '777 Bay St, Toronto, ON M5G 2C8', 'Toronto', 'Return to Retail', ARRAY['Lighting'], 2794356, 'Active', 43.6577, -79.3788, '2018-01-01', NULL, 'Retailer'),
    ('Best Buy - Mississauga', '3045 Mavis Rd, Mississauga, ON L5C 1T8', 'Mississauga', 'Return to Retail', ARRAY['Lighting'], 717961, 'Active', 43.5890, -79.6441, '2018-01-01', NULL, 'Retailer'),
    ('Best Buy - Ottawa', '2210 Bank St, Ottawa, ON K1V 1J5', 'Ottawa', 'Return to Retail', ARRAY['Lighting'], 994837, 'Active', 45.3656, -75.6972, '2018-01-01', NULL, 'Retailer'),
    ('Best Buy - London', '1680 Richmond St, London, ON N6G 3Y9', 'London', 'Return to Retail', ARRAY['Lighting'], 422324, 'Active', 42.9849, -81.2453, '2018-01-01', NULL, 'Retailer'),
    ('Best Buy - Markham', '4861 Highway 7, Markham, ON L3R 1N1', 'Markham', 'Return to Retail', ARRAY['Lighting'], 338503, 'Active', 43.8561, -79.3370, '2018-01-01', NULL, 'Retailer'),
    ('Best Buy - Richmond Hill', '9350 Yonge St, Richmond Hill, ON L4C 5G2', 'Richmond Hill', 'Return to Retail', ARRAY['Lighting'], 195022, 'Active', 43.8561, -79.4270, '2018-01-01', NULL, 'Retailer'),
    ('Staples - Guelph', '435 Stone Rd W, Guelph, ON N1G 2X6', 'Guelph', 'Return to Retail', ARRAY['Lighting'], 131794, 'Active', 43.5448, -80.2482, '2018-01-01', NULL, 'Retailer'),
    
    -- ===== DISTRIBUTOR OPERATOR TYPE =====
    ('ABC Distribution Centre - Toronto', '1500 Matheson Blvd E, Mississauga, ON L4W 1G8', 'Mississauga', 'Private Depot', ARRAY['Paint', 'Solvents'], 717961, 'Active', 43.5890, -79.6441, '2021-01-01', NULL, 'Distributor'),
    ('XYZ Wholesale Distribution', '2000 Argentia Rd, Mississauga, ON L5N 1P7', 'Mississauga', 'Private Depot', ARRAY['Paint', 'Lighting'], 717961, 'Active', 43.5890, -79.7330, '2021-03-01', NULL, 'Distributor'),
    ('Northern Distributors Ltd', '500 Industrial Dr, Barrie, ON L4M 4Y7', 'Barrie', 'Private Depot', ARRAY['Paint'], 147829, 'Active', 44.3894, -79.6903, '2021-05-01', NULL, 'Distributor'),
    
    -- ===== FIRST NATION/INDIGENOUS OPERATOR TYPE =====
    ('Six Nations Collection Centre', '1695 Chiefswood Rd, Ohsweken, ON N0A 1M0', 'Six Nations of the Grand River', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 12500, 'Active', 43.0694, -80.1178, '2020-01-01', NULL, 'First Nation/Indigenous'),
    ('Mississaugas of the Credit Depot', '2789 Mississauga Rd, Hagersville, ON N0A 1H0', 'Mississaugas of the Credit First Nation', 'Municipal Depot', ARRAY['Paint'], 2800, 'Active', 43.2167, -80.0167, '2020-06-01', NULL, 'First Nation/Indigenous'),
    ('Chippewas of Rama Collection Site', '5884 Rama Rd, Rama, ON L3V 6H6', 'Chippewas of Rama First Nation', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 1800, 'Active', 44.5667, -79.3333, '2021-01-01', NULL, 'First Nation/Indigenous'),
    
    -- ===== PRIVATE DEPOT OPERATOR TYPE =====
    ('Green Waste Solutions - Toronto', '1000 Eastern Ave, Toronto, ON M4L 1A8', 'Toronto', 'Private Depot', ARRAY['Paint', 'Solvents', 'Pesticides'], 2794356, 'Active', 43.6617, -79.3406, '2020-01-01', NULL, 'Private Depot'),
    ('EcoDepot Services - Hamilton', '800 Burlington St E, Hamilton, ON L8L 4L3', 'Hamilton', 'Private Depot', ARRAY['Paint', 'Solvents'], 536917, 'Active', 43.2557, -79.8711, '2020-03-01', NULL, 'Private Depot'),
    ('Safe Disposal Inc - London', '1500 Clarke Rd, London, ON N5V 3B4', 'London', 'Private Depot', ARRAY['Paint', 'Pesticides'], 422324, 'Active', 42.9849, -81.2453, '2020-05-01', NULL, 'Private Depot'),
    
    -- ===== PRODUCT CARE OPERATOR TYPE =====
    ('Product Care Collection - Toronto', '2500 Dufferin St, Toronto, ON M6B 3R1', 'Toronto', 'Private Depot', ARRAY['Paint', 'Lighting'], 2794356, 'Active', 43.7000, -79.4500, '2019-01-01', NULL, 'Product Care'),
    ('Product Care - Ottawa', '1800 Merivale Rd, Ottawa, ON K2G 1N1', 'Ottawa', 'Private Depot', ARRAY['Paint', 'Lighting'], 994837, 'Active', 45.3656, -75.6972, '2019-03-01', NULL, 'Product Care'),
    ('Product Care - Mississauga', '3000 Argentia Rd, Mississauga, ON L5N 8G4', 'Mississauga', 'Private Depot', ARRAY['Paint', 'Lighting'], 717961, 'Active', 43.5890, -79.6441, '2019-05-01', NULL, 'Product Care'),
    
    -- ===== REGIONAL DISTRICT OPERATOR TYPE =====
    ('York Region Waste Depot', '1300 Bloomington Rd E, Aurora, ON L4G 0G1', 'York Region', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 1109909, 'Active', 44.0089, -79.4656, '2020-01-01', NULL, 'Regional District'),
    ('Peel Region Environmental Centre', '1050 Clark Blvd, Brampton, ON L6T 4Y3', 'Peel Region', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 1381739, 'Active', 43.7315, -79.7624, '2020-01-01', NULL, 'Regional District'),
    ('Durham Region Waste Management', '1200 Ritson Rd N, Oshawa, ON L1H 7K4', 'Durham Region', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 645862, 'Active', 43.8971, -78.8658, '2020-01-01', NULL, 'Regional District'),
    ('Waterloo Region Collection Centre', '925 Erb St W, Waterloo, ON N2J 3Z4', 'Waterloo Region', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 535154, 'Active', 43.4643, -80.5204, '2020-01-01', NULL, 'Regional District'),
    ('Niagara Region Depot', '3200 Seaway Dr, Welland, ON L3B 5N4', 'Niagara Region', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 447888, 'Active', 42.9918, -79.2648, '2020-01-01', NULL, 'Regional District'),
    
    -- ===== OTHER OPERATOR TYPE =====
    ('Toronto Hazardous Waste Event - Spring', 'Exhibition Place, 210 Princes Blvd, Toronto, ON M6K 3C3', 'Toronto', 'Event', ARRAY['Paint', 'Solvents', 'Pesticides'], 2794356, 'Scheduled', 43.6426, -79.4194, '2024-04-15', '2024-04-15', 'Other'),
    ('Toronto Hazardous Waste Event - Fall', 'Downsview Park, 70 Canuck Ave, Toronto, ON M3K 2C5', 'Toronto', 'Event', ARRAY['Paint', 'Solvents', 'Pesticides'], 2794356, 'Scheduled', 43.7420, -79.4680, '2024-09-21', '2024-09-21', 'Other'),
    ('Ottawa Spring Clean Event', 'Lansdowne Park, 1015 Bank St, Ottawa, ON K1S 3W7', 'Ottawa', 'Event', ARRAY['Paint', 'Solvents'], 994837, 'Scheduled', 45.3656, -75.6972, '2024-05-11', '2024-05-11', 'Other'),
    ('Hamilton Hazmat Collection Event', 'Gage Park, 1000 Gage Ave N, Hamilton, ON L8L 8A2', 'Hamilton', 'Event', ARRAY['Paint', 'Pesticides'], 536917, 'Scheduled', 43.2557, -79.8711, '2024-06-08', '2024-06-08', 'Other'),
    ('Vaughan Mobile Collection Unit', '2141 Major Mackenzie Dr, Vaughan, ON L6A 1T1', 'Vaughan', 'Mobile Collection', ARRAY['Paint', 'Solvents'], 323103, 'Scheduled', 43.8361, -79.5083, '2024-03-01', '2024-11-30', 'Other'),
    ('Muskoka Mobile Collection', 'Various Locations, Muskoka, ON', 'Muskoka', 'Mobile Collection', ARRAY['Paint', 'Lighting'], 60599, 'Scheduled', 45.0389, -79.4956, '2024-05-01', '2024-10-31', 'Other'),
    ('Simcoe County Hazmat Event', 'County Administration Centre, 1110 Highway 26, Midhurst, ON L9X 1N6', 'Simcoe County', 'Event', ARRAY['Paint', 'Solvents'], 479650, 'Scheduled', 44.7228, -79.7892, '2024-08-17', '2024-08-17', 'Other'),
    ('Markham Hazmat Event Site', '5800 14th Ave, Markham, ON L3S 4K4', 'Markham', 'Event', ARRAY['Lighting', 'Paint'], 338503, 'Pending', 43.8561, -79.3370, '2024-07-20', '2024-07-20', 'Other'),
    ('Burlington Spring Event', 'Central Park, 2185 New St, Burlington, ON L7R 1J4', 'Burlington', 'Event', ARRAY['Paint', 'Pesticides'], 183314, 'Scheduled', 43.3255, -79.7990, '2024-05-25', '2024-05-25', 'Other'),
    ('Oshawa Mobile Unit', 'Civic Recreation Complex, 99 Thornton Rd S, Oshawa, ON L1J 5Y1', 'Oshawa', 'Mobile Collection', ARRAY['Paint'], 166000, 'Scheduled', 43.8971, -78.8658, '2024-06-01', '2024-09-30', 'Other'),
    
    -- ===== SCHEDULED STATUS SITES =====
    ('Oakville Seasonal Depot', '1151 Bronte Rd, Oakville, ON L6M 3L1', 'Oakville', 'Seasonal Depot', ARRAY['Paint', 'Lighting'], 193832, 'Scheduled', 43.4675, -79.7624, '2024-04-01', '2024-10-31', 'Municipal'),
    ('St. Catharines Depot', '115 Niagara St, St. Catharines, ON L2R 4L3', 'St. Catharines', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 133113, 'Scheduled', 43.1594, -79.2469, '2024-06-01', NULL, 'Municipal'),
    
    -- ===== PENDING STATUS SITES =====
    ('Cambridge Waste Centre - Pending', '250 Savage Dr, Cambridge, ON N3H 4R7', 'Cambridge', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 129920, 'Pending', 43.3616, -80.3144, '2024-07-01', NULL, 'Municipal'),
    ('Waterloo Environmental Depot - Pending', '925 Erb St W, Waterloo, ON N2J 3Z4', 'Waterloo', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 104986, 'Pending', 43.4643, -80.5204, '2024-08-01', NULL, 'Municipal'),
    
    -- ===== INACTIVE STATUS SITES =====
    ('Former Toronto Depot - Downsview', '1000 Sheppard Ave W, Toronto, ON M3K 3N1', 'Toronto', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 2794356, 'Inactive', 43.7420, -79.4680, '2018-01-01', '2023-12-31', 'Municipal'),
    ('Closed Hamilton Site', '500 Main St E, Hamilton, ON L8N 1K7', 'Hamilton', 'Municipal Depot', ARRAY['Paint'], 536917, 'Inactive', 43.2557, -79.8711, '2017-01-01', '2022-06-30', 'Municipal'),
    ('Decommissioned London Depot', '1200 Oxford St E, London, ON N5Y 3L7', 'London', 'Municipal Depot', ARRAY['Paint', 'Solvents'], 422324, 'Inactive', 42.9849, -81.1453, '2016-01-01', '2021-12-31', 'Municipal'),
    
    -- ===== ADDITIONAL SITES FOR COMPREHENSIVE COVERAGE =====
    ('Guelph Environmental Services', '1 Shire St, Guelph, ON N1E 6N5', 'Guelph', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 131794, 'Active', 43.5448, -80.2482, '2020-01-01', NULL, 'Municipal'),
    ('Kingston Waste Depot', '1840 Highway 15, Kingston, ON K7L 5H6', 'Kingston', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 123798, 'Active', 44.2312, -76.4860, '2020-01-01', NULL, 'Municipal'),
    ('Barrie Environmental Centre', '165 Ferndale Dr S, Barrie, ON L4N 9V9', 'Barrie', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 147829, 'Active', 44.3894, -79.6903, '2020-01-01', NULL, 'Municipal'),
    ('Thunder Bay Waste Facility', '1100 Memorial Ave, Thunder Bay, ON P7B 4A3', 'Thunder Bay', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 107909, 'Active', 48.3809, -89.2477, '2020-01-01', NULL, 'Municipal'),
    ('Sudbury Environmental Services', '1349 Riverside Dr, Sudbury, ON P3E 6C7', 'Sudbury', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 166004, 'Active', 46.4917, -80.9930, '2020-01-01', NULL, 'Municipal'),
    ('Brantford Hazmat Centre', '500 Park Rd N, Brantford, ON N3R 7K8', 'Brantford', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 104688, 'Active', 43.1393, -80.2644, '2020-01-01', NULL, 'Municipal'),
    ('Pickering Environmental Services', '1867 Valley Farm Rd, Pickering, ON L1V 3B2', 'Pickering', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 91771, 'Active', 43.8354, -79.0849, '2020-01-01', NULL, 'Municipal'),
    ('Niagara Falls Depot', '5570 Stanley Ave, Niagara Falls, ON L2G 3X4', 'Niagara Falls', 'Municipal Depot', ARRAY['Paint'], 88071, 'Active', 43.0896, -79.0849, '2020-01-01', NULL, 'Municipal'),
    ('Peterborough Waste Centre', '935 Armour Rd, Peterborough, ON K9H 7L6', 'Peterborough', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 81032, 'Active', 44.3091, -78.3197, '2020-01-01', NULL, 'Municipal'),
    ('Sarnia Environmental Services', '1455 London Rd, Sarnia, ON N7S 6K5', 'Sarnia', 'Municipal Depot', ARRAY['Paint'], 71594, 'Active', 42.9849, -82.4066, '2020-01-01', NULL, 'Municipal'),
    ('Sault Ste. Marie Depot', '2225 Great Northern Rd, Sault Ste. Marie, ON P6B 4Z9', 'Sault Ste. Marie', 'Municipal Depot', ARRAY['Paint'], 73368, 'Active', 46.5197, -84.3421, '2020-01-01', NULL, 'Municipal'),
    ('Welland Waste Facility', '145 Lincoln St, Welland, ON L3B 6E1', 'Welland', 'Municipal Depot', ARRAY['Paint'], 52293, 'Active', 42.9918, -79.2648, '2020-01-01', NULL, 'Municipal'),
    ('North Bay Environmental Centre', '1500 Fisher St, North Bay, ON P1B 2H3', 'North Bay', 'Municipal Depot', ARRAY['Paint'], 51553, 'Active', 46.3091, -79.4608, '2020-01-01', NULL, 'Municipal'),
    ('Belleville Hazmat Depot', '200 Cannifton Rd, Belleville, ON K8N 4K8', 'Belleville', 'Municipal Depot', ARRAY['Paint'], 50716, 'Active', 44.1628, -77.3832, '2020-01-01', NULL, 'Municipal'),
    ('Cornwall Waste Centre', '1225 Boundary Rd, Cornwall, ON K6H 7B1', 'Cornwall', 'Municipal Depot', ARRAY['Paint'], 47845, 'Active', 45.0212, -74.7307, '2020-01-01', NULL, 'Municipal'),
    ('Chatham-Kent Environmental Services', '315 Grand Ave W, Chatham, ON N7M 5L8', 'Chatham-Kent', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 103988, 'Active', 42.4048, -82.1910, '2020-01-01', NULL, 'Municipal'),
    ('Kawartha Lakes Depot', '322 Kent St W, Lindsay, ON K9V 2Z7', 'Kawartha Lakes', 'Municipal Depot', ARRAY['Paint'], 75423, 'Active', 44.3583, -78.7350, '2020-01-01', NULL, 'Municipal'),
    ('Haldimand County Collection', '53 Thorburn St S, Cayuga, ON N0A 1E0', 'Haldimand County', 'Municipal Depot', ARRAY['Paint'], 45608, 'Active', 42.9918, -79.9186, '2020-01-01', NULL, 'Municipal'),
    ('Norfolk County Depot', '185 Robinson St, Simcoe, ON N3Y 5L6', 'Norfolk County', 'Municipal Depot', ARRAY['Paint'], 64044, 'Active', 42.8370, -80.3144, '2020-01-01', NULL, 'Municipal'),
    ('Prince Edward County Collection', '332 Main St, Picton, ON K0K 2T0', 'Prince Edward County', 'Municipal Depot', ARRAY['Paint'], 24735, 'Active', 44.0089, -77.1411, '2021-01-01', NULL, 'Municipal'),
    ('Timmins Environmental Depot', '220 Algonquin Blvd E, Timmins, ON P4N 1B3', 'Timmins', 'Municipal Depot', ARRAY['Paint'], 41788, 'Active', 48.4758, -81.3304, '2021-01-01', NULL, 'Municipal'),
    ('Kenora Waste Facility', '810 1st Ave S, Kenora, ON P9N 1B8', 'Kenora', 'Municipal Depot', ARRAY['Paint'], 15096, 'Active', 49.7669, -94.4894, '2021-01-01', NULL, 'Municipal'),
    ('Elliot Lake Collection Centre', '45 Hillside Dr N, Elliot Lake, ON P5A 1X5', 'Elliot Lake', 'Municipal Depot', ARRAY['Paint'], 10741, 'Active', 46.3830, -82.6540, '2021-01-01', NULL, 'Municipal'),
    
    -- Additional Retailer Sites
    ('Home Depot - Ajax', '75 Harwood Ave S, Ajax, ON L1S 2H6', 'Ajax', 'Return to Retail', ARRAY['Paint'], 119677, 'Active', 43.8354, -79.0349, '2019-01-01', NULL, 'Retailer'),
    ('Canadian Tire - Whitby', '75 Consumers Dr, Whitby, ON L1N 2C2', 'Whitby', 'Return to Retail', ARRAY['Paint'], 128377, 'Active', 43.8971, -78.9658, '2019-01-01', NULL, 'Retailer'),
    ('Home Depot - Milton', '1011 Steeles Ave E, Milton, ON L9T 1Y1', 'Milton', 'Return to Retail', ARRAY['Paint'], 132979, 'Active', 43.5175, -79.8624, '2019-01-01', NULL, 'Retailer'),
    ('Canadian Tire - Newmarket', '17725 Yonge St, Newmarket, ON L3Y 5H6', 'Newmarket', 'Return to Retail', ARRAY['Paint'], 87942, 'Active', 44.0489, -79.4656, '2019-01-01', NULL, 'Retailer'),
    ('The Source - Barrie', '509 Bayfield St, Barrie, ON L4M 5A1', 'Barrie', 'Return to Retail', ARRAY['Lighting'], 147829, 'Active', 44.3894, -79.6903, '2018-01-01', NULL, 'Retailer')
) AS site_data(name, address, municipality_name, site_type, programs, population_served, status, latitude, longitude, active_start_date, active_end_date, operator_type)
JOIN municipality_ids m ON m.name = site_data.municipality_name;

-- ============================================================================
-- 4. REALLOCATIONS - Sample reallocation data
-- ============================================================================
WITH site_municipality_data AS (
  SELECT 
    cs.id as site_id,
    cs.municipality_id as from_municipality_id,
    cs.programs,
    m.name as municipality_name
  FROM collection_sites cs
  JOIN municipalities m ON m.id = cs.municipality_id
  WHERE cs.status = 'Active'
  LIMIT 20
),
target_municipalities AS (
  SELECT id, name FROM municipalities WHERE name IN ('Toronto', 'Mississauga', 'Hamilton', 'Ottawa')
),
admin_user AS (
  SELECT id FROM users WHERE role = 'Administrator' LIMIT 1
)
INSERT INTO reallocations (
  site_id,
  from_municipality_id,
  to_municipality_id,
  program,
  reallocation_type,
  percentage,
  rationale,
  status,
  created_by,
  approved_by,
  approved_at
)
SELECT 
  smd.site_id,
  smd.from_municipality_id,
  tm.id as to_municipality_id,
  unnest(smd.programs) as program,
  CASE 
    WHEN random() < 0.4 THEN 'Adjacent Sharing'
    WHEN random() < 0.7 THEN 'Direct Service Offset'
    ELSE 'Event Application'
  END as reallocation_type,
  CASE 
    WHEN random() < 0.3 THEN 10
    WHEN random() < 0.6 THEN 15
    ELSE 20
  END as percentage,
  'Sample reallocation for compliance demonstration' as rationale,
  CASE 
    WHEN random() < 0.4 THEN 'approved'
    WHEN random() < 0.7 THEN 'pending'
    ELSE 'rejected'
  END as status,
  (SELECT id FROM admin_user) as created_by,
  CASE 
    WHEN random() < 0.4 THEN (SELECT id FROM admin_user)
    ELSE NULL
  END as approved_by,
  CASE 
    WHEN random() < 0.4 THEN NOW() - INTERVAL '5 days'
    ELSE NULL
  END as approved_at
FROM site_municipality_data smd
CROSS JOIN target_municipalities tm
WHERE smd.municipality_name != tm.name
LIMIT 15;

-- ============================================================================
-- 5. COMPLIANCE CALCULATIONS - Sample compliance data
-- ============================================================================
WITH municipality_program_data AS (
  SELECT 
    m.id as municipality_id,
    m.name as municipality_name,
    m.population,
    programs.program
  FROM municipalities m
  CROSS JOIN (SELECT unnest(ARRAY['Paint', 'Lighting', 'Solvents', 'Pesticides']) as program) programs
  WHERE m.population > 10000
  LIMIT 50
),
site_counts AS (
  SELECT 
    cs.municipality_id,
    unnest(cs.programs) as program,
    COUNT(*) as actual_sites
  FROM collection_sites cs
  WHERE cs.status = 'Active'
    AND (cs.active_dates IS NULL OR cs.active_dates @> CURRENT_DATE)
  GROUP BY cs.municipality_id, unnest(cs.programs)
),
admin_user AS (
  SELECT id FROM users WHERE role = 'Administrator' LIMIT 1
)
INSERT INTO compliance_calculations (
  municipality_id,
  program,
  required_sites,
  actual_sites,
  shortfall,
  excess,
  compliance_rate,
  calculation_date,
  created_by
)
SELECT 
  mpd.municipality_id,
  mpd.program,
  -- Simple calculation: 1 site per 50,000 population (minimum 1)
  GREATEST(1, CEIL(mpd.population::numeric / 50000)) as required_sites,
  COALESCE(sc.actual_sites, 0) as actual_sites,
  GREATEST(0, GREATEST(1, CEIL(mpd.population::numeric / 50000)) - COALESCE(sc.actual_sites, 0)) as shortfall,
  GREATEST(0, COALESCE(sc.actual_sites, 0) - GREATEST(1, CEIL(mpd.population::numeric / 50000))) as excess,
  CASE 
    WHEN COALESCE(sc.actual_sites, 0) >= GREATEST(1, CEIL(mpd.population::numeric / 50000)) THEN 100.00
    ELSE ROUND((COALESCE(sc.actual_sites, 0)::numeric / GREATEST(1, CEIL(mpd.population::numeric / 50000))) * 100, 2)
  END as compliance_rate,
  NOW() - INTERVAL '30 days' + (random() * INTERVAL '60 days') as calculation_date,
  (SELECT id FROM admin_user) as created_by
FROM municipality_program_data mpd
LEFT JOIN site_counts sc ON sc.municipality_id = mpd.municipality_id AND sc.program = mpd.program
LIMIT 100;

-- ============================================================================
-- 6. REGULATORY RULES - Comprehensive regulatory rules
-- ============================================================================
INSERT INTO regulatory_rules (name, description, program, category, rule_type, parameters, status, is_active, created_at, updated_at) VALUES
-- HSP Paint Rules
('Paint Sites - Standard Population', 'One site per 40,000 for 5,000–500,000 population', 'Paint', 'HSP', 'site_calculation', '{"minPopulation": 5000, "maxPopulation": 500000, "sitesPerPopulation": 40000}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Paint Sites - Large Population', '13 + one per 150,000 for >500,000 population', 'Paint', 'HSP', 'site_calculation', '{"minPopulation": 500001, "baseRequirement": 13, "additionalPerPopulation": 150000}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Paint Sites - Minimum Requirement', 'At least one site for territorial districts with 1,000+ population', 'Paint', 'HSP', 'minimum_requirement', '{"minPopulation": 1000, "minimumSites": 1}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Paint Events Offset', 'Events can offset site requirements (up to 35%)', 'Paint', 'HSP', 'offset_limit', '{"offsetPercentage": 35}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Paint Adjacent Sharing', 'Adjacent community or upper-tier sharing (up to 10%)', 'Paint', 'HSP', 'sharing_limit', '{"sharingPercentage": 10}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),

-- HSP Solvents Rules
('Solvents Sites - Standard Population', 'One site per 250,000 for 10,000–500,000 population', 'Solvents', 'HSP', 'site_calculation', '{"minPopulation": 10000, "maxPopulation": 500000, "sitesPerPopulation": 250000}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Solvents Sites - Large Population', '2 + one per 300,000 for >500,000 population', 'Solvents', 'HSP', 'site_calculation', '{"minPopulation": 500001, "baseRequirement": 2, "additionalPerPopulation": 300000}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Solvents Sites - Minimum Requirement', 'At least one site for territorial districts with 1,000+ population', 'Solvents', 'HSP', 'minimum_requirement', '{"minPopulation": 1000, "minimumSites": 1}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Solvents Events Offset', 'Events can offset site requirements (up to 35%)', 'Solvents', 'HSP', 'offset_limit', '{"offsetPercentage": 35}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Solvents Adjacent Sharing', 'Adjacent community or upper-tier sharing (up to 10%)', 'Solvents', 'HSP', 'sharing_limit', '{"sharingPercentage": 10}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),

-- HSP Pesticides Rules
('Pesticides Sites - Standard Population', 'One site per 250,000 for 10,000–500,000 population', 'Pesticides', 'HSP', 'site_calculation', '{"minPopulation": 10000, "maxPopulation": 500000, "sitesPerPopulation": 250000}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Pesticides Sites - Large Population', '2 + one per 300,000 for >500,000 population', 'Pesticides', 'HSP', 'site_calculation', '{"minPopulation": 500001, "baseRequirement": 2, "additionalPerPopulation": 300000}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Pesticides Sites - Minimum Requirement', 'At least one site for territorial districts with 1,000+ population', 'Pesticides', 'HSP', 'minimum_requirement', '{"minPopulation": 1000, "minimumSites": 1}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Pesticides Events Offset', 'Events can offset site requirements (up to 35%)', 'Pesticides', 'HSP', 'offset_limit', '{"offsetPercentage": 35}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Pesticides Adjacent Sharing', 'Adjacent community or upper-tier sharing (up to 10%)', 'Pesticides', 'HSP', 'sharing_limit', '{"sharingPercentage": 10}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),

-- EEE Lighting Rules
('Lighting Sites - Standard Population', 'One site per 15,000 for 1,000-500,000 population', 'Lighting', 'EEE', 'site_calculation', '{"minPopulation": 1000, "maxPopulation": 500000, "sitesPerPopulation": 15000}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Lighting Sites - Large Population', '34 + one per 50,000 for >500,000 population', 'Lighting', 'EEE', 'site_calculation', '{"minPopulation": 500001, "baseRequirement": 34, "additionalPerPopulation": 50000}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Lighting Sites - Minimum Requirement', 'At least one site for territorial districts with 1,000+ population', 'Lighting', 'EEE', 'minimum_requirement', '{"minPopulation": 1000, "minimumSites": 1}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Lighting Events Offset', 'Events can offset site requirements (up to 35%)', 'Lighting', 'EEE', 'offset_limit', '{"offsetPercentage": 35}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Lighting Adjacent Sharing', 'Adjacent community sharing (up to 10%)', 'Lighting', 'EEE', 'sharing_limit', '{"sharingPercentage": 10}', 'Active', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. AUDIT LOGS - Sample audit log entries
-- ============================================================================
WITH user_data AS (
  SELECT id, username, role FROM users WHERE role IN ('Administrator', 'Compliance Analyst')
),
site_data AS (
  SELECT id, name FROM collection_sites LIMIT 10
),
municipality_data AS (
  SELECT id, name FROM municipalities LIMIT 10
)
INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, created_at)
SELECT 
  ud.id as user_id,
  actions.action,
  actions.table_name,
  CASE 
    WHEN actions.table_name = 'collection_sites' THEN sd.id
    WHEN actions.table_name = 'municipalities' THEN md.id
    ELSE NULL
  END as record_id,
  CASE 
    WHEN actions.action = 'UPDATE' THEN '{"status": "Active"}'::jsonb
    ELSE NULL
  END as old_values,
  CASE 
    WHEN actions.action = 'CREATE' THEN '{"status": "Active", "name": "New Site"}'::jsonb
    WHEN actions.action = 'UPDATE' THEN '{"status": "Inactive"}'::jsonb
    ELSE NULL
  END as new_values,
  NOW() - INTERVAL '90 days' + (random() * INTERVAL '90 days') as created_at
FROM user_data ud
CROSS JOIN (
  SELECT unnest(ARRAY['CREATE', 'UPDATE', 'DELETE']) as action,
         unnest(ARRAY['collection_sites', 'municipalities', 'reallocations']) as table_name
) actions
LEFT JOIN site_data sd ON actions.table_name = 'collection_sites'
LEFT JOIN municipality_data md ON actions.table_name = 'municipalities'
LIMIT 50;

-- ============================================================================
-- Summary
-- ============================================================================
SELECT 
  'Seed Data Summary' as summary,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM municipalities) as municipalities_count,
  (SELECT COUNT(*) FROM collection_sites) as sites_count,
  (SELECT COUNT(*) FROM reallocations) as reallocations_count,
  (SELECT COUNT(*) FROM compliance_calculations) as compliance_calculations_count,
  (SELECT COUNT(*) FROM regulatory_rules) as regulatory_rules_count,
  (SELECT COUNT(*) FROM audit_logs) as audit_logs_count;

