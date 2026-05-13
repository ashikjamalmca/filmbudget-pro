import { useState, useEffect } from 'react';
import { supabase, supabaseStorage } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Database } from '../../lib/database.types';

type DailyExpense = Database['public']['Tables']['daily_expenses']['Row'];

export interface ExpenseFilters {
  search: string;
  fromDate: string;
  toDate: string;
  categoryId: string;
  payMethod: string;
  paidBy: string;
}

export interface CategoryStat {
  name: string;
  total: number;
  count: number;
  pct: number;
}

export interface PayMethodStat {
  method: string;
  count: number;
  total: number;
}

export interface ExpenseStats {
  totalSpend: number;
  totalCount: number;
  daysCount: number;
  dailyAvg: number;
  avgPerEntry: number;
  withAttachment: number;
  topCategory: string;
  topPayMethod: string;
  categoryBreakdown: CategoryStat[];
  payMethodBreakdown: PayMethodStat[];
}

function applyFilters(query: any, projectId: string, filters: ExpenseFilters) {
  query = query.eq('project_id', projectId);
  if (filters.fromDate) query = query.gte('expense_date', filters.fromDate);
  if (filters.toDate) query = query.lte('expense_date', filters.toDate);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.payMethod) query = query.eq('pay_method', filters.payMethod);
  if (filters.paidBy) query = query.eq('paid_by', filters.paidBy);
  if (filters.search.trim()) {
    const term = filters.search.trim().replace(/[%_]/g, '\\$&');
    query = query.or(
      `account_head.ilike.%${term}%,description.ilike.%${term}%,department.ilike.%${term}%,paid_by.ilike.%${term}%,reference_no.ilike.%${term}%`,
    );
  }
  return query;
}

export function usePaginatedExpenses(
  projectId: string | null,
  filters: ExpenseFilters,
  page: number,
  pageSize: number,
) {
  const { tenantId } = useAuth();
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (!projectId) { setExpenses([]); setTotalCount(0); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const q = applyFilters(
        (supabase as any).from('daily_expenses').select('*', { count: 'exact' }),
        projectId,
        filters,
      )
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, count, error: err } = await q;
      if (cancelled) return;
      if (err) setError(err.message);
      else { setExpenses((data ?? []) as DailyExpense[]); setTotalCount(count ?? 0); }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, filtersKey, from, to]);

  useEffect(() => {
    if (!projectId) { setStats(null); setStatsLoading(false); return; }
    let cancelled = false;
    setStatsLoading(true);
    (async () => {
      const { data } = await applyFilters(
        (supabase as any)
          .from('daily_expenses')
          .select('total,department,pay_method,expense_date,bill_url'),
        projectId,
        filters,
      );
      if (cancelled) return;
      const rows = (data ?? []) as any[];

      const totalSpend = rows.reduce((s: number, r: any) => s + (r.total ?? 0), 0);
      const count = rows.length;
      const uniqueDays = new Set(rows.map((r: any) => r.expense_date)).size;
      const dailyAvg = uniqueDays > 0 ? totalSpend / uniqueDays : 0;
      const avgPerEntry = count > 0 ? totalSpend / count : 0;
      const withAttachment = rows.filter((r: any) => r.bill_url).length;

      const catMap: Record<string, { total: number; count: number }> = {};
      for (const r of rows) {
        const key = r.department || 'Uncategorized';
        if (!catMap[key]) catMap[key] = { total: 0, count: 0 };
        catMap[key].total += r.total ?? 0;
        catMap[key].count++;
      }
      const categoryBreakdown: CategoryStat[] = Object.entries(catMap)
        .map(([name, v]) => ({ name, ...v, pct: totalSpend > 0 ? (v.total / totalSpend) * 100 : 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      const pmMap: Record<string, { count: number; total: number }> = {};
      for (const r of rows) {
        const key = r.pay_method || 'Unknown';
        if (!pmMap[key]) pmMap[key] = { count: 0, total: 0 };
        pmMap[key].count++;
        pmMap[key].total += r.total ?? 0;
      }
      const payMethodBreakdown: PayMethodStat[] = Object.entries(pmMap)
        .map(([method, v]) => ({ method, ...v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setStats({
        totalSpend,
        totalCount: count,
        daysCount: uniqueDays,
        dailyAvg,
        avgPerEntry,
        withAttachment,
        topCategory: categoryBreakdown[0]?.name ?? '—',
        topPayMethod: payMethodBreakdown[0]?.method ?? '—',
        categoryBreakdown,
        payMethodBreakdown,
      });
      setStatsLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, filtersKey]);

  const deleteExpense = async (id: string) => {
    const { error: err } = await (supabase as any).from('daily_expenses').delete().eq('id', id);
    if (err) return { error: err.message };
    setExpenses(prev => prev.filter(e => e.id !== id));
    setTotalCount(prev => Math.max(0, prev - 1));
    return { error: null };
  };

  const getBillUrl = async (storagePath: string): Promise<string | null> => {
    if (!storagePath) return null;
    if (storagePath.startsWith('http')) return storagePath;
    const { data } = await supabaseStorage.storage.from('documents').createSignedUrl(storagePath, 3600);
    return data?.signedUrl ?? null;
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    expenses,
    totalCount,
    totalPages,
    stats,
    loading,
    statsLoading,
    error,
    deleteExpense,
    getBillUrl,
    tenantId,
  };
}
