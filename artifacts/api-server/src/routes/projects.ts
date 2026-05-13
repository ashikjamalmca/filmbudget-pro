import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/projects', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('projects').select('*').order('created_at', { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.post('/projects', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { title, date_range, total_budget, poster_url } = req.body;
  if (!title || !total_budget) {
    res.status(400).json({ error: 'title and total_budget are required' });
    return;
  }
  const { data, error } = await supabaseAdmin.from('projects').insert({
    title, date_range, total_budget, poster_url: poster_url ?? null, created_by: user.id,
  }).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

router.patch('/projects/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, date_range, total_budget } = req.body;
  const { data, error } = await supabaseAdmin.from('projects').update({ title, date_range, total_budget }).eq('id', id).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
