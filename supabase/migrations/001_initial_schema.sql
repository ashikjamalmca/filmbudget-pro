-- ============================================================
-- Film Production Budget App — Initial Schema
-- Run this in the Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('producer', 'accounts', 'production-manager', 'viewer');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'complete');
CREATE TYPE document_file_type AS ENUM ('pdf', 'image', 'excel', 'other');

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  assigned_project_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile when a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date_range TEXT,
  total_budget NUMERIC(15, 2) NOT NULL DEFAULT 0,
  poster_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add FK from profiles to projects (deferred to avoid circular dependency)
ALTER TABLE profiles
  ADD CONSTRAINT profiles_assigned_project_fk
  FOREIGN KEY (assigned_project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- ============================================================
-- DAILY EXPENSES
-- ============================================================

CREATE TABLE daily_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  department TEXT NOT NULL,
  account_head TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  nos INTEGER NOT NULL DEFAULT 1,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bill_url TEXT,
  added_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX daily_expenses_project_date ON daily_expenses (project_id, expense_date DESC);

CREATE TRIGGER daily_expenses_updated_at
  BEFORE UPDATE ON daily_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ARTISTS & TECHNICIANS
-- ============================================================

CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT NOT NULL DEFAULT '',
  contract_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('artist', 'technician')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX artists_project_type ON artists (project_id, type);

CREATE TRIGGER artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- MUSIC EXPENSES (Song & BGM)
-- ============================================================

CREATE TABLE music_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  remarks TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX music_expenses_project ON music_expenses (project_id);

CREATE TRIGGER music_expenses_updated_at
  BEFORE UPDATE ON music_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DOCUMENTS
-- ============================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type document_file_type NOT NULL DEFAULT 'other',
  department TEXT NOT NULL,
  linked_expense TEXT,
  storage_path TEXT NOT NULL,
  file_size TEXT NOT NULL DEFAULT '0 KB',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX documents_project ON documents (project_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read all profiles; update only their own
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_service" ON profiles FOR INSERT TO service_role WITH CHECK (TRUE);

-- PROJECTS: authenticated users can read all; producers can insert/update
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer')));
CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer')));

-- DAILY EXPENSES: authenticated users with appropriate roles
CREATE POLICY "expenses_select" ON daily_expenses FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "expenses_insert" ON daily_expenses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts', 'production-manager')));
CREATE POLICY "expenses_update" ON daily_expenses FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts')));
CREATE POLICY "expenses_delete" ON daily_expenses FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts')));

-- ARTISTS: similar to expenses
CREATE POLICY "artists_select" ON artists FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "artists_insert" ON artists FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts')));
CREATE POLICY "artists_update" ON artists FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts')));
CREATE POLICY "artists_delete" ON artists FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer')));

-- MUSIC EXPENSES
CREATE POLICY "music_select" ON music_expenses FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "music_insert" ON music_expenses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts')));
CREATE POLICY "music_update" ON music_expenses FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts')));
CREATE POLICY "music_delete" ON music_expenses FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer')));

-- DOCUMENTS
CREATE POLICY "documents_select" ON documents FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "documents_insert" ON documents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer', 'accounts', 'production-manager')));
CREATE POLICY "documents_delete" ON documents FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('producer')));

-- ============================================================
-- STORAGE BUCKET SETUP (run after creating bucket in dashboard)
-- ============================================================
-- 1. Create a bucket named "documents" in Storage dashboard
-- 2. Set it to PUBLIC (for direct download URLs)
-- 3. Run the storage policies below:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
--   ON CONFLICT DO NOTHING;

-- CREATE POLICY "storage_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
-- CREATE POLICY "storage_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
-- CREATE POLICY "storage_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- SEED DATA (optional — remove if you want a clean slate)
-- ============================================================
-- The app will seed data when the first producer logs in and
-- creates their first project via the UI.
