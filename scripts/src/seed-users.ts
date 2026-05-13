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

async function getUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error || !data) return null;
  return data.users.find(u => u.email === email)?.id ?? null;
}

async function seed() {
  console.log('Seeding initial users...\n');

  for (const u of users) {
    let userId: string | null = null;

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes('already') || msg.includes('exists')) {
        console.log(`⚠️  ${u.email} — already exists in auth`);
        userId = await getUserIdByEmail(u.email);
      } else {
        console.error(`❌ Auth error for ${u.email}: ${authError.message}`);
        continue;
      }
    } else {
      userId = authData.user.id;
      console.log(`✅ Auth user created: ${u.full_name} (${u.email})`);
    }

    if (!userId) {
      console.error(`   ❌ Could not resolve user ID for ${u.email}`);
      continue;
    }

    // Upsert profile (service_role bypasses RLS)
    const { error: profileError } = await (supabase as any).from('profiles').upsert({
      id: userId,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      is_active: true,
    });

    if (profileError) {
      console.error(`   ❌ Profile error for ${u.full_name}: ${profileError.message}`);
    } else {
      console.log(`   ✅ Profile upserted: ${u.full_name} (${u.role})`);
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log('✅ Done! Login with password: FilmPro@2025');
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
