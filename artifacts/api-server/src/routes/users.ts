import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.post('/users/invite', requireAuth, async (req, res) => {
  const { email, full_name, role, assigned_project_id } = req.body;

  if (!email || !full_name || !role) {
    res.status(400).json({ error: 'email, full_name, and role are required' });
    return;
  }

  const validRoles = ['producer', 'accounts', 'production-manager', 'viewer'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }

  const { data: authUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name, role },
  });

  if (inviteError) {
    req.log.error({ err: inviteError }, 'Failed to invite user');
    res.status(500).json({ error: inviteError.message });
    return;
  }

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: authUser.user.id,
    email,
    full_name,
    role,
    assigned_project_id: assigned_project_id ?? null,
    is_active: true,
  });

  if (profileError) {
    req.log.error({ err: profileError }, 'Failed to create profile');
    res.status(500).json({ error: profileError.message });
    return;
  }

  res.json({ success: true, user_id: authUser.user.id });
});

router.get('/users', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').order('full_name');
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
