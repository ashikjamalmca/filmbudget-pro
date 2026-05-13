import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type DailyExpense = Database['public']['Tables']['daily_expenses']['Row'];

export interface ExpensePageResult {
  data: DailyExpense[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalAmount: number;
}

export interface ExpenseFilters {
  search: string;
  fromDate: string;
  toDate: string;
  categoryId: string;
  payMethod: string;
  paidBy: string;
}

export function useExpensesPage(
  projectId: string | null,
  page: number,
  pageSize: number,
  filters: ExpenseFilters,
) {
  const [result, setResult] = useState<ExpensePageResult>({
    data: [],
    total: 0,
    page: 1,
    pageSize,
    totalPages: 1,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not authenticated'); setLoading(false); return; }

    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filters.search)     params.set('search',     filters.search);
    if (filters.fromDate)   params.set('fromDate',   filters.fromDate);
    if (filters.toDate)     params.set('toDate',     filters.toDate);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.payMethod)  params.set('payMethod',  filters.payMethod);
    if (filters.paidBy)     params.set('paidBy',     filters.paidBy);

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setError((err as any).error ?? 'Failed to load expenses');
        setLoading(false);
        return;
      }
      const json: ExpensePageResult = await res.json();
      setResult(json);
    } catch (e: any) {
      setError(e.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }, [
    projectId, page, pageSize,
    filters.search, filters.fromDate, filters.toDate,
    filters.categoryId, filters.payMethod, filters.paidBy,
  ]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  return {
    expenses: result.data,
    total: result.total,
    totalPages: result.totalPages,
    totalAmount: result.totalAmount,
    loading,
    error,
    refetch: fetchPage,
  };
}
