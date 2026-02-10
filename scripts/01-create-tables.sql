-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create municipalities table
CREATE TABLE IF NOT EXISTS municipalities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  population INTEGER NOT NULL,
  tier VARCHAR(50) NOT NULL, -- 'Single', 'Lower', 'Upper'
  region VARCHAR(255) NOT NULL,
  province VARCHAR(50) DEFAULT 'Ontario',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_sites table
CREATE TABLE IF NOT EXISTS collection_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  municipality_id UUID REFERENCES municipalities(id) ON DELETE CASCADE,
  site_type VARCHAR(100) NOT NULL, -- 'Municipal Depot', 'Return to Retail', 'Event', etc.
  operator_type VARCHAR(100), -- 'Retailer', 'Distributor', 'Municipal', 'First Nation/Indigenous', 'Private Depot', 'Product Care', 'Regional District', 'Other'
  programs TEXT[] NOT NULL, -- Array of programs: Paint, Lighting, Solvents, etc.
  population_served INTEGER,
  status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Inactive', 'Scheduled', 'Pending'
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  active_dates DATERANGE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create reallocations table
CREATE TABLE IF NOT EXISTS reallocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES collection_sites(id) ON DELETE CASCADE,
  from_municipality_id UUID REFERENCES municipalities(id),
  to_municipality_id UUID REFERENCES municipalities(id),
  program VARCHAR(100) NOT NULL,
  reallocation_type VARCHAR(50) NOT NULL, -- 'site', 'event', 'direct_return'
  percentage INTEGER DEFAULT 100,
  rationale TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  validation_errors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Create compliance_calculations table
CREATE TABLE IF NOT EXISTS compliance_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  municipality_id UUID REFERENCES municipalities(id),
  program VARCHAR(100) NOT NULL,
  required_sites INTEGER NOT NULL,
  actual_sites INTEGER NOT NULL,
  shortfall INTEGER DEFAULT 0,
  excess INTEGER DEFAULT 0,
  compliance_rate DECIMAL(5, 2) DEFAULT 0,
  calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regulatory_rules table
CREATE TABLE IF NOT EXISTS regulatory_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  program VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  rule_type VARCHAR(100) NOT NULL,
  parameters JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_sites_municipality ON collection_sites(municipality_id);
CREATE INDEX IF NOT EXISTS idx_collection_sites_status ON collection_sites(status);
CREATE INDEX IF NOT EXISTS idx_collection_sites_programs ON collection_sites USING GIN(programs);
CREATE INDEX IF NOT EXISTS idx_collection_sites_operator_type ON collection_sites(operator_type);
CREATE INDEX IF NOT EXISTS idx_reallocations_site ON reallocations(site_id);
CREATE INDEX IF NOT EXISTS idx_reallocations_status ON reallocations(status);
CREATE INDEX IF NOT EXISTS idx_compliance_municipality_program ON compliance_calculations(municipality_id, program);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_regulatory_rules_program ON regulatory_rules(program);
CREATE INDEX IF NOT EXISTS idx_regulatory_rules_category ON regulatory_rules(category);
CREATE INDEX IF NOT EXISTS idx_regulatory_rules_status ON regulatory_rules(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reallocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_rules ENABLE ROW LEVEL SECURITY;
