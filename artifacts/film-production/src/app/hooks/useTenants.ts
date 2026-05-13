import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Tenant = Database['public']['Tables']['tenants']['Row'];

export interface TenantWithStats extends Tenant {
  user_count: number;
  project_count: number;
  subscription: Database['public']['Tables']['subscriptions']['Row'] | null;
}

export function useTenants() {
  const [tenants, setTenants] = useState<TenantWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    const { data: tenantsData, error: te } = await (supabase as any)
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (te) { setError(te.message); setLoading(false); return; }

    const tenantList = (tenantsData ?? []) as Tenant[];

    const enriched = await Promise.all(tenantList.map(async (t) => {
      const [usersRes, projectsRes, subRes] = await Promise.all([
        (supabase as any).from('profiles').select('id', { count: 'exact' }).eq('tenant_id', t.id),
        (supabase as any).from('projects').select('id', { count: 'exact' }).eq('tenant_id', t.id),
        (supabase as any)
          .from('subscriptions')
          .select('*')
          .eq('tenant_id', t.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ]);
      return {
        ...t,
        user_count: usersRes.count ?? 0,
        project_count: projectsRes.count ?? 0,
        subscription: subRes.data ?? null,
      } as TenantWithStats;
    }));

    setTenants(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const createTenant = async (payload: {
    company_name: string;
    slug: string;
    producer_name: string;
    producer_email: string;
    plan_name: string;
    max_users: number;
    max_projects: number;
    max_storage_gb: number;
    valid_until: string | null;
    notes: string;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await globalThis.fetch('/api/tenants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: (body as any).error ?? 'Failed to create tenant' };
    }
    await fetchTenants();
    return { error: null };
  };

  const updateTenant = async (id: string, values: Partial<Tenant>) => {
    const { error } = await (supabase as any).from('tenants').update(values).eq('id', id);
    if (error) return { error: error.message };
    await fetchTenants();
    return { error: null };
  };

  const suspendTenant = async (id: string, reason: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await globalThis.fetch(`/api/tenants/${id}/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: (body as any).error ?? 'Failed to suspend tenant' };
    }
    await fetchTenants();
    return { error: null };
  };

  const activateTenant = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await globalThis.fetch(`/api/tenants/${id}/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: (body as any).error ?? 'Failed to activate tenant' };
    }
    await fetchTenants();
    return { error: null };
  };

  return { tenants, loading, error, refetch: fetchTenants, createTenant, updateTenant, suspendTenant, activateTenant };
}
