-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'Administrator'
    )
  );

-- RLS Policies for municipalities table
CREATE POLICY "All authenticated users can view municipalities" ON municipalities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can modify municipalities" ON municipalities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Administrator', 'Compliance Analyst')
    )
  );

-- RLS Policies for collection_sites table
CREATE POLICY "All authenticated users can view sites" ON collection_sites
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can modify sites" ON collection_sites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Administrator', 'Compliance Analyst')
    )
  );

-- RLS Policies for reallocations table
CREATE POLICY "All authenticated users can view reallocations" ON reallocations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can create reallocations" ON reallocations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Administrator', 'Compliance Analyst')
    )
  );

CREATE POLICY "Admins can approve reallocations" ON reallocations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'Administrator'
    )
  );

-- RLS Policies for compliance_calculations table
CREATE POLICY "All authenticated users can view compliance data" ON compliance_calculations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and analysts can modify compliance data" ON compliance_calculations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('Administrator', 'Compliance Analyst')
    )
  );

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'Administrator'
    )
  );

CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (user_id::text = auth.uid()::text);
