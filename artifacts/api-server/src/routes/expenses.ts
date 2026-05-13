import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

function applyFilters(
  q: any,
  { projectId, search, fromDate, toDate, categoryId, payMethod, paidBy }: {
    projectId: string;
    search: string;
    fromDate: string;
    toDate: string;
    categoryId: string;
    payMethod: string;
    paidBy: string;
  },
) {
  q = q.eq('project_id', projectId);
  if (fromDate) q = q.gte('expense_date', fromDate);
  if (toDate) q = q.lte('expense_date', toDate);
  if (categoryId) q = q.eq('category_id', categoryId);
  if (payMethod) q = q.eq('pay_method', payMethod);
  if (paidBy) q = q.ilike('paid_by', `%${paidBy}%`);
  if (search) {
    const like = `%${search}%`;
    q = q.or(
      `account_head.ilike.${like},description.ilike.${like},reference_no.ilike.${like},paid_by.ilike.${like},department.ilike.${like}`,
    );
  }
  return q;
}

router.get('/projects/:projectId/expenses', requireAuth, async (req, res) => {
  const { projectId } = req.params;

  const page = Math.max(1, parseInt((req.query['page'] as string) || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt((req.query['pageSize'] as string) || '25', 10)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const filterArgs = {
    projectId,
    search:     (req.query['search']     as string) || '',
    fromDate:   (req.query['fromDate']   as string) || '',
    toDate:     (req.query['toDate']     as string) || '',
    categoryId: (req.query['categoryId'] as string) || '',
    payMethod:  (req.query['payMethod']  as string) || '',
    paidBy:     (req.query['paidBy']     as string) || '',
  };

  // Paginated data
  const dataQuery = applyFilters(
    supabaseAdmin.from('daily_expenses').select('*', { count: 'exact' }),
    filterArgs,
  ).order('expense_date', { ascending: false }).range(from, to);

  const { data, error, count } = await dataQuery;
  if (error) { res.status(500).json({ error: error.message }); return; }

  // Grand total amount for the full filtered set (no range)
  const { data: sumData } = await applyFilters(
    supabaseAdmin.from('daily_expenses').select('total'),
    filterArgs,
  );
  const totalAmount = (sumData ?? []).reduce((s: number, r: any) => s + (r.total ?? 0), 0);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  res.json({ data: data ?? [], total, page, pageSize, totalPages, totalAmount });
});

router.post('/projects/:projectId/expenses', requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const user = (req as any).user;
  const rows = req.body as Array<{
    expense_date: string;
    department: string;
    account_head: string;
    amount: number;
    nos: number;
    bill_url?: string | null;
    paid_by?: string | null;
    description?: string | null;
    pay_method?: string | null;
    reference_no?: string | null;
    category_id?: string | null;
    subcategory_id?: string | null;
    tenant_id?: string | null;
  }>;

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: 'Expected an array of expense rows' });
    return;
  }

  const inserts = rows.map(r => ({
    project_id: projectId,
    expense_date: r.expense_date,
    department: r.department,
    account_head: r.account_head,
    amount: r.amount,
    nos: r.nos,
    total: r.amount * r.nos,
    added_by: user.id,
    bill_url: r.bill_url ?? null,
    paid_by: r.paid_by ?? null,
    description: r.description ?? null,
    pay_method: r.pay_method ?? null,
    reference_no: r.reference_no ?? null,
    category_id: r.category_id ?? null,
    subcategory_id: r.subcategory_id ?? null,
    tenant_id: r.tenant_id ?? null,
  }));

  const { data, error } = await supabaseAdmin.from('daily_expenses').insert(inserts).select();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// Stats endpoint — must be defined before /:id to avoid param capture
router.get('/projects/:projectId/expenses/stats', requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const [allRes, todayRes, deptRes] = await Promise.all([
    // Total spent (all time for this project)
    supabaseAdmin.from('daily_expenses').select('total').eq('project_id', projectId),
    // Today's spend
    supabaseAdmin.from('daily_expenses').select('total')
      .eq('project_id', projectId).eq('expense_date', today),
    // Per-department breakdown
    supabaseAdmin.from('daily_expenses').select('department,total').eq('project_id', projectId),
  ]);

  const totalSpent = (allRes.data ?? []).reduce((s: number, r: any) => s + (r.total ?? 0), 0);
  const todaySpent = (todayRes.data ?? []).reduce((s: number, r: any) => s + (r.total ?? 0), 0);

  // Aggregate by department
  const deptMap = new Map<string, number>();
  for (const r of (deptRes.data ?? []) as any[]) {
    const key = (r.department as string) || 'Unspecified';
    deptMap.set(key, (deptMap.get(key) ?? 0) + (r.total ?? 0));
  }
  const departmentBreakdown = Array.from(deptMap.entries())
    .map(([department, total]) => ({ department, total }))
    .sort((a, b) => b.total - a.total);

  res.json({ totalSpent, todaySpent, departmentBreakdown });
});

router.delete('/projects/:projectId/expenses/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from('daily_expenses').delete().eq('id', id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

export default router;
