import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

export function useProfiles() {
  const { tenantId } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .order('full_name');
    if (error) setError(error.message);
    else setProfiles((data ?? []) as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const inviteUser = async (
    email: string,
    fullName: string,
    role: UserRole,
    assignedProjectId: string | null
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await globalThis.fetch('/api/users/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        email,
        full_name: fullName,
        role,
        assigned_project_id: assignedProjectId,
        tenant_id: tenantId,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: (body as any).error ?? 'Failed to invite user' };
    }
    await fetchProfiles();
    return { error: null };
  };

  const updateProfile = async (id: string, values: Partial<Profile>) => {
    const { error } = await (supabase as any).from('profiles').update(values).eq('id', id);
    if (error) return { error: error.message };
    await fetchProfiles();
    return { error: null };
  };

  const toggleStatus = async (id: string, isActive: boolean) => {
    const { error } = await (supabase as any).from('profiles').update({ is_active: isActive }).eq('id', id);
    if (error) return { error: error.message };
    await fetchProfiles();
    return { error: null };
  };

  return { profiles, loading, error, refetch: fetchProfiles, inviteUser, updateProfile, toggleStatus };
}
