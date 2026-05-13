import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Database } from '../../lib/database.types';

type DailyExpense = Database['public']['Tables']['daily_expenses']['Row'];

export function useDailyExpenses(projectId: string | null) {
  const { tenantId } = useAuth();
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!projectId) { setExpenses([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('daily_expenses')
      .select('*')
      .eq('project_id', projectId)
      .order('expense_date', { ascending: false });
    if (error) setError(error.message);
    else setExpenses((data ?? []) as DailyExpense[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const addExpenses = async (rows: Array<{
    expense_date: string;
    department: string;
    account_head: string;
    amount: number;
    nos: number;
    bill_url: string | null;
    paid_by?: string | null;
    description?: string | null;
    category_id?: string | null;
    subcategory_id?: string | null;
  }>) => {
    if (!projectId) return { error: 'No project selected' };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };
    const inserts = rows.map(r => ({
      project_id: projectId,
      tenant_id: tenantId,
      added_by: user.id,
      expense_date: r.expense_date,
      department: r.department,
      account_head: r.account_head,
      amount: r.amount,
      nos: r.nos,
      total: r.amount * r.nos,
      bill_url: r.bill_url ?? null,
      paid_by: r.paid_by ?? null,
      description: r.description ?? null,
      category_id: r.category_id ?? null,
      subcategory_id: r.subcategory_id ?? null,
    }));
    const { error } = await (supabase as any).from('daily_expenses').insert(inserts);
    if (error) return { error: error.message };
    await fetchExpenses();
    return { error: null };
  };

  const deleteExpense = async (id: string) => {
    const { error } = await (supabase as any).from('daily_expenses').delete().eq('id', id);
    if (error) return { error: error.message };
    await fetchExpenses();
    return { error: null };
  };

  const uploadBill = async (expenseId: string, file: File) => {
    const path = `bills/${expenseId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file, { upsert: true });
    if (uploadError) return { error: uploadError.message, url: null };
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    const { error: updateError } = await (supabase as any)
      .from('daily_expenses')
      .update({ bill_url: data.publicUrl })
      .eq('id', expenseId);
    if (updateError) return { error: updateError.message, url: null };
    await fetchExpenses();
    return { error: null, url: data.publicUrl };
  };

  return { expenses, loading, error, refetch: fetchExpenses, addExpenses, deleteExpense, uploadBill };
}
