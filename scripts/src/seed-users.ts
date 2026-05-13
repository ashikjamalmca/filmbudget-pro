import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['SUPABASE_URL']!;
const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  {
    email: 'producer@filmbudget.com',
    password: 'FilmPro@2025',
    full_name: 'Arjun Menon',
    role: 'producer',
  },
  {
    email: 'accounts@filmbudget.com',
    password: 'FilmPro@2025',
    full_name: 'Priya Sharma',
    role: 'accounts',
  },
  {
    email: 'manager@filmbudget.com',
    password: 'FilmPro@2025',
    full_name: 'Ravi Kumar',
    role: 'production-manager',
  },
  {
    email: 'viewer@filmbudget.com',
    password: 'FilmPro@2025',
    full_name: 'Sana Malik',
    role: 'viewer',
  },
];

async function applyMigration() {
  console.log('Applying database schema...\n');

  // Run DDL via the postgres REST endpoint using service role
  const statements = [
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    `DO $$ BEGIN
       CREATE TYPE user_role AS ENUM ('producer','accounts','production-manager','viewer');
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE TYPE payment_status AS ENUM ('pending','partial','complete');
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE TYPE document_file_type AS ENUM ('pdf','image','excel','other');
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `CREATE TABLE IF NOT EXISTS profiles (
       id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
       email TEXT NOT NULL,
       full_name TEXT NOT NULL,
       role user_role NOT NULL DEFAULT 'viewer',
       assigned_project_id UUID,
       is_active BOOLEAN NOT NULL DEFAULT TRUE,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS projects (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       title TEXT NOT NULL,
       date_range TEXT,
       total_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
       poster_url TEXT,
       created_by UUID NOT NULL REFERENCES auth.users(id),
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS daily_expenses (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
       expense_date DATE NOT NULL,
       department TEXT NOT NULL,
       account_head TEXT NOT NULL,
       amount NUMERIC(12,2) NOT NULL DEFAULT 0,
       nos INTEGER NOT NULL DEFAULT 1,
       total NUMERIC(12,2) NOT NULL DEFAULT 0,
       bill_url TEXT,
       added_by UUID NOT NULL REFERENCES auth.users(id),
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS artists (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
       name TEXT NOT NULL,
       role TEXT NOT NULL,
       budget NUMERIC(12,2) NOT NULL DEFAULT 0,
       paid NUMERIC(12,2) NOT NULL DEFAULT 0,
       balance NUMERIC(12,2) NOT NULL DEFAULT 0,
       status payment_status NOT NULL DEFAULT 'pending',
       notes TEXT NOT NULL DEFAULT '',
       contract_url TEXT,
       type TEXT NOT NULL CHECK (type IN ('artist','technician')),
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS music_expenses (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
       role TEXT NOT NULL,
       description TEXT NOT NULL DEFAULT '',
       budget NUMERIC(12,2) NOT NULL DEFAULT 0,
       paid NUMERIC(12,2) NOT NULL DEFAULT 0,
       balance NUMERIC(12,2) NOT NULL DEFAULT 0,
       remarks TEXT NOT NULL DEFAULT '',
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS documents (
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
     )`,
    `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE projects ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE artists ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE music_expenses ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE documents ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
       CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "profiles_service_insert" ON profiles FOR INSERT TO service_role WITH CHECK (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated WITH CHECK (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "expenses_select" ON daily_expenses FOR SELECT TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "expenses_insert" ON daily_expenses FOR INSERT TO authenticated WITH CHECK (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "expenses_update" ON daily_expenses FOR UPDATE TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "expenses_delete" ON daily_expenses FOR DELETE TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "artists_select" ON artists FOR SELECT TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "artists_insert" ON artists FOR INSERT TO authenticated WITH CHECK (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "artists_update" ON artists FOR UPDATE TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "artists_delete" ON artists FOR DELETE TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "music_select" ON music_expenses FOR SELECT TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "music_insert" ON music_expenses FOR INSERT TO authenticated WITH CHECK (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "music_update" ON music_expenses FOR UPDATE TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "music_delete" ON music_expenses FOR DELETE TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "documents_select" ON documents FOR SELECT TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "documents_insert" ON documents FOR INSERT TO authenticated WITH CHECK (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN
       CREATE POLICY "documents_delete" ON documents FOR DELETE TO authenticated USING (TRUE);
     EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  ];

  for (const sql of statements) {
    const { error } = await supabase.rpc('exec_sql', { query: sql }).single().catch(() => ({ error: null, data: null }));
    // If exec_sql doesn't exist we'll fall through — that's OK
  }

  // Try via direct REST query endpoint
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
  console.log(`Project ref: ${projectRef}`);

  for (const sql of statements) {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    // Ignore errors here — exec_sql may not exist
  }
}

async function seed() {
  // First, try to apply migration
  await applyMigration();

  console.log('\nCreating auth users...\n');

  for (const u of users) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });

    let userId: string | null = null;

    if (authError) {
      if (
        authError.message.toLowerCase().includes('already') ||
        authError.message.toLowerCase().includes('exists')
      ) {
        console.log(`⚠️  ${u.email} already exists in auth`);
        // Get existing user id
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existing = listData?.users?.find(usr => usr.email === u.email);
        if (existing) userId = existing.id;
      } else {
        console.error(`❌ Auth error for ${u.email}: ${authError.message}`);
        continue;
      }
    } else {
      userId = authData.user.id;
      console.log(`✅ Auth user created: ${u.email} (id: ${userId})`);
    }

    if (!userId) continue;

    // Upsert profile
    const profilePayload = {
      id: userId,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      is_active: true,
    };

    const { error: profileError } = await (supabase as any).from('profiles').upsert(profilePayload);
    if (profileError) {
      console.error(`   ❌ Profile error for ${u.full_name}: ${profileError.message}`);
    } else {
      console.log(`   ✅ Profile: ${u.full_name} (${u.role})`);
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log('Login credentials — Password: FilmPro@2025');
  console.log('─────────────────────────────────────────');
  for (const u of users) {
    console.log(`  ${u.role.padEnd(22)} ${u.email}`);
  }
  console.log('─────────────────────────────────────────\n');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
