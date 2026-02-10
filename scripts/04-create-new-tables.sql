-- Create census_data_history table
CREATE TABLE IF NOT EXISTS census_data_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES municipalities(id) ON DELETE CASCADE NOT NULL,
  census_year INTEGER NOT NULL,
  population INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, census_year)
);

-- Create adjacent_communities table
CREATE TABLE IF NOT EXISTS adjacent_communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES municipalities(id) ON DELETE CASCADE NOT NULL,
  adjacent_community_id UUID REFERENCES municipalities(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, adjacent_community_id),
  CONSTRAINT no_self_reference CHECK (community_id != adjacent_community_id)
);

-- Create direct_service_offsets table
CREATE TABLE IF NOT EXISTS direct_service_offsets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  global_percentage INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(program, year)
);

-- Create community_offsets table
CREATE TABLE IF NOT EXISTS community_offsets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES municipalities(id) ON DELETE CASCADE NOT NULL,
  program VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  percentage_override INTEGER,
  new_required INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, program, year)
);

-- Create event_applications table
CREATE TABLE IF NOT EXISTS event_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES municipalities(id) ON DELETE CASCADE NOT NULL,
  event_site_id UUID REFERENCES collection_sites(id) ON DELETE CASCADE NOT NULL,
  program VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by UUID REFERENCES users(id),
  UNIQUE(event_site_id, program, year)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_census_data_history_community ON census_data_history(community_id);
CREATE INDEX IF NOT EXISTS idx_census_data_history_year ON census_data_history(census_year);
CREATE INDEX IF NOT EXISTS idx_adjacent_communities_community ON adjacent_communities(community_id);
CREATE INDEX IF NOT EXISTS idx_adjacent_communities_adjacent ON adjacent_communities(adjacent_community_id);
CREATE INDEX IF NOT EXISTS idx_direct_service_offsets_program_year ON direct_service_offsets(program, year);
CREATE INDEX IF NOT EXISTS idx_community_offsets_community_program_year ON community_offsets(community_id, program, year);
CREATE INDEX IF NOT EXISTS idx_event_applications_community ON event_applications(community_id);
CREATE INDEX IF NOT EXISTS idx_event_applications_site ON event_applications(event_site_id);
CREATE INDEX IF NOT EXISTS idx_event_applications_program_year ON event_applications(program, year);

-- Enable Row Level Security on new tables
ALTER TABLE census_data_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjacent_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_service_offsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_offsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for census_data_history
CREATE POLICY "All authenticated users can view census data" ON census_data_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can modify census data" ON census_data_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Administrator', 'Compliance Analyst')
    )
  );

-- Create RLS Policies for adjacent_communities
CREATE POLICY "All authenticated users can view adjacent communities" ON adjacent_communities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can modify adjacent communities" ON adjacent_communities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Administrator', 'Compliance Analyst')
    )
  );

-- Create RLS Policies for direct_service_offsets
CREATE POLICY "All authenticated users can view direct service offsets" ON direct_service_offsets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can modify direct service offsets" ON direct_service_offsets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Administrator', 'Compliance Analyst')
    )
  );

-- Create RLS Policies for community_offsets
CREATE POLICY "All authenticated users can view community offsets" ON community_offsets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can modify community offsets" ON community_offsets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Administrator', 'Compliance Analyst')
    )
  );

-- Create RLS Policies for event_applications
CREATE POLICY "All authenticated users can view event applications" ON event_applications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can modify event applications" ON event_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Administrator', 'Compliance Analyst')
    )
  );
