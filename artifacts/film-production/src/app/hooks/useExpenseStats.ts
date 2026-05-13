import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface DepartmentStat {
  department: string;
  total: number;
}

export interface ExpenseStats {
  totalSpent: number;
  todaySpent: number;
  departmentBreakdown: DepartmentStat[];
}

export function useExpenseStats(projectId: string | null) {
  const [stats, setStats] = useState<ExpenseStats>({
    totalSpent: 0,
    todaySpent: 0,
    departmentBreakdown: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/stats`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const json: ExpenseStats = await res.json();
        setStats(json);
      }
    } catch {
      // silently ignore — cards will just show zeros
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
