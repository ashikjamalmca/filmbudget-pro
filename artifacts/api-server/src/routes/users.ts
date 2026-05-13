import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.post('/users/invite', requireAuth, async (req, res) => {
  const { email, full_name, role, assigned_project_id, tenant_id } = req.body;

  if (!email || !full_name || !role) {
    res.status(400).json({ error: 'email, full_name, and role are required' });
    return;
  }

  const validRoles = ['producer', 'accounts', 'production-manager', 'viewer'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }

  // Verify the caller is a producer or super admin in the same tenant
  const callerId = (req as any).user.id;
  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role, tenant_id, is_super_admin')
    .eq('id', callerId)
    .single();

  if (!callerProfile) {
    res.status(403).json({ error: 'Caller profile not found' });
    return;
  }

  const effectiveTenantId = (callerProfile as any).is_super_admin ? tenant_id : (callerProfile as any).tenant_id;

  if (!effectiveTenantId) {
    res.status(400).json({ error: 'No tenant context' });
    return;
  }

  if (!(callerProfile as any).is_super_admin && (callerProfile as any).role !== 'producer') {
    res.status(403).json({ error: 'Only producers can invite users' });
    return;
  }

  // Check subscription user limit
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('max_users')
    .eq('tenant_id', effectiveTenantId)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (sub) {
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('tenant_id', effectiveTenantId);
    if (count !== null && count >= (sub as any).max_users) {
      res.status(403).json({ error: `User limit reached (max ${(sub as any).max_users} users)` });
      return;
    }
  }

  const { data: authUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name, role, tenant_id: effectiveTenantId },
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
    tenant_id: effectiveTenantId,
    assigned_project_id: assigned_project_id ?? null,
    is_active: true,
    is_super_admin: false,
  } as any);

  if (profileError) {
    req.log.error({ err: profileError }, 'Failed to create profile');
    res.status(500).json({ error: profileError.message });
    return;
  }

  res.json({ success: true, user_id: authUser.user.id });
});

router.get('/users', requireAuth, async (req, res) => {
  const callerId = (req as any).user.id;
  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role, tenant_id, is_super_admin')
    .eq('id', callerId)
    .single();

  if (!callerProfile) { res.status(403).json({ error: 'Profile not found' }); return; }

  const query = supabaseAdmin.from('profiles').select('*').order('full_name');
  const finalQuery = (callerProfile as any).is_super_admin
    ? query
    : (query as any).eq('tenant_id', (callerProfile as any).tenant_id);

  const { data, error } = await finalQuery;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
