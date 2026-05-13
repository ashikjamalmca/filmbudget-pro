import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/projects/:projectId/expenses', requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const { data, error } = await supabaseAdmin
    .from('daily_expenses')
    .select('*')
    .eq('project_id', projectId)
    .order('expense_date', { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.post('/projects/:projectId/expenses', requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const user = (req as any).user;
  const rows = req.body as Array<{ expense_date: string; department: string; account_head: string; amount: number; nos: number }>;

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
  }));

  const { data, error } = await supabaseAdmin.from('daily_expenses').insert(inserts).select();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

router.delete('/projects/:projectId/expenses/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from('daily_expenses').delete().eq('id', id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

export default router;
