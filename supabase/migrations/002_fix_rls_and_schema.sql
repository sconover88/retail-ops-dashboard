-- Run this in the Supabase SQL Editor to fix existing database
-- (Settings > SQL Editor > New Query > paste & run)

-- 1. Add UNIQUE constraint on stores.name (required for seed upsert)
ALTER TABLE stores ADD CONSTRAINT stores_name_unique UNIQUE (name);

-- 2. Drop restrictive store SELECT policies
DROP POLICY IF EXISTS "Managers can view all stores" ON stores;
DROP POLICY IF EXISTS "Assistants can view assigned stores" ON stores;

-- 3. Add permissive SELECT policy for stores
CREATE POLICY "Authenticated users can view stores"
  ON stores FOR SELECT
  TO authenticated
  USING (true);
