import { createClient } from '@supabase/supabase-js';

const url = process.env['SUPABASE_URL']!;
const key = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// Check profiles columns
const { data: cols, error: ce } = await (sb as any)
  .from('information_schema.columns')
  .select('column_name,data_type,is_nullable,column_default')
  .eq('table_schema', 'public')
  .eq('table_name', 'profiles');
console.log('profiles columns:', ce ? ce.message : JSON.stringify(cols, null, 2));

// Check triggers on auth.users
const { data: trigs, error: te } = await (sb as any)
  .from('information_schema.triggers')
  .select('trigger_name,event_manipulation,action_timing')
  .eq('event_object_schema', 'auth')
  .eq('event_object_table', 'users');
console.log('\ntriggers on auth.users:', te ? te.message : JSON.stringify(trigs, null, 2));

// Check RLS policies on profiles
const { data: policies, error: pe } = await (sb as any)
  .from('pg_policies')
  .select('policyname,cmd,roles,qual,with_check')
  .eq('tablename', 'profiles');
console.log('\nprofiles RLS policies:', pe ? pe.message : JSON.stringify(policies, null, 2));

// Check who owns handle_new_user function
const { data: funcs, error: fe } = await (sb as any)
  .from('pg_proc')
  .select('proname,prosecdef,proowner')
  .eq('proname', 'handle_new_user');
console.log('\nhandle_new_user function:', fe ? fe.message : JSON.stringify(funcs, null, 2));
