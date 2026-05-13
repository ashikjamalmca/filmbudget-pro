-- ============================================================
-- Film Production SaaS — Multi-Tenancy Migration
-- Migration 002: Tenants, Subscriptions, Tenant Isolation
-- Run in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. TENANTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'basic',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  max_users INTEGER NOT NULL DEFAULT 10,
  max_projects INTEGER NOT NULL DEFAULT 5,
  max_storage_gb NUMERIC(10, 2) NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_tenant ON subscriptions (tenant_id);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. ADD SUPER ADMIN FLAG + TENANT_ID TO PROFILES
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- ============================================================
-- 4. ADD TENANT_ID TO ALL DATA TABLES
-- ============================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE daily_expenses
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE music_expenses
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- ============================================================
-- 5. UPDATE handle_new_user TRIGGER (support tenant_id + is_super_admin)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, tenant_id, is_super_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer'),
    CASE
      WHEN NEW.raw_user_meta_data->>'tenant_id' IS NOT NULL AND NEW.raw_user_meta_data->>'tenant_id' != ''
      THEN (NEW.raw_user_meta_data->>'tenant_id')::uuid
      ELSE NULL
    END,
    COALESCE((NEW.raw_user_meta_data->>'is_super_admin')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 6. RLS HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(is_super_admin, FALSE) FROM profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- 7. ENABLE RLS ON NEW TABLES
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. RLS POLICIES — TENANTS
-- ============================================================

DROP POLICY IF EXISTS "tenants_super_admin_all" ON tenants;
CREATE POLICY "tenants_super_admin_all" ON tenants
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

DROP POLICY IF EXISTS "tenants_member_select" ON tenants;
CREATE POLICY "tenants_member_select" ON tenants
  FOR SELECT TO authenticated
  USING (id = auth.user_tenant_id());

-- ============================================================
-- 9. RLS POLICIES — SUBSCRIPTIONS
-- ============================================================

DROP POLICY IF EXISTS "subscriptions_super_admin" ON subscriptions;
CREATE POLICY "subscriptions_super_admin" ON subscriptions
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

DROP POLICY IF EXISTS "subscriptions_tenant_select" ON subscriptions;
CREATE POLICY "subscriptions_tenant_select" ON subscriptions
  FOR SELECT TO authenticated
  USING (tenant_id = auth.user_tenant_id());

-- ============================================================
-- 10. UPDATE PROFILES RLS
-- ============================================================

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_super_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_tenant_select" ON profiles;

CREATE POLICY "profiles_super_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "profiles_tenant_select" ON profiles
  FOR SELECT TO authenticated
  USING (
    auth.is_super_admin()
    OR tenant_id = auth.user_tenant_id()
    OR id = auth.uid()
  );

-- Keep existing: profiles_update_own, profiles_insert_any

-- ============================================================
-- 11. UPDATE PROJECTS RLS
-- ============================================================

DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_super_admin" ON projects;
DROP POLICY IF EXISTS "projects_tenant_select" ON projects;
DROP POLICY IF EXISTS "projects_tenant_insert" ON projects;
DROP POLICY IF EXISTS "projects_tenant_update" ON projects;

CREATE POLICY "projects_super_admin" ON projects
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "projects_tenant_select" ON projects
  FOR SELECT TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "projects_tenant_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'producer')
  );

CREATE POLICY "projects_tenant_update" ON projects
  FOR UPDATE TO authenticated
  USING (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'producer')
  );

-- ============================================================
-- 12. UPDATE DAILY EXPENSES RLS
-- ============================================================

DROP POLICY IF EXISTS "expenses_select" ON daily_expenses;
DROP POLICY IF EXISTS "expenses_insert" ON daily_expenses;
DROP POLICY IF EXISTS "expenses_update" ON daily_expenses;
DROP POLICY IF EXISTS "expenses_delete" ON daily_expenses;

CREATE POLICY "expenses_super_admin" ON daily_expenses
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "expenses_tenant_select" ON daily_expenses
  FOR SELECT TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "expenses_tenant_insert" ON daily_expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts', 'production-manager'))
  );

CREATE POLICY "expenses_tenant_update" ON daily_expenses
  FOR UPDATE TO authenticated
  USING (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts'))
  );

CREATE POLICY "expenses_tenant_delete" ON daily_expenses
  FOR DELETE TO authenticated
  USING (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts'))
  );

-- ============================================================
-- 13. UPDATE ARTISTS RLS
-- ============================================================

DROP POLICY IF EXISTS "artists_select" ON artists;
DROP POLICY IF EXISTS "artists_insert" ON artists;
DROP POLICY IF EXISTS "artists_update" ON artists;
DROP POLICY IF EXISTS "artists_delete" ON artists;

CREATE POLICY "artists_super_admin" ON artists
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "artists_tenant_select" ON artists
  FOR SELECT TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "artists_tenant_insert" ON artists
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts'))
  );

CREATE POLICY "artists_tenant_update" ON artists
  FOR UPDATE TO authenticated
  USING (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts'))
  );

CREATE POLICY "artists_tenant_delete" ON artists
  FOR DELETE TO authenticated
  USING (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'producer')
  );

-- ============================================================
-- 14. UPDATE MUSIC EXPENSES RLS
-- ============================================================

DROP POLICY IF EXISTS "music_select" ON music_expenses;
DROP POLICY IF EXISTS "music_insert" ON music_expenses;
DROP POLICY IF EXISTS "music_update" ON music_expenses;
DROP POLICY IF EXISTS "music_delete" ON music_expenses;

CREATE POLICY "music_super_admin" ON music_expenses
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "music_tenant_select" ON music_expenses
  FOR SELECT TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "music_tenant_insert" ON music_expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts'))
  );

CREATE POLICY "music_tenant_update" ON music_expenses
  FOR UPDATE TO authenticated
  USING (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts'))
  );

CREATE POLICY "music_tenant_delete" ON music_expenses
  FOR DELETE TO authenticated
  USING (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'producer')
  );

-- ============================================================
-- 15. UPDATE DOCUMENTS RLS
-- ============================================================

DROP POLICY IF EXISTS "documents_select" ON documents;
DROP POLICY IF EXISTS "documents_insert" ON documents;
DROP POLICY IF EXISTS "documents_delete" ON documents;

CREATE POLICY "documents_super_admin" ON documents
  FOR ALL TO authenticated
  USING (auth.is_super_admin())
  WITH CHECK (auth.is_super_admin());

CREATE POLICY "documents_tenant_select" ON documents
  FOR SELECT TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "documents_tenant_insert" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts', 'production-manager'))
  );

CREATE POLICY "documents_tenant_delete" ON documents
  FOR DELETE TO authenticated
  USING (
    tenant_id = auth.user_tenant_id()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'producer')
  );
