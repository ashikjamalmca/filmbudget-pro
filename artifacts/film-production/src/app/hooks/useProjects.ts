import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Database } from '../../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

export function useProjects() {
  const { tenantId } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setProjects((data ?? []) as Project[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = async (values: Omit<ProjectInsert, 'created_by' | 'tenant_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };
    if (!tenantId) return { error: 'No tenant assigned' };
    const { error } = await (supabase as any)
      .from('projects')
      .insert({ ...values, created_by: user.id, tenant_id: tenantId });
    if (error) return { error: error.message };
    await fetchProjects();
    return { error: null };
  };

  const updateProject = async (id: string, values: Partial<ProjectInsert>) => {
    const { error } = await (supabase as any).from('projects').update(values).eq('id', id);
    if (error) return { error: error.message };
    await fetchProjects();
    return { error: null };
  };

  return { projects, loading, error, refetch: fetchProjects, createProject, updateProject };
}
