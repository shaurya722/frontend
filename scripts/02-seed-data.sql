-- Insert demo users with comprehensive roles and statuses
INSERT INTO users (username, email, password_hash, name, role, is_active, created_at, updated_at, last_login) VALUES
('admin', 'admin@arcgis-compliance.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'John Cardella', 'Administrator', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00', '2024-01-20 14:30:00'),
('analyst', 'analyst@arcgis-compliance.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Sarah Wilson', 'Compliance Analyst', true, '2024-01-16 09:00:00', '2024-01-16 09:00:00', '2024-01-19 16:45:00'),
('viewer', 'viewer@arcgis-compliance.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Mike Johnson', 'Viewer', true, '2024-01-17 11:00:00', '2024-01-17 11:00:00', '2024-01-18 13:20:00'),
('pending_user', 'newuser@municipality.ca', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Jennifer Smith', 'Compliance Analyst', false, '2024-01-19 15:00:00', '2024-01-19 15:00:00', NULL),
('inactive_user', 'olduser@consultant.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Robert Brown', 'Viewer', false, '2023-12-01 10:00:00', '2024-01-10 10:00:00', '2023-12-15 10:00:00')
ON CONFLICT (username) DO NOTHING;

-- Insert comprehensive Ontario municipalities with realistic data
INSERT INTO municipalities (name, population, tier, region) VALUES
-- Major Cities (Single Tier)
('Toronto', 2794356, 'Single', 'GTA'),
('Ottawa', 994837, 'Single', 'Ottawa'),
('Hamilton', 536917, 'Single', 'Hamilton'),
('London', 422324, 'Single', 'London'),
('Windsor', 229660, 'Single', 'Windsor-Essex'),
('Sudbury', 166004, 'Single', 'Sudbury'),
('Kingston', 123798, 'Single', 'Kingston'),
('Guelph', 131794, 'Single', 'Guelph'),
('Thunder Bay', 107909, 'Single', 'Thunder Bay'),
('Brantford', 104688, 'Single', 'Brant'),
('Barrie', 147829, 'Single', 'Simcoe'),
('Peterborough', 81032, 'Single', 'Peterborough'),
('Sarnia', 71594, 'Single', 'Lambton'),
('Sault Ste. Marie', 73368, 'Single', 'Algoma'),
('North Bay', 51553, 'Single', 'Nipissing'),
('Belleville', 50716, 'Single', 'Hastings'),
('Cornwall', 47845, 'Single', 'Stormont'),
('Chatham-Kent', 103988, 'Single', 'Chatham-Kent'),
('Kawartha Lakes', 75423, 'Single', 'Kawartha Lakes'),

-- Regional Municipalities (Upper Tier)
('York Region', 1109909, 'Upper', 'York'),
('Peel Region', 1381739, 'Upper', 'Peel'),
('Halton Region', 548435, 'Upper', 'Halton'),
('Durham Region', 645862, 'Upper', 'Durham'),
('Waterloo Region', 535154, 'Upper', 'Waterloo'),
('Niagara Region', 447888, 'Upper', 'Niagara'),
('Simcoe County', 479650, 'Upper', 'Simcoe'),
('Muskoka', 60599, 'Upper', 'Muskoka'),

-- Lower Tier Municipalities in Peel
('Mississauga', 717961, 'Lower', 'Peel'),
('Brampton', 656480, 'Lower', 'Peel'),
('Caledon', 66502, 'Lower', 'Peel'),

-- Lower Tier Municipalities in York
('Markham', 338503, 'Lower', 'York'),
('Vaughan', 323103, 'Lower', 'York'),
('Richmond Hill', 195022, 'Lower', 'York'),
('Newmarket', 87942, 'Lower', 'York'),
('Aurora', 62057, 'Lower', 'York'),
('Whitchurch-Stouffville', 49864, 'Lower', 'York'),
('King', 27333, 'Lower', 'York'),
('East Gwillimbury', 24072, 'Lower', 'York'),
('Georgina', 48810, 'Lower', 'York'),

-- Lower Tier Municipalities in Halton
('Oakville', 193832, 'Lower', 'Halton'),
('Burlington', 183314, 'Lower', 'Halton'),
('Milton', 132979, 'Lower', 'Halton'),
('Halton Hills', 61161, 'Lower', 'Halton'),

-- Lower Tier Municipalities in Durham
('Oshawa', 166000, 'Lower', 'Durham'),
('Whitby', 128377, 'Lower', 'Durham'),
('Pickering', 91771, 'Lower', 'Durham'),
('Ajax', 119677, 'Lower', 'Durham'),
('Clarington', 92013, 'Lower', 'Durham'),
('Scugog', 22559, 'Lower', 'Durham'),
('Uxbridge', 21176, 'Lower', 'Durham'),
('Brock', 11642, 'Lower', 'Durham'),

-- Lower Tier Municipalities in Waterloo
('Kitchener', 256885, 'Lower', 'Waterloo'),
('Cambridge', 129920, 'Lower', 'Waterloo'),
('Waterloo', 104986, 'Lower', 'Waterloo'),
('North Dumfries', 10424, 'Lower', 'Waterloo'),
('Wellesley', 11260, 'Lower', 'Waterloo'),
('Wilmot', 21054, 'Lower', 'Waterloo'),
('Woolwich', 26999, 'Lower', 'Waterloo'),

-- Lower Tier Municipalities in Niagara
('St. Catharines', 133113, 'Lower', 'Niagara'),
('Niagara Falls', 88071, 'Lower', 'Niagara'),
('Welland', 52293, 'Lower', 'Niagara'),
('Thorold', 18801, 'Lower', 'Niagara'),
('Port Colborne', 18306, 'Lower', 'Niagara'),
('Fort Erie', 30710, 'Lower', 'Niagara'),
('Lincoln', 24722, 'Lower', 'Niagara'),
('Pelham', 17110, 'Lower', 'Niagara'),
('Grimsby', 27314, 'Lower', 'Niagara'),
('West Lincoln', 14500, 'Lower', 'Niagara'),
('Wainfleet', 6372, 'Lower', 'Niagara'),
('Niagara-on-the-Lake', 17511, 'Lower', 'Niagara'),

-- Single Tier Counties
('Haldimand County', 45608, 'Single', 'Haldimand-Norfolk'),
('Norfolk County', 64044, 'Single', 'Haldimand-Norfolk'),
('Prince Edward County', 24735, 'Single', 'Prince Edward'),
('Brant County', 36707, 'Single', 'Brant'),
('Elgin County', 88978, 'Single', 'Elgin'),
('Essex County', 398953, 'Single', 'Windsor-Essex'),
('Lambton County', 126199, 'Single', 'Lambton'),
('Middlesex County', 473157, 'Single', 'London'),

-- Northern Ontario Municipalities
('Timmins', 41788, 'Single', 'Cochrane'),
('Greater Sudbury', 166004, 'Single', 'Sudbury'),
('Kenora', 15096, 'Single', 'Kenora'),
('Dryden', 7749, 'Single', 'Kenora'),
('Elliot Lake', 10741, 'Single', 'Algoma'),
('Temiskaming Shores', 9634, 'Single', 'Temiskaming')
ON CONFLICT DO NOTHING;

-- Insert comprehensive collection sites across Ontario with realistic data
WITH municipality_ids AS (
  SELECT id, name FROM municipalities
)
INSERT INTO collection_sites (name, address, municipality_id, site_type, programs, population_served, status, latitude, longitude, active_dates, operator_type)
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
  NULL as operator_type
FROM (
  VALUES
    -- Toronto Sites (Major Hub)
    ('Toronto Municipal Depot - North York', '5100 Yonge St, North York, ON M2N 5V7', 'Toronto', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 2794356, 'Active', 43.7615, -79.4111, '2020-01-01', NULL),
    ('Toronto Municipal Depot - Scarborough', '1900 Ellesmere Rd, Scarborough, ON M1H 2V1', 'Toronto', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Pesticides'], 2794356, 'Active', 43.7615, -79.2663, '2020-01-01', NULL),
    ('Toronto Municipal Depot - Etobicoke', '399 The West Mall, Etobicoke, ON M9C 2Y2', 'Toronto', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 2794356, 'Active', 43.6426, -79.5481, '2020-01-01', NULL),
    ('Toronto Municipal Depot - East York', '1500 Danforth Ave, Toronto, ON M4J 5C3', 'Toronto', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 2794356, 'Active', 43.6777, -79.3315, '2021-03-01', NULL),
    ('Home Depot - Toronto Downtown', '50 Canoe Landing Blvd, Toronto, ON M5V 3S8', 'Toronto', 'Return to Retail', ARRAY['Paint'], 2794356, 'Active', 43.6426, -79.3871, '2019-06-01', NULL),
    ('Canadian Tire - Toronto East', '1405 Victoria Park Ave, Toronto, ON M4A 2L8', 'Toronto', 'Return to Retail', ARRAY['Paint'], 2794356, 'Active', 43.6896, -79.2958, '2019-01-01', NULL),
    ('Rona - Toronto West', '2300 Dundas St W, Toronto, ON M6P 4B2', 'Toronto', 'Return to Retail', ARRAY['Paint'], 2794356, 'Active', 43.6532, -79.4481, '2019-01-01', NULL),
    ('Best Buy - Toronto Yonge', '2200 Yonge St, Toronto, ON M4S 2C6', 'Toronto', 'Return to Retail', ARRAY['Lighting'], 2794356, 'Active', 43.7048, -79.3971, '2018-01-01', NULL),
    ('Future Shop - Scarborough', '300 Borough Dr, Scarborough, ON M1P 4P5', 'Toronto', 'Return to Retail', ARRAY['Lighting'], 2794356, 'Active', 43.7735, -79.2663, '2018-01-01', NULL),
    ('The Source - Toronto', '777 Bay St, Toronto, ON M5G 2C8', 'Toronto', 'Return to Retail', ARRAY['Lighting'], 2794356, 'Active', 43.6577, -79.3788, '2018-01-01', NULL),
    ('Toronto Hazardous Waste Event - Spring', 'Exhibition Place, 210 Princes Blvd, Toronto, ON M6K 3C3', 'Toronto', 'Event', ARRAY['Paint', 'Solvents', 'Pesticides'], 2794356, 'Scheduled', 43.6426, -79.4194, '2024-04-15', '2024-04-15'),
    ('Toronto Hazardous Waste Event - Fall', 'Downsview Park, 70 Canuck Ave, Toronto, ON M3K 2C5', 'Toronto', 'Event', ARRAY['Paint', 'Solvents', 'Pesticides'], 2794356, 'Scheduled', 43.7420, -79.4680, '2024-09-21', '2024-09-21'),
    
    -- Ottawa Sites (Capital Region)
    ('Ottawa Municipal Depot - Trail Road', '3904 Innes Rd, Ottawa, ON K1W 1K7', 'Ottawa', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 994837, 'Active', 45.4215, -75.6219, '2020-01-01', NULL),
    ('Ottawa Municipal Depot - Nepean', '4100 Strandherd Dr, Ottawa, ON K2J 4B1', 'Ottawa', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Pesticides'], 994837, 'Active', 45.3311, -75.7497, '2020-01-01', NULL),
    ('Ottawa Municipal Depot - Gloucester', '2800 Queensview Dr, Ottawa, ON K2B 1A5', 'Ottawa', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 994837, 'Active', 45.3656, -75.7572, '2021-01-01', NULL),
    ('Home Depot - Ottawa South', '2685 Iris St, Ottawa, ON K2C 1E7', 'Ottawa', 'Return to Retail', ARRAY['Paint'], 994837, 'Active', 45.3656, -75.7572, '2019-01-01', NULL),
    ('Canadian Tire - Ottawa West', '1300 Carling Ave, Ottawa, ON K1Z 7L2', 'Ottawa', 'Return to Retail', ARRAY['Paint'], 994837, 'Active', 45.3656, -75.7572, '2019-01-01', NULL),
    ('Best Buy - Ottawa', '2210 Bank St, Ottawa, ON K1V 1J5', 'Ottawa', 'Return to Retail', ARRAY['Lighting'], 994837, 'Active', 45.3656, -75.6972, '2018-01-01', NULL),
    ('Ottawa Spring Clean Event', 'Lansdowne Park, 1015 Bank St, Ottawa, ON K1S 3W7', 'Ottawa', 'Event', ARRAY['Paint', 'Solvents'], 994837, 'Scheduled', 45.3656, -75.6972, '2024-05-11', '2024-05-11'),
    
    -- Mississauga Sites (Peel Region)
    ('Mississauga Depot - Heartland', '7171 Torbram Rd, Mississauga, ON L4T 3W4', 'Mississauga', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 717961, 'Active', 43.5890, -79.6441, '2020-01-01', NULL),
    ('Mississauga Depot - Lakeview', '1275 Lakeshore Rd W, Mississauga, ON L5H 1G7', 'Mississauga', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 717961, 'Active', 43.5890, -79.6441, '2021-01-01', NULL),
    ('Home Depot - Mississauga Meadowvale', '6677 Meadowvale Town Centre Cir, Mississauga, ON L5N 2V4', 'Mississauga', 'Return to Retail', ARRAY['Paint'], 717961, 'Active', 43.5890, -79.7330, '2019-01-01', NULL),
    ('Canadian Tire - Square One', '100 City Centre Dr, Mississauga, ON L5B 2C9', 'Mississauga', 'Return to Retail', ARRAY['Paint'], 717961, 'Active', 43.5890, -79.6441, '2019-01-01', NULL),
    ('Best Buy - Mississauga', '3045 Mavis Rd, Mississauga, ON L5C 1T8', 'Mississauga', 'Return to Retail', ARRAY['Lighting'], 717961, 'Active', 43.5890, -79.6441, '2018-01-01', NULL),
    
    -- Hamilton Sites (Single Tier)
    ('Hamilton Municipal Depot', '1211 Woodward Ave, Hamilton, ON L8H 7P1', 'Hamilton', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 536917, 'Active', 43.2557, -79.8711, '2020-01-01', NULL),
    ('Hamilton Depot - Stoney Creek', '659 Hwy 8, Stoney Creek, ON L8G 5E3', 'Hamilton', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 536917, 'Active', 43.2557, -79.7624, '2021-01-01', NULL),
    ('Home Depot - Hamilton Mountain', '1550 Upper James St, Hamilton, ON L9B 2L6', 'Hamilton', 'Return to Retail', ARRAY['Paint'], 536917, 'Active', 43.2557, -79.8711, '2019-01-01', NULL),
    ('Canadian Tire - Hamilton', '1240 Barton St E, Hamilton, ON L8H 2V4', 'Hamilton', 'Return to Retail', ARRAY['Paint'], 536917, 'Active', 43.2557, -79.8711, '2019-01-01', NULL),
    ('Hamilton Hazmat Collection Event', 'Gage Park, 1000 Gage Ave N, Hamilton, ON L8L 8A2', 'Hamilton', 'Event', ARRAY['Paint', 'Pesticides'], 536917, 'Scheduled', 43.2557, -79.8711, '2024-06-08', '2024-06-08'),
    
    -- London Sites (Single Tier)
    ('London Environmental Depot', '1485 Hargreaves Rd, London, ON N6E 1P5', 'London', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 422324, 'Active', 42.9849, -81.2453, '2020-01-01', NULL),
    ('London Depot - East', '2010 Dundas St E, London, ON N5V 3P5', 'London', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 422324, 'Active', 42.9849, -81.1453, '2021-01-01', NULL),
    ('Home Depot - London North', '1205 Oxford St W, London, ON N6H 1V1', 'London', 'Return to Retail', ARRAY['Paint'], 422324, 'Active', 42.9849, -81.2453, '2019-01-01', NULL),
    ('Canadian Tire - London South', '1280 Commissioners Rd W, London, ON N6K 1C7', 'London', 'Return to Retail', ARRAY['Paint'], 422324, 'Active', 42.9849, -81.2453, '2019-01-01', NULL),
    ('Best Buy - London', '1680 Richmond St, London, ON N6G 3Y9', 'London', 'Return to Retail', ARRAY['Lighting'], 422324, 'Active', 42.9849, -81.2453, '2018-01-01', NULL),
    
    -- Kitchener Sites (Waterloo Region)
    ('Kitchener Waste Depot', '925 Frederick St, Kitchener, ON N2B 2B3', 'Kitchener', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 256885, 'Active', 43.4516, -80.4925, '2020-01-01', NULL),
    ('Home Depot - Kitchener', '2960 Kingsway Dr, Kitchener, ON N2C 1X1', 'Kitchener', 'Return to Retail', ARRAY['Paint'], 256885, 'Active', 43.4516, -80.4925, '2019-01-01', NULL),
    ('Canadian Tire - Kitchener', '1405 Victoria St N, Kitchener, ON N2B 3E2', 'Kitchener', 'Return to Retail', ARRAY['Paint'], 256885, 'Active', 43.4516, -80.4925, '2019-01-01', NULL),
    
    -- Windsor Sites (Single Tier)
    ('Windsor Environmental Depot', '3540 North Service Rd E, Windsor, ON N8W 5X7', 'Windsor', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 229660, 'Active', 42.3149, -83.0364, '2020-01-01', NULL),
    ('Home Depot - Windsor', '4371 Walker Rd, Windsor, ON N9G 1R1', 'Windsor', 'Return to Retail', ARRAY['Paint'], 229660, 'Active', 42.3149, -83.0364, '2019-01-01', NULL),
    ('Canadian Tire - Windsor', '3100 Howard Ave, Windsor, ON N8X 3Y8', 'Windsor', 'Return to Retail', ARRAY['Paint'], 229660, 'Active', 42.3149, -83.0364, '2019-01-01', NULL),
    
    -- Vaughan Sites (York Region)
    ('Vaughan Mobile Collection Unit', '2141 Major Mackenzie Dr, Vaughan, ON L6A 1T1', 'Vaughan', 'Mobile Collection', ARRAY['Paint', 'Solvents'], 323103, 'Scheduled', 43.8361, -79.5083, '2024-03-01', '2024-11-30'),
    ('Home Depot - Vaughan', '3555 Major Mackenzie Dr W, Vaughan, ON L4H 4C3', 'Vaughan', 'Return to Retail', ARRAY['Paint'], 323103, 'Active', 43.8361, -79.5083, '2019-01-01', NULL),
    ('Canadian Tire - Vaughan', '9200 Bathurst St, Vaughan, ON L4J 8A7', 'Vaughan', 'Return to Retail', ARRAY['Paint'], 323103, 'Active', 43.8361, -79.5083, '2019-01-01', NULL),
    
    -- Markham Sites (York Region)
    ('Markham Hazmat Event Site', '5800 14th Ave, Markham, ON L3S 4K4', 'Markham', 'Event', ARRAY['Lighting', 'Paint'], 338503, 'Pending', 43.8561, -79.3370, '2024-07-20', '2024-07-20'),
    ('Home Depot - Markham', '15 Riocan Ave, Markham, ON L3R 0G1', 'Markham', 'Return to Retail', ARRAY['Paint'], 338503, 'Active', 43.8561, -79.3370, '2019-01-01', NULL),
    ('Best Buy - Markham', '4861 Highway 7, Markham, ON L3R 1N1', 'Markham', 'Return to Retail', ARRAY['Lighting'], 338503, 'Active', 43.8561, -79.3370, '2018-01-01', NULL),
    
    -- Brampton Sites (Peel Region)
    ('Brampton Waste Depot', '2185 Williams Pkwy, Brampton, ON L6S 5V4', 'Brampton', 'Municipal Depot', ARRAY['Paint', 'Lighting', 'Solvents'], 656480, 'Active', 43.7315, -79.7624, '2020-01-01', NULL),
    ('Home Depot - Brampton', '50 Great Lakes Dr, Brampton, ON L6R 2K7', 'Brampton', 'Return to Retail', ARRAY['Paint'], 656480, 'Active', 43.7315, -79.7624, '2019-01-01', NULL),
    ('Canadian Tire - Brampton', '25 Peel Centre Dr, Brampton, ON L6T 3R5', 'Brampton', 'Return to Retail', ARRAY['Paint'], 656480, 'Active', 43.7315, -79.7624, '2019-01-01', NULL),
    
    -- Smaller municipalities with comprehensive coverage
    ('Guelph Environmental Services', '1 Shire St, Guelph, ON N1E 6N5', 'Guelph', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 131794, 'Active', 43.5448, -80.2482, '2020-01-01', NULL),
    ('Kingston Waste Depot', '1840 Highway 15, Kingston, ON K7L 5H6', 'Kingston', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 123798, 'Active', 44.2312, -76.4860, '2020-01-01', NULL),
    ('Barrie Environmental Centre', '165 Ferndale Dr S, Barrie, ON L4N 9V9', 'Barrie', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 147829, 'Active', 44.3894, -79.6903, '2020-01-01', NULL),
    ('Thunder Bay Waste Facility', '1100 Memorial Ave, Thunder Bay, ON P7B 4A3', 'Thunder Bay', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 107909, 'Active', 48.3809, -89.2477, '2020-01-01', NULL),
    ('Sudbury Environmental Services', '1349 Riverside Dr, Sudbury, ON P3E 6C7', 'Sudbury', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 166004, 'Active', 46.4917, -80.9930, '2020-01-01', NULL),
    
    -- Regional collection events and mobile units
    ('Muskoka Mobile Collection', 'Various Locations, Muskoka, ON', 'Muskoka', 'Mobile Collection', ARRAY['Paint', 'Lighting'], 60599, 'Scheduled', 45.0389, -79.4956, '2024-05-01', '2024-10-31'),
    ('Simcoe County Hazmat Event', 'County Administration Centre, 1110 Highway 26, Midhurst, ON L9X 1N6', 'Simcoe County', 'Event', ARRAY['Paint', 'Solvents'], 479650, 'Scheduled', 44.7228, -79.7892, '2024-08-17', '2024-08-17'),
    ('Prince Edward County Collection', '332 Main St, Picton, ON K0K 2T0', 'Prince Edward County', 'Municipal Depot', ARRAY['Paint'], 24735, 'Active', 44.0089, -77.1411, '2021-01-01', NULL),
    
    -- Seasonal and temporary sites
    ('Oakville Seasonal Depot', '1151 Bronte Rd, Oakville, ON L6M 3L1', 'Oakville', 'Seasonal Depot', ARRAY['Paint', 'Lighting'], 193832, 'Active', 43.4675, -79.7624, '2024-04-01', '2024-10-31'),
    ('Burlington Spring Event', 'Central Park, 2185 New St, Burlington, ON L7R 1J4', 'Burlington', 'Event', ARRAY['Paint', 'Pesticides'], 183314, 'Scheduled', 43.3255, -79.7990, '2024-05-25', '2024-05-25'),
    ('Oshawa Mobile Unit', 'Civic Recreation Complex, 99 Thornton Rd S, Oshawa, ON L1J 5Y1', 'Oshawa', 'Mobile Collection', ARRAY['Paint'], 166000, 'Scheduled', 43.8971, -78.8658, '2024-06-01', '2024-09-30'),
    ('St. Catharines Depot', '115 Niagara St, St. Catharines, ON L2R 4L3', 'St. Catharines', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 133113, 'Active', 43.1594, -79.2469, '2020-01-01', NULL),
    ('Cambridge Waste Centre', '250 Savage Dr, Cambridge, ON N3H 4R7', 'Cambridge', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 129920, 'Active', 43.3616, -80.3144, '2020-01-01', NULL),
    ('Waterloo Environmental Depot', '925 Erb St W, Waterloo, ON N2J 3Z4', 'Waterloo', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 104986, 'Active', 43.4643, -80.5204, '2020-01-01', NULL),
    ('Brantford Hazmat Centre', '500 Park Rd N, Brantford, ON N3R 7K8', 'Brantford', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 104688, 'Active', 43.1393, -80.2644, '2020-01-01', NULL),
    ('Pickering Environmental Services', '1867 Valley Farm Rd, Pickering, ON L1V 3B2', 'Pickering', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 91771, 'Active', 43.8354, -79.0849, '2020-01-01', NULL),
    ('Niagara Falls Depot', '5570 Stanley Ave, Niagara Falls, ON L2G 3X4', 'Niagara Falls', 'Municipal Depot', ARRAY['Paint'], 88071, 'Active', 43.0896, -79.0849, '2020-01-01', NULL),
    ('Peterborough Waste Centre', '935 Armour Rd, Peterborough, ON K9H 7L6', 'Peterborough', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 81032, 'Active', 44.3091, -78.3197, '2020-01-01', NULL),
    ('Sarnia Environmental Services', '1455 London Rd, Sarnia, ON N7S 6K5', 'Sarnia', 'Municipal Depot', ARRAY['Paint'], 71594, 'Active', 42.9849, -82.4066, '2020-01-01', NULL),
    ('Sault Ste. Marie Depot', '2225 Great Northern Rd, Sault Ste. Marie, ON P6B 4Z9', 'Sault Ste. Marie', 'Municipal Depot', ARRAY['Paint'], 73368, 'Active', 46.5197, -84.3421, '2020-01-01', NULL),
    ('Welland Waste Facility', '145 Lincoln St, Welland, ON L3B 6E1', 'Welland', 'Municipal Depot', ARRAY['Paint'], 52293, 'Active', 42.9918, -79.2648, '2020-01-01', NULL),
    ('North Bay Environmental Centre', '1500 Fisher St, North Bay, ON P1B 2H3', 'North Bay', 'Municipal Depot', ARRAY['Paint'], 51553, 'Active', 46.3091, -79.4608, '2020-01-01', NULL),
    ('Belleville Hazmat Depot', '200 Cannifton Rd, Belleville, ON K8N 4K8', 'Belleville', 'Municipal Depot', ARRAY['Paint'], 50716, 'Active', 44.1628, -77.3832, '2020-01-01', NULL),
    ('Cornwall Waste Centre', '1225 Boundary Rd, Cornwall, ON K6H 7B1', 'Cornwall', 'Municipal Depot', ARRAY['Paint'], 47845, 'Active', 45.0212, -74.7307, '2020-01-01', NULL),
    ('Chatham-Kent Environmental Services', '315 Grand Ave W, Chatham, ON N7M 5L8', 'Chatham-Kent', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 103988, 'Active', 42.4048, -82.1910, '2020-01-01', NULL),
    ('Kawartha Lakes Depot', '322 Kent St W, Lindsay, ON K9V 2Z7', 'Kawartha Lakes', 'Municipal Depot', ARRAY['Paint'], 75423, 'Active', 44.3583, -78.7350, '2020-01-01', NULL),
    ('Haldimand County Collection', '53 Thorburn St S, Cayuga, ON N0A 1E0', 'Haldimand County', 'Municipal Depot', ARRAY['Paint'], 45608, 'Active', 42.9918, -79.9186, '2020-01-01', NULL),
    ('Norfolk County Depot', '185 Robinson St, Simcoe, ON N3Y 5L6', 'Norfolk County', 'Municipal Depot', ARRAY['Paint'], 64044, 'Active', 42.8370, -80.3144, '2020-01-01', NULL),
    
    -- Return to Retail Sites across Ontario
    ('Home Depot - Ajax', '75 Harwood Ave S, Ajax, ON L1S 2H6', 'Ajax', 'Return to Retail', ARRAY['Paint'], 119677, 'Active', 43.8354, -79.0349, '2019-01-01', NULL),
    ('Canadian Tire - Whitby', '75 Consumers Dr, Whitby, ON L1N 2C2', 'Whitby', 'Return to Retail', ARRAY['Paint'], 128377, 'Active', 43.8971, -78.9658, '2019-01-01', NULL),
    ('Home Depot - Milton', '1011 Steeles Ave E, Milton, ON L9T 1Y1', 'Milton', 'Return to Retail', ARRAY['Paint'], 132979, 'Active', 43.5175, -79.8624, '2019-01-01', NULL),
    ('Canadian Tire - Newmarket', '17725 Yonge St, Newmarket, ON L3Y 5H6', 'Newmarket', 'Return to Retail', ARRAY['Paint'], 87942, 'Active', 44.0489, -79.4656, '2019-01-01', NULL),
    ('Best Buy - Richmond Hill', '9350 Yonge St, Richmond Hill, ON L4C 5G2', 'Richmond Hill', 'Return to Retail', ARRAY['Lighting'], 195022, 'Active', 43.8561, -79.4270, '2018-01-01', NULL),
    ('Future Shop - Aurora', '15213 Yonge St, Aurora, ON L4G 1M2', 'Aurora', 'Return to Retail', ARRAY['Lighting'], 62057, 'Active', 44.0089, -79.4656, '2018-01-01', NULL),
    ('The Source - Barrie', '509 Bayfield St, Barrie, ON L4M 5A1', 'Barrie', 'Return to Retail', ARRAY['Lighting'], 147829, 'Active', 44.3894, -79.6903, '2018-01-01', NULL),
    ('Staples - Guelph', '435 Stone Rd W, Guelph, ON N1G 2X6', 'Guelph', 'Return to Retail', ARRAY['Lighting'], 131794, 'Active', 43.5448, -80.2482, '2018-01-01', NULL),
    
    -- Northern Ontario Sites
    ('Timmins Environmental Depot', '220 Algonquin Blvd E, Timmins, ON P4N 1B3', 'Timmins', 'Municipal Depot', ARRAY['Paint'], 41788, 'Active', 48.4758, -81.3304, '2021-01-01', NULL),
    ('Kenora Waste Facility', '810 1st Ave S, Kenora, ON P9N 1B8', 'Kenora', 'Municipal Depot', ARRAY['Paint'], 15096, 'Active', 49.7669, -94.4894, '2021-01-01', NULL),
    ('Elliot Lake Collection Centre', '45 Hillside Dr N, Elliot Lake, ON P5A 1X5', 'Elliot Lake', 'Municipal Depot', ARRAY['Paint'], 10741, 'Active', 46.3830, -82.6540, '2021-01-01', NULL),
    
    -- Inactive/Historical Sites for testing
    ('Former Toronto Depot - Downsview', '1000 Sheppard Ave W, Toronto, ON M3K 3N1', 'Toronto', 'Municipal Depot', ARRAY['Paint', 'Lighting'], 2794356, 'Inactive', 43.7420, -79.4680, '2018-01-01', '2023-12-31'),
    ('Closed Hamilton Site', '500 Main St E, Hamilton, ON L8N 1K7', 'Hamilton', 'Municipal Depot', ARRAY['Paint'], 536917, 'Inactive', 43.2557, -79.8711, '2017-01-01', '2022-06-30'),
    ('Decommissioned London Depot', '1200 Oxford St E, London, ON N5Y 3L7', 'London', 'Municipal Depot', ARRAY['Paint', 'Solvents'], 422324, 'Inactive', 42.9849, -81.1453, '2016-01-01', '2021-12-31')
) AS site_data(name, address, municipality_name, site_type, programs, population_served, status, latitude, longitude, active_start_date, active_end_date)
JOIN municipality_ids m ON m.name = site_data.municipality_name;

-- Insert regulatory rules configuration
INSERT INTO regulatory_rules (program, category, rule_type, name, description, parameters, is_active, created_at, updated_at) VALUES
-- HSP Paint Rules
('Paint', 'HSP', 'site_calculation', 'Paint Sites - Standard Population', 'One site per 40,000 for 5,000–500,000 population', '{"minPopulation": 5000, "maxPopulation": 500000, "sitesPerPopulation": 40000}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Paint', 'HSP', 'site_calculation', 'Paint Sites - Large Population', '13 + one per 150,000 for >500,000 population', '{"minPopulation": 500001, "baseRequirement": 13, "additionalPerPopulation": 150000}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Paint', 'HSP', 'minimum_requirement', 'Paint Sites - Minimum Requirement', 'At least one site for territorial districts with 1,000+ population', '{"minPopulation": 1000, "minimumSites": 1}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Paint', 'HSP', 'offset_limit', 'Paint Events Offset', 'Events can offset site requirements (up to 35%)', '{"offsetPercentage": 35}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Paint', 'HSP', 'sharing_limit', 'Paint Adjacent Sharing', 'Adjacent community or upper-tier sharing (up to 10%)', '{"sharingPercentage": 10}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),

-- HSP Solvents Rules
('Solvents', 'HSP', 'site_calculation', 'Solvents Sites - Standard Population', 'One site per 250,000 for 10,000–500,000 population', '{"minPopulation": 10000, "maxPopulation": 500000, "sitesPerPopulation": 250000}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Solvents', 'HSP', 'site_calculation', 'Solvents Sites - Large Population', '2 + one per 300,000 for >500,000 population', '{"minPopulation": 500001, "baseRequirement": 2, "additionalPerPopulation": 300000}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Solvents', 'HSP', 'minimum_requirement', 'Solvents Sites - Minimum Requirement', 'At least one site for territorial districts with 1,000+ population', '{"minPopulation": 1000, "minimumSites": 1}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Solvents', 'HSP', 'offset_limit', 'Solvents Events Offset', 'Events can offset site requirements (up to 35%)', '{"offsetPercentage": 35}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Solvents', 'HSP', 'sharing_limit', 'Solvents Adjacent Sharing', 'Adjacent community or upper-tier sharing (up to 10%)', '{"sharingPercentage": 10}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),

-- HSP Pesticides Rules
('Pesticides', 'HSP', 'site_calculation', 'Pesticides Sites - Standard Population', 'One site per 250,000 for 10,000–500,000 population', '{"minPopulation": 10000, "maxPopulation": 500000, "sitesPerPopulation": 250000}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Pesticides', 'HSP', 'site_calculation', 'Pesticides Sites - Large Population', '2 + one per 300,000 for >500,000 population', '{"minPopulation": 500001, "baseRequirement": 2, "additionalPerPopulation": 300000}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Pesticides', 'HSP', 'minimum_requirement', 'Pesticides Sites - Minimum Requirement', 'At least one site for territorial districts with 1,000+ population', '{"minPopulation": 1000, "minimumSites": 1}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Pesticides', 'HSP', 'offset_limit', 'Pesticides Events Offset', 'Events can offset site requirements (up to 35%)', '{"offsetPercentage": 35}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Pesticides', 'HSP', 'sharing_limit', 'Pesticides Adjacent Sharing', 'Adjacent community or upper-tier sharing (up to 10%)', '{"sharingPercentage": 10}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),

-- EEE Lighting Rules
('Lighting', 'EEE', 'site_calculation', 'Lighting Sites - Standard Population', 'One site per 15,000 for 1,000-500,000 population', '{"minPopulation": 1000, "maxPopulation": 500000, "sitesPerPopulation": 15000}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Lighting', 'EEE', 'site_calculation', 'Lighting Sites - Large Population', '34 + one per 50,000 for >500,000 population', '{"minPopulation": 500001, "baseRequirement": 34, "additionalPerPopulation": 50000}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Lighting', 'EEE', 'minimum_requirement', 'Lighting Sites - Minimum Requirement', 'At least one site for territorial districts with 1,000+ population', '{"minPopulation": 1000, "minimumSites": 1}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Lighting', 'EEE', 'offset_limit', 'Lighting Events Offset', 'Events can offset site requirements (up to 35%)', '{"offsetPercentage": 35}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
('Lighting', 'EEE', 'sharing_limit', 'Lighting Adjacent Sharing', 'Adjacent community sharing (up to 10%)', '{"sharingPercentage": 10}', true, '2024-01-15 10:00:00', '2024-01-15 10:00:00')
ON CONFLICT DO NOTHING;
