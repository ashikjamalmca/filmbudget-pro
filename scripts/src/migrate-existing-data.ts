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

async function migrate() {
  console.log('=== Migrating existing data to Demo Tenant ===\n');

  // Get demo tenant ID
  const { data: tenant, error: te } = await (supabase as any)
    .from('tenants')
    .select('id, name')
    .eq('slug', 'demo-productions')
    .single();

  if (te || !tenant) {
    console.error('❌ Could not find demo-productions tenant:', te?.message);
    process.exit(1);
  }

  const tenantId = tenant.id;
  console.log(`✅ Demo tenant: "${tenant.name}" (${tenantId})\n`);

  const tables = ['projects', 'daily_expenses', 'artists', 'music_expenses', 'documents'] as const;

  for (const table of tables) {
    const { count, error: ce } = await (supabase as any)
      .from(table)
      .select('id', { count: 'exact' })
      .is('tenant_id', null);

    if (ce) { console.error(`❌ ${table} count error:`, ce.message); continue; }

    if (!count || count === 0) {
      console.log(`   ${table}: no rows to migrate`);
      continue;
    }

    const { error } = await (supabase as any)
      .from(table)
      .update({ tenant_id: tenantId })
      .is('tenant_id', null);

    if (error) {
      console.error(`❌ Failed to migrate ${table}:`, error.message);
    } else {
      console.log(`✅ ${table}: ${count} row(s) linked to Demo Productions`);
    }
  }

  console.log('\n✅ Data migration complete. All existing rows now belong to Demo Productions.\n');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
