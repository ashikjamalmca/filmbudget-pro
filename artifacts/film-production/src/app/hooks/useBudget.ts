import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface BudgetAllocation {
  id: string;
  project_id: string;
  tenant_id: string | null;
  department: string;
  allocated_amount: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SpentByDept {
  [department: string]: number;
}

export function useBudget(projectId: string | null) {
  const { tenantId } = useAuth();
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [spentByDept, setSpentByDept] = useState<SpentByDept>({});
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!projectId) { setAllocations([]); setSpentByDept({}); setTotalBudget(0); setLoading(false); return; }
    setLoading(true);

    const [allocRes, expRes, projRes] = await Promise.all([
      (supabase as any).from('budget_allocations')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      (supabase as any).from('daily_expenses')
        .select('department, total')
        .eq('project_id', projectId),
      (supabase as any).from('projects')
        .select('total_budget')
        .eq('id', projectId)
        .single(),
    ]);

    if (allocRes.error) { setError(allocRes.error.message); }
    else { setAllocations(allocRes.data ?? []); }

    if (expRes.data) {
      const map: SpentByDept = {};
      for (const e of expRes.data) {
        const dept = (e.department ?? '').trim();
        if (dept) map[dept] = (map[dept] ?? 0) + (e.total ?? 0);
      }
      setSpentByDept(map);
    }

    if (projRes.data) setTotalBudget(projRes.data.total_budget ?? 0);

    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addAllocation = async (department: string, allocated_amount: number, notes: string | null) => {
    if (!projectId) return { error: 'No project selected' };
    const maxOrder = allocations.length > 0 ? Math.max(...allocations.map(a => a.sort_order)) : 0;
    const { error: err } = await (supabase as any).from('budget_allocations').insert({
      project_id: projectId,
      tenant_id: tenantId,
      department: department.trim(),
      allocated_amount,
      notes: notes || null,
      sort_order: maxOrder + 10,
    });
    if (err) return { error: err.message };
    await fetchAll();
    return { error: null };
  };

  const updateAllocation = async (id: string, allocated_amount: number, notes: string | null) => {
    const { error: err } = await (supabase as any).from('budget_allocations')
      .update({ allocated_amount, notes: notes || null })
      .eq('id', id);
    if (err) return { error: err.message };
    await fetchAll();
    return { error: null };
  };

  const deleteAllocation = async (id: string) => {
    const { error: err } = await (supabase as any).from('budget_allocations').delete().eq('id', id);
    if (err) return { error: err.message };
    await fetchAll();
    return { error: null };
  };

  const updateProjectBudget = async (amount: number) => {
    const { error: err } = await (supabase as any).from('projects')
      .update({ total_budget: amount })
      .eq('id', projectId);
    if (err) return { error: err.message };
    await fetchAll();
    return { error: null };
  };

  const totalAllocated = allocations.reduce((s, a) => s + a.allocated_amount, 0);
  const totalSpent = Object.values(spentByDept).reduce((s, v) => s + v, 0);
  const unallocated = totalBudget - totalAllocated;

  return {
    allocations, spentByDept, totalBudget, totalAllocated, totalSpent, unallocated,
    loading, error,
    addAllocation, updateAllocation, deleteAllocation, updateProjectBudget,
    refetch: fetchAll,
  };
}
