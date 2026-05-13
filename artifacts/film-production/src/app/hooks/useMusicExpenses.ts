import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Database } from '../../lib/database.types';

type MusicExpense = Database['public']['Tables']['music_expenses']['Row'];

export function useMusicExpenses(projectId: string | null) {
  const { tenantId } = useAuth();
  const [expenses, setExpenses] = useState<MusicExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!projectId) { setExpenses([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('music_expenses')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');
    if (error) setError(error.message);
    else setExpenses((data ?? []) as MusicExpense[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const addExpense = async (values: {
    role: string;
    description: string;
    budget: number;
    remarks: string;
  }) => {
    if (!projectId) return { error: 'No project selected' };
    const { error } = await (supabase as any).from('music_expenses').insert({
      ...values,
      project_id: projectId,
      tenant_id: tenantId,
      paid: 0,
      balance: values.budget,
    });
    if (error) return { error: error.message };
    await fetchExpenses();
    return { error: null };
  };

  const updatePayment = async (id: string, paid: number, budget: number) => {
    const { error } = await (supabase as any)
      .from('music_expenses')
      .update({ paid, balance: budget - paid })
      .eq('id', id);
    if (error) return { error: error.message };
    await fetchExpenses();
    return { error: null };
  };

  const deleteExpense = async (id: string) => {
    const { error } = await (supabase as any).from('music_expenses').delete().eq('id', id);
    if (error) return { error: error.message };
    await fetchExpenses();
    return { error: null };
  };

  return { expenses, loading, error, refetch: fetchExpenses, addExpense, updatePayment, deleteExpense };
}
