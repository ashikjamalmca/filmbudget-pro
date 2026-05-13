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

const SUPER_ADMIN_EMAIL = 'admin@filmbudget.com';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin@2025';
const SUPER_ADMIN_NAME = 'Platform Admin';

const DEMO_TENANT_NAME = 'Demo Productions';
const DEMO_TENANT_SLUG = 'demo-productions';
const DEMO_PRODUCER_EMAIL = 'producer@filmbudget.com';

async function getUserByEmail(email: string) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return data?.users?.find(u => u.email === email) ?? null;
}

async function seed() {
  console.log('=== Seeding SaaS Platform Data ===\n');

  // 1. Create Super Admin
  console.log('1. Creating Super Admin user...');
  let superAdminId: string;

  let existingSA = await getUserByEmail(SUPER_ADMIN_EMAIL);
  if (existingSA) {
    console.log(`   ⚠️  Super admin already exists: ${SUPER_ADMIN_EMAIL}`);
    superAdminId = existingSA.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: SUPER_ADMIN_NAME, is_super_admin: true },
    });
    if (error) { console.error('   ❌', error.message); process.exit(1); }
    superAdminId = data.user.id;
    console.log(`   ✅ Created: ${SUPER_ADMIN_EMAIL}`);
  }

  // Upsert super admin profile (no tenant_id)
  await (supabase as any).from('profiles').upsert({
    id: superAdminId,
    email: SUPER_ADMIN_EMAIL,
    full_name: SUPER_ADMIN_NAME,
    role: 'producer',
    tenant_id: null,
    is_super_admin: true,
    is_active: true,
  });
  console.log('   ✅ Super admin profile set\n');

  // 2. Create Demo Tenant for existing producer
  console.log('2. Creating Demo Tenant...');

  const { data: existingTenant } = await (supabase as any)
    .from('tenants')
    .select('*')
    .eq('slug', DEMO_TENANT_SLUG)
    .single();

  let tenantId: string;

  if (existingTenant) {
    console.log(`   ⚠️  Tenant "${DEMO_TENANT_NAME}" already exists`);
    tenantId = existingTenant.id;
  } else {
    const demoProducer = await getUserByEmail(DEMO_PRODUCER_EMAIL);
    const { data: tenant, error: tenantError } = await (supabase as any)
      .from('tenants')
      .insert({
        name: DEMO_TENANT_NAME,
        slug: DEMO_TENANT_SLUG,
        owner_id: demoProducer?.id ?? null,
        is_active: true,
        created_by: superAdminId,
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error('   ❌ Failed to create tenant:', tenantError?.message);
      process.exit(1);
    }
    tenantId = tenant.id;
    console.log(`   ✅ Created tenant: ${DEMO_TENANT_NAME} (${tenantId})`);
  }

  // 3. Create subscription for demo tenant
  console.log('\n3. Creating subscription for Demo Tenant...');
  const { data: existingSub } = await (supabase as any)
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (existingSub) {
    console.log('   ⚠️  Subscription already exists');
  } else {
    const { error: subError } = await (supabase as any).from('subscriptions').insert({
      tenant_id: tenantId,
      plan_name: 'professional',
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      max_users: 20,
      max_projects: 10,
      max_storage_gb: 50,
      is_active: true,
      notes: 'Demo tenant - annual professional plan',
      created_by: superAdminId,
    });
    if (subError) console.error('   ❌', subError.message);
    else console.log('   ✅ Professional plan subscription created (1 year)');
  }

  // 4. Link existing 4 users to Demo Tenant
  console.log('\n4. Linking existing users to Demo Tenant...');
  const existingUsers = [
    'producer@filmbudget.com',
    'accounts@filmbudget.com',
    'manager@filmbudget.com',
    'viewer@filmbudget.com',
  ];

  for (const email of existingUsers) {
    const authUser = await getUserByEmail(email);
    if (!authUser) { console.log(`   ⚠️  ${email} not found, skipping`); continue; }

    const { error } = await (supabase as any)
      .from('profiles')
      .update({ tenant_id: tenantId })
      .eq('id', authUser.id);

    if (error) console.error(`   ❌ ${email}: ${error.message}`);
    else console.log(`   ✅ Linked: ${email}`);
  }

  // Also set the producer as tenant owner
  const producer = await getUserByEmail(DEMO_PRODUCER_EMAIL);
  if (producer) {
    await (supabase as any).from('tenants').update({ owner_id: producer.id }).eq('id', tenantId);
    console.log('   ✅ Producer set as tenant owner');
  }

  console.log('\n════════════════════════════════════════════');
  console.log('✅ SaaS Platform Seeding Complete!');
  console.log('════════════════════════════════════════════');
  console.log('\nSuper Admin Login:');
  console.log(`  Email:    ${SUPER_ADMIN_EMAIL}`);
  console.log(`  Password: ${SUPER_ADMIN_PASSWORD}`);
  console.log('\nDemo Tenant (producer@filmbudget.com):');
  console.log('  All existing users linked to "Demo Productions" tenant');
  console.log('  Password: FilmPro@2025');
  console.log('════════════════════════════════════════════\n');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
