import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type RemunerationStatus = 'pending' | 'partial' | 'complete';

export interface RemunerationEntry {
  id: string;
  tenant_id: string | null;
  project_id: string;
  department: string;
  role: string;
  person_name: string;
  item_service: string | null;
  agreed_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: RemunerationStatus;
  paid_by: string | null;
  payment_date: string | null;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RemunerationPayment {
  id: string;
  remuneration_id: string;
  tenant_id: string | null;
  amount: number;
  payment_date: string;
  paid_by: string | null;
  remarks: string | null;
  expense_id: string | null;
  created_by: string | null;
  created_at: string;
}

export const DEPARTMENTS = [
  'Cast & Artists',
  'Direction',
  'Camera',
  'Sound & Music',
  'Costume & Makeup',
  'Art & Sets',
  'Editing',
  'VFX & Post Production',
  'Production',
  'Finance & Accounts',
  'Other',
] as const;

export function useRemuneration(projectId: string | null) {
  const { tenantId } = useAuth();
  const [entries, setEntries] = useState<RemunerationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!projectId) { setEntries([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('remuneration_entries')
      .select('*')
      .eq('project_id', projectId)
      .order('department')
      .order('person_name');
    if (error) setError(error.message);
    else setEntries((data ?? []) as RemunerationEntry[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const addEntry = async (values: {
    department: string;
    role: string;
    person_name: string;
    item_service?: string | null;
    agreed_amount: number;
    paid_by?: string | null;
    payment_date?: string | null;
    remarks?: string | null;
  }) => {
    if (!projectId) return { error: 'No project selected' };
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from('remuneration_entries').insert({
      ...values,
      project_id: projectId,
      tenant_id: tenantId,
      paid_amount: 0,
      status: 'pending',
      created_by: user?.id ?? null,
    });
    if (error) return { error: error.message };
    await fetchEntries();
    return { error: null };
  };

  const updateEntry = async (id: string, values: Partial<Pick<RemunerationEntry,
    'department' | 'role' | 'person_name' | 'item_service' | 'agreed_amount' | 'remarks'
  >>) => {
    const { error } = await (supabase as any)
      .from('remuneration_entries').update(values).eq('id', id);
    if (error) return { error: error.message };
    await fetchEntries();
    return { error: null };
  };

  const deleteEntry = async (id: string) => {
    const { error } = await (supabase as any)
      .from('remuneration_entries').delete().eq('id', id);
    if (error) return { error: error.message };
    await fetchEntries();
    return { error: null };
  };

  const addPayment = async (
    entryId: string,
    amount: number,
    paymentDate: string,
    paidBy: string | null,
    remarks: string | null,
    expenseId: string | null = null,
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error: payErr } = await (supabase as any).from('remuneration_payments').insert({
      remuneration_id: entryId,
      tenant_id: tenantId,
      amount,
      payment_date: paymentDate,
      paid_by: paidBy,
      remarks,
      expense_id: expenseId,
      created_by: user?.id ?? null,
    });
    if (payErr) return { error: payErr.message };

    // Recalculate paid_amount by summing all payments
    const { data: payments } = await (supabase as any)
      .from('remuneration_payments')
      .select('amount')
      .eq('remuneration_id', entryId);
    const totalPaid = (payments ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0);

    const { data: entry } = await (supabase as any)
      .from('remuneration_entries').select('agreed_amount').eq('id', entryId).single();
    const agreedAmount = entry?.agreed_amount ?? 0;
    const status: RemunerationStatus =
      totalPaid === 0 ? 'pending' : totalPaid >= agreedAmount ? 'complete' : 'partial';

    await (supabase as any).from('remuneration_entries').update({
      paid_amount: totalPaid,
      status,
      payment_date: paymentDate,
      paid_by: paidBy,
    }).eq('id', entryId);

    await fetchEntries();
    return { error: null };
  };

  const fetchPayments = async (entryId: string): Promise<RemunerationPayment[]> => {
    const { data } = await (supabase as any)
      .from('remuneration_payments')
      .select('*')
      .eq('remuneration_id', entryId)
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false });
    return (data ?? []) as RemunerationPayment[];
  };

  const deletePayment = async (paymentId: string, entryId: string) => {
    const { error } = await (supabase as any)
      .from('remuneration_payments').delete().eq('id', paymentId);
    if (error) return { error: error.message };

    // Recalculate
    const { data: payments } = await (supabase as any)
      .from('remuneration_payments').select('amount').eq('remuneration_id', entryId);
    const totalPaid = (payments ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0);
    const { data: entry } = await (supabase as any)
      .from('remuneration_entries').select('agreed_amount').eq('id', entryId).single();
    const agreedAmount = entry?.agreed_amount ?? 0;
    const status: RemunerationStatus =
      totalPaid === 0 ? 'pending' : totalPaid >= agreedAmount ? 'complete' : 'partial';
    await (supabase as any).from('remuneration_entries')
      .update({ paid_amount: totalPaid, status }).eq('id', entryId);

    await fetchEntries();
    return { error: null };
  };

  return {
    entries, loading, error,
    refetch: fetchEntries,
    addEntry, updateEntry, deleteEntry,
    addPayment, fetchPayments, deletePayment,
  };
}
