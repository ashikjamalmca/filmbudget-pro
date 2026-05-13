import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type DailyExpense = Database['public']['Tables']['daily_expenses']['Row'];
type Artist = Database['public']['Tables']['artists']['Row'];
type MusicExpense = Database['public']['Tables']['music_expenses']['Row'];

export interface DashboardData {
  totalBudget: number;
  totalPaid: number;
  balance: number;
  budgetVsActual: { department: string; budget: number; actual: number }[];
  dailyTrend: { date: string; amount: number }[];
  recentActivity: { date: string; department: string; head: string; amount: number; addedBy: string }[];
}

export function useDashboard(projectId: string | null) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!projectId) { setData(null); setLoading(false); return; }
    setLoading(true);

    const [projectRes, expensesRes, artistsRes, musicRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('daily_expenses').select('*').eq('project_id', projectId).order('expense_date', { ascending: false }),
      supabase.from('artists').select('*').eq('project_id', projectId),
      supabase.from('music_expenses').select('*').eq('project_id', projectId),
    ]);

    if (projectRes.error) { setError(projectRes.error.message); setLoading(false); return; }

    const project = projectRes.data as unknown as Project;
    const expenses = (expensesRes.data ?? []) as unknown as DailyExpense[];
    const artists = (artistsRes.data ?? []) as unknown as Artist[];
    const music = (musicRes.data ?? []) as unknown as MusicExpense[];

    const totalPaidExpenses = expenses.reduce((s, e) => s + e.total, 0);
    const totalPaidArtists = artists.filter(a => a.type === 'artist').reduce((s, a) => s + a.paid, 0);
    const totalPaidTechnicians = artists.filter(a => a.type === 'technician').reduce((s, a) => s + a.paid, 0);
    const totalPaidMusic = music.reduce((s, m) => s + m.paid, 0);
    const totalPaid = totalPaidExpenses + totalPaidArtists + totalPaidTechnicians + totalPaidMusic;

    const tb = project.total_budget;
    const budgetVsActual = [
      { department: 'Daily Exp', budget: Math.round(tb * 0.16), actual: totalPaidExpenses },
      { department: 'Artists', budget: Math.round(tb * 0.30), actual: totalPaidArtists },
      { department: 'Technicians', budget: Math.round(tb * 0.24), actual: totalPaidTechnicians },
      { department: 'Equipment', budget: Math.round(tb * 0.12), actual: 0 },
      { department: 'Post Prod', budget: Math.round(tb * 0.10), actual: 0 },
      { department: 'Music', budget: Math.round(tb * 0.08), actual: totalPaidMusic },
    ];

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    const dailyTrend = last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      amount: expenses.filter(e => e.expense_date === date).reduce((s, e) => s + e.total, 0),
    }));

    const recentActivity = expenses.slice(0, 6).map(e => ({
      date: e.expense_date,
      department: e.department,
      head: e.account_head,
      amount: e.total,
      addedBy: e.added_by,
    }));

    setData({ totalBudget: tb, totalPaid, balance: tb - totalPaid, budgetVsActual, dailyTrend, recentActivity });
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
}
