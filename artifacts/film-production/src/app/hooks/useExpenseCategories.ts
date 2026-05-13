import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Database } from '../../lib/database.types';

export type ExpenseCategory = Database['public']['Tables']['expense_categories']['Row'];

export interface CategoryWithSubs extends ExpenseCategory {
  subcategories: ExpenseCategory[];
}

export function useExpenseCategories() {
  const { tenantId } = useAuth();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) setError(error.message);
    else setCategories((data ?? []) as ExpenseCategory[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const topLevel = categories.filter(c => c.parent_id === null);
  const subsFor = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  const withSubs: CategoryWithSubs[] = topLevel.map(cat => ({
    ...cat,
    subcategories: subsFor(cat.id),
  }));

  const globalCategories = withSubs.filter(c => c.tenant_id === null);
  const tenantCategories = withSubs.filter(c => c.tenant_id === tenantId);
  const allCategoriesWithSubs = withSubs;

  const addCategory = async (name: string, parentId: string | null, scopeTenantId: string | null) => {
    const maxOrder = categories
      .filter(c => c.parent_id === parentId && c.tenant_id === scopeTenantId)
      .reduce((m, c) => Math.max(m, c.sort_order), 0);
    const { error } = await (supabase as any).from('expense_categories').insert({
      name,
      tenant_id: scopeTenantId,
      parent_id: parentId,
      sort_order: maxOrder + 10,
    });
    if (error) return { error: error.message };
    await fetchCategories();
    return { error: null };
  };

  const updateCategory = async (id: string, name: string) => {
    const { error } = await (supabase as any)
      .from('expense_categories').update({ name }).eq('id', id);
    if (error) return { error: error.message };
    await fetchCategories();
    return { error: null };
  };

  const deleteCategory = async (id: string) => {
    const { error } = await (supabase as any)
      .from('expense_categories').update({ is_active: false }).eq('id', id);
    if (error) return { error: error.message };
    await fetchCategories();
    return { error: null };
  };

  return {
    categories,
    withSubs,
    globalCategories,
    tenantCategories,
    allCategoriesWithSubs,
    loading,
    error,
    refetch: fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    subsFor,
  };
}
