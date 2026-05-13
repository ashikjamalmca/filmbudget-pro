import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export function useSubscriptions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSubscription = useCallback(async (tenantId: string): Promise<Subscription | null> => {
    const { data } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return data ?? null;
  }, []);

  const updateSubscription = async (
    subscriptionId: string,
    values: {
      plan_name?: string;
      valid_until?: string | null;
      max_users?: number;
      max_projects?: number;
      max_storage_gb?: number;
      notes?: string;
    }
  ) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await globalThis.fetch(`/api/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(values),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = (body as any).error ?? 'Failed to update subscription';
      setError(err);
      return { error: err };
    }
    return { error: null };
  };

  return { loading, error, getSubscription, updateSubscription };
}
