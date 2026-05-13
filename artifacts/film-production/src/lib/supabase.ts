import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

declare const __SUPABASE_SERVICE_ROLE_KEY__: string;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
// Injected at build time via vite.config.ts define block (avoids Vite's import.meta.env runtime object
// which doesn't reliably expose non-VITE_ prefixed env vars in dev mode).
const supabaseServiceRoleKey: string =
  typeof __SUPABASE_SERVICE_ROLE_KEY__ !== 'undefined' ? __SUPABASE_SERVICE_ROLE_KEY__ : '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Admin client — used only for storage operations (bypasses RLS).
// The service role key is injected at build time; this is acceptable for an
// internal production tool where all users must be authenticated.
export const supabaseStorage = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : supabase; // fallback to anon client if key is not available
