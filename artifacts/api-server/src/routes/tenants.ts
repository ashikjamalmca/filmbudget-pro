import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireSuperAdmin } from '../middlewares/auth.js';

const router = Router();

router.post('/tenants', requireAuth, requireSuperAdmin, async (req, res) => {
  const {
    company_name, slug, producer_name, producer_email,
    plan_name = 'basic', max_users = 10, max_projects = 5,
    max_storage_gb = 5, valid_until = null, notes = '',
  } = req.body;

  if (!company_name || !slug || !producer_name || !producer_email) {
    res.status(400).json({ error: 'company_name, slug, producer_name, producer_email are required' });
    return;
  }

  const superAdminId = (req as any).user.id;

  // 1. Create tenant record
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .insert({
      name: company_name,
      slug,
      is_active: true,
      created_by: superAdminId,
    } as any)
    .select()
    .single();

  if (tenantError || !tenant) {
    req.log.error({ err: tenantError }, 'Failed to create tenant');
    res.status(500).json({ error: tenantError?.message ?? 'Failed to create tenant' });
    return;
  }

  const tenantId = (tenant as any).id;

  // 2. Create producer auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: producer_email,
    email_confirm: true,
    user_metadata: {
      full_name: producer_name,
      role: 'producer',
      tenant_id: tenantId,
    },
  });

  if (authError) {
    // Cleanup tenant
    await supabaseAdmin.from('tenants').delete().eq('id', tenantId);
    req.log.error({ err: authError }, 'Failed to create producer user');
    res.status(500).json({ error: authError.message });
    return;
  }

  const producerId = authUser.user.id;

  // 3. Upsert producer profile with tenant link
  await supabaseAdmin.from('profiles').upsert({
    id: producerId,
    email: producer_email,
    full_name: producer_name,
    role: 'producer',
    tenant_id: tenantId,
    is_active: true,
    is_super_admin: false,
  } as any);

  // 4. Link tenant owner
  await supabaseAdmin.from('tenants').update({ owner_id: producerId } as any).eq('id', tenantId);

  // 5. Create subscription
  const { error: subError } = await supabaseAdmin.from('subscriptions').insert({
    tenant_id: tenantId,
    plan_name,
    valid_from: new Date().toISOString(),
    valid_until: valid_until ?? null,
    max_users,
    max_projects,
    max_storage_gb,
    is_active: true,
    notes,
    created_by: superAdminId,
  } as any);

  if (subError) {
    req.log.error({ err: subError }, 'Failed to create subscription');
  }

  // 6. Send password reset email so producer can set their password
  await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: producer_email,
  });

  res.json({ success: true, tenant_id: tenantId, producer_id: producerId });
});

router.post('/tenants/:id/suspend', requireAuth, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason = '' } = req.body;

  const { error } = await supabaseAdmin.from('tenants').update({
    is_active: false,
    suspended_at: new Date().toISOString(),
    suspension_reason: reason,
  } as any).eq('id', id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

router.post('/tenants/:id/activate', requireAuth, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin.from('tenants').update({
    is_active: true,
    suspended_at: null,
    suspension_reason: null,
  } as any).eq('id', id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

router.get('/tenants', requireAuth, requireSuperAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.patch('/subscriptions/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { plan_name, valid_until, max_users, max_projects, max_storage_gb, notes } = req.body;

  const updates: Record<string, unknown> = {};
  if (plan_name !== undefined) updates['plan_name'] = plan_name;
  if (valid_until !== undefined) updates['valid_until'] = valid_until;
  if (max_users !== undefined) updates['max_users'] = max_users;
  if (max_projects !== undefined) updates['max_projects'] = max_projects;
  if (max_storage_gb !== undefined) updates['max_storage_gb'] = max_storage_gb;
  if (notes !== undefined) updates['notes'] = notes;

  const { error } = await supabaseAdmin.from('subscriptions').update(updates as any).eq('id', id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

export default router;
