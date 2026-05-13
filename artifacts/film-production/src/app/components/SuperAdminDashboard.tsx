import React, { useState } from 'react';
import {
  Building2, Users, FolderOpen, TrendingUp, Plus, Shield,
  LogOut, CheckCircle, XCircle, AlertTriangle, ChevronDown,
  ChevronUp, Loader2, Edit2, Ban, RefreshCw, Film,
  Globe, Tag, ChevronRight, Trash2, Check, X,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useTenants } from '../hooks/useTenants';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useExpenseCategories } from '../hooks/useExpenseCategories';
import { useAuth } from '../context/AuthContext';
import type { Database } from '../../lib/database.types';

type TenantWithStats = import('../hooks/useTenants').TenantWithStats;
type Subscription = Database['public']['Tables']['subscriptions']['Row'];

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

// ── Create Tenant Modal ──────────────────────────────────────────────────────
function CreateTenantModal({ onCreated }: { onCreated: () => void }) {
  const { createTenant } = useTenants();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    company_name: '',
    slug: '',
    producer_name: '',
    producer_email: '',
    plan_name: 'basic',
    max_users: 10,
    max_projects: 5,
    max_storage_gb: 5,
    valid_until: '',
    notes: '',
  });

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleSubmit = async () => {
    if (!form.company_name || !form.slug || !form.producer_name || !form.producer_email) {
      setError('Company name, slug, producer name, and email are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await createTenant({ ...form, valid_until: form.valid_until || null });
    setSaving(false);
    if (error) { setError(error); return; }
    setOpen(false);
    setForm({ company_name: '', slug: '', producer_name: '', producer_email: '', plan_name: 'basic', max_users: 10, max_projects: 5, max_storage_gb: 5, valid_until: '', notes: '' });
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Create Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Tenant (Producer Workspace)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Company / Production House Name</Label>
              <Input placeholder="e.g. Stellar Films Pvt Ltd" value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value, slug: autoSlug(e.target.value) })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Slug (unique identifier)</Label>
              <Input placeholder="e.g. stellar-films" value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-3">Producer Account (Tenant Admin)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Producer Name</Label>
                <Input placeholder="Full name" value={form.producer_name}
                  onChange={e => setForm({ ...form, producer_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Producer Email</Label>
                <Input type="email" placeholder="producer@company.com" value={form.producer_email}
                  onChange={e => setForm({ ...form, producer_email: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-3">Subscription & Limits</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={form.plan_name} onValueChange={v => setForm({ ...form, plan_name: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input type="date" value={form.valid_until}
                  onChange={e => setForm({ ...form, valid_until: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Max Users</Label>
                <Input type="number" min={1} value={form.max_users}
                  onChange={e => setForm({ ...form, max_users: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Max Projects</Label>
                <Input type="number" min={1} value={form.max_projects}
                  onChange={e => setForm({ ...form, max_projects: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Max Storage (GB)</Label>
                <Input type="number" min={1} value={form.max_storage_gb}
                  onChange={e => setForm({ ...form, max_storage_gb: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input placeholder="Internal notes..." value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <p className="text-xs text-gray-500">
            A password-setup email will be sent to the producer after account creation.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSubmit} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Tenant'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Subscription Modal ──────────────────────────────────────────────────
function EditSubscriptionModal({ tenant, subscription, onUpdated }: {
  tenant: TenantWithStats;
  subscription: Subscription | null;
  onUpdated: () => void;
}) {
  const { updateSubscription } = useSubscriptions();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    plan_name: subscription?.plan_name ?? 'basic',
    valid_until: subscription?.valid_until ? subscription.valid_until.split('T')[0] : '',
    max_users: subscription?.max_users ?? 10,
    max_projects: subscription?.max_projects ?? 5,
    max_storage_gb: subscription?.max_storage_gb ?? 5,
    notes: subscription?.notes ?? '',
  });

  const handleSave = async () => {
    if (!subscription) return;
    setSaving(true); setError(null);
    const { error } = await updateSubscription(subscription.id, { ...form, valid_until: form.valid_until || null });
    setSaving(false);
    if (error) { setError(error); return; }
    setOpen(false);
    onUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Edit2 className="w-3 h-3" /> Edit Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Subscription — {tenant.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {!subscription && <p className="text-yellow-600 text-sm">No active subscription found.</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={form.plan_name} onValueChange={v => setForm({ ...form, plan_name: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Max Users</Label>
              <Input type="number" min={1} value={form.max_users} onChange={e => setForm({ ...form, max_users: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Max Projects</Label>
              <Input type="number" min={1} value={form.max_projects} onChange={e => setForm({ ...form, max_projects: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Max Storage (GB)</Label>
              <Input type="number" min={1} value={form.max_storage_gb} onChange={e => setForm({ ...form, max_storage_gb: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input placeholder="Notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave} disabled={saving || !subscription}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Tenant Row ───────────────────────────────────────────────────────────────
function TenantRow({ tenant, onRefresh }: { tenant: TenantWithStats; onRefresh: () => void }) {
  const { suspendTenant, activateTenant } = useTenants();
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const sub = tenant.subscription;
  const isExpired = sub?.valid_until ? new Date(sub.valid_until) < new Date() : false;
  const planLabel = { basic: 'Basic', professional: 'Professional', enterprise: 'Enterprise' }[sub?.plan_name ?? ''] ?? sub?.plan_name ?? '—';

  const handleSuspend = async () => {
    setActionLoading(true);
    await suspendTenant(tenant.id, 'Suspended by admin');
    setActionLoading(false);
    onRefresh();
  };

  const handleActivate = async () => {
    setActionLoading(true);
    await activateTenant(tenant.id);
    setActionLoading(false);
    onRefresh();
  };

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
              <p className="text-xs text-gray-400">/{tenant.slug}</p>
            </div>
          </div>
        </td>
        <td className="py-4 px-4 text-center">
          <span className="inline-flex items-center gap-1 text-sm text-gray-700">
            <Users className="w-3.5 h-3.5 text-gray-400" />{tenant.user_count}
            <span className="text-gray-400">/{sub?.max_users ?? '∞'}</span>
          </span>
        </td>
        <td className="py-4 px-4 text-center">
          <span className="inline-flex items-center gap-1 text-sm text-gray-700">
            <FolderOpen className="w-3.5 h-3.5 text-gray-400" />{tenant.project_count}
            <span className="text-gray-400">/{sub?.max_projects ?? '∞'}</span>
          </span>
        </td>
        <td className="py-4 px-4 text-center">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs ${
            planLabel === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
            planLabel === 'Professional' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          }`}>{planLabel}</span>
        </td>
        <td className="py-4 px-4 text-center">
          <span className={`text-xs ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
            {sub?.valid_until ? new Date(sub.valid_until).toLocaleDateString('en-IN') : 'Perpetual'}
            {isExpired && ' ⚠'}
          </span>
        </td>
        <td className="py-4 px-4 text-center">
          {tenant.is_active
            ? <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle className="w-3.5 h-3.5" />Active</span>
            : <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle className="w-3.5 h-3.5" />Suspended</span>
          }
        </td>
        <td className="py-4 px-4 text-right" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <EditSubscriptionModal tenant={tenant} subscription={sub} onUpdated={onRefresh} />
            {tenant.is_active ? (
              <Button variant="outline" size="sm" className="gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={handleSuspend} disabled={actionLoading}>
                <Ban className="w-3 h-3" /> Suspend
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="gap-1 text-green-600 border-green-200 hover:bg-green-50" onClick={handleActivate} disabled={actionLoading}>
                <RefreshCw className="w-3 h-3" /> Activate
              </Button>
            )}
            <button className="ml-1 text-gray-400 hover:text-gray-600" onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-indigo-50/50">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Subscription ID</p>
                <p className="text-gray-700 font-mono text-xs">{sub?.id ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Valid From</p>
                <p className="text-gray-700">{sub?.valid_from ? new Date(sub.valid_from).toLocaleDateString('en-IN') : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Storage Limit</p>
                <p className="text-gray-700">{sub?.max_storage_gb ?? '—'} GB</p>
              </div>
              {tenant.suspended_at && (
                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Suspension Reason</p>
                  <p className="text-red-600">{tenant.suspension_reason ?? '—'} (since {new Date(tenant.suspended_at).toLocaleDateString('en-IN')})</p>
                </div>
              )}
              {sub?.notes && (
                <div className="col-span-3">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-gray-700">{sub.notes}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Global Category Manager ──────────────────────────────────────────────────
function GlobalCategoryManager() {
  const {
    globalCategories, loading, refetch,
    addCategory, updateCategory, deleteCategory, subsFor,
  } = useExpenseCategories();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [newSubName, setNewSubName] = useState<Record<string, string>>({});
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true); setError(null);
    const { error } = await addCategory(newCatName.trim(), null, null);
    setSaving(false);
    if (error) { setError(error); return; }
    setNewCatName(''); setAddingCat(false);
  };

  const handleAddSub = async (parentId: string) => {
    const name = (newSubName[parentId] ?? '').trim();
    if (!name) return;
    setSaving(true); setError(null);
    const { error } = await addCategory(name, parentId, null);
    setSaving(false);
    if (error) { setError(error); return; }
    setNewSubName(prev => ({ ...prev, [parentId]: '' }));
    setAddingSubFor(null);
  };

  const handleEdit = async (id: string) => {
    if (!editingName.trim()) return;
    setSaving(true);
    await updateCategory(id, editingName.trim());
    setSaving(false);
    setEditingId(null); setEditingName('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this category? It will be hidden from all expense entries platform-wide.')) return;
    setSaving(true);
    await deleteCategory(id);
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">{error}</div>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" />
          <p className="text-sm text-gray-600">
            These categories are available to <strong>all producers</strong> on the platform by default.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refetch} className="text-slate-500">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          {!addingCat && (
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setAddingCat(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Category
            </Button>
          )}
        </div>
      </div>

      {addingCat && (
        <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <Input
            className="flex-1 h-8 text-sm"
            placeholder="New global category name..."
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            autoFocus
          />
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8" onClick={handleAddCategory} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => { setAddingCat(false); setNewCatName(''); }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {globalCategories.map(cat => (
          <div key={cat.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
              <button className="flex items-center gap-2 flex-1 text-left" onClick={() => toggle(cat.id)}>
                {cat.subcategories.length > 0
                  ? expanded.has(cat.id) ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <span className="w-4 h-4 flex-shrink-0" />
                }
                {editingId === cat.id ? (
                  <Input
                    className="h-7 text-sm flex-1"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm font-medium text-slate-800">{cat.name}</span>
                )}
                <Badge variant="outline" className="ml-auto text-xs text-gray-400 mr-2">
                  {cat.subcategories.length} subcategories
                </Badge>
              </button>
              <div className="flex items-center gap-1">
                {editingId === cat.id ? (
                  <>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(cat.id)}><Check className="w-3.5 h-3.5 text-green-600" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5 text-gray-400" /></Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}>
                      <Edit2 className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-600" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(cat.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {expanded.has(cat.id) && (
              <div className="px-8 pb-2 pt-1 space-y-1 bg-white">
                {cat.subcategories.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 py-1.5">
                    {editingId === sub.id ? (
                      <>
                        <Input className="h-7 text-sm flex-1" value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleEdit(sub.id); if (e.key === 'Escape') setEditingId(null); }}
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(sub.id)}><Check className="w-3.5 h-3.5 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5 text-gray-400" /></Button>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
                        <span className="text-sm text-gray-700 flex-1">{sub.name}</span>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingId(sub.id); setEditingName(sub.name); }}>
                          <Edit2 className="w-3 h-3 text-gray-400 hover:text-indigo-600" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(sub.id)}>
                          <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}

                {addingSubFor === cat.id ? (
                  <div className="flex items-center gap-2 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
                    <Input className="h-7 text-sm flex-1" placeholder="Subcategory name..."
                      value={newSubName[cat.id] ?? ''}
                      onChange={e => setNewSubName(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddSub(cat.id); if (e.key === 'Escape') setAddingSubFor(null); }}
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleAddSub(cat.id)}><Check className="w-3.5 h-3.5 text-green-600" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setAddingSubFor(null)}><X className="w-3.5 h-3.5 text-gray-400" /></Button>
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-1 py-1"
                    onClick={() => { setAddingSubFor(cat.id); setExpanded(prev => new Set([...prev, cat.id])); }}
                  >
                    <Plus className="w-3 h-3" /> Add subcategory
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {globalCategories.length === 0 && !addingCat && (
        <div className="text-center py-10 text-gray-400">
          <Globe className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm">No global categories yet.</p>
          <p className="text-xs mt-1">Add categories to make them available to all producers.</p>
        </div>
      )}
    </div>
  );
}

// ── Main SuperAdminDashboard ─────────────────────────────────────────────────
export function SuperAdminDashboard({ onLogout }: SuperAdminDashboardProps) {
  const { profile, signOut } = useAuth();
  const { tenants, loading, refetch } = useTenants();
  const [view, setView] = useState<'overview' | 'categories'>('overview');

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.is_active).length;
  const totalUsers = tenants.reduce((s, t) => s + t.user_count, 0);
  const totalProjects = tenants.reduce((s, t) => s + t.project_count, 0);

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">FilmBudget Pro</p>
            <p className="text-xs text-slate-400">Super Admin Console</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              view === 'overview'
                ? 'bg-white/15 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Platform Overview
          </button>
          <button
            onClick={() => setView('categories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              view === 'categories'
                ? 'bg-white/15 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Expense Categories
          </button>
          <div className="w-px h-5 bg-slate-600 mx-1" />
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-slate-300">{profile?.full_name ?? 'Admin'}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-700" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Sign Out
          </Button>
        </div>
      </header>

      {/* ── Expense Categories View ── */}
      {view === 'categories' && (
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Global Expense Categories</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage platform-wide categories and subcategories. Available to all producers in the expense entry form.
            </p>
          </div>
          <Card className="p-5">
            <GlobalCategoryManager />
          </Card>
        </div>
      )}

      {/* ── Platform Overview ── */}
      {view === 'overview' && (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalTenants}</p>
                <p className="text-xs text-slate-500">Total Tenants</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeTenants}</p>
                <p className="text-xs text-slate-500">Active Tenants</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
                <p className="text-xs text-slate-500">Total Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalProjects}</p>
                <p className="text-xs text-slate-500">Total Projects</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tenant table */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">All Tenants</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={refetch} className="text-slate-500">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
              </Button>
              <CreateTenantModal onCreated={refetch} />
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tenants yet.</p>
              <p className="text-sm text-gray-400">Create your first producer tenant to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Company</th>
                    <th className="text-center py-3 px-4 text-xs text-slate-500 font-medium">Users</th>
                    <th className="text-center py-3 px-4 text-xs text-slate-500 font-medium">Projects</th>
                    <th className="text-center py-3 px-4 text-xs text-slate-500 font-medium">Plan</th>
                    <th className="text-center py-3 px-4 text-xs text-slate-500 font-medium">Valid Until</th>
                    <th className="text-center py-3 px-4 text-xs text-slate-500 font-medium">Status</th>
                    <th className="text-right py-3 px-4 text-xs text-slate-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => <TenantRow key={t.id} tenant={t} onRefresh={refetch} />)}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Permissions reference */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Platform Role Hierarchy</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-medium text-indigo-900">Super Admin</h4>
              </div>
              <ul className="text-xs space-y-1 text-indigo-700">
                <li>• Create &amp; manage all tenants</li>
                <li>• Configure subscription limits</li>
                <li>• Suspend / activate tenants</li>
                <li>• Manage global expense categories</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-medium text-purple-900">Producer (Tenant Admin)</h4>
              </div>
              <ul className="text-xs space-y-1 text-purple-700">
                <li>• Full access within their workspace</li>
                <li>• Create &amp; manage projects</li>
                <li>• Invite &amp; manage sub-users</li>
                <li>• Manage company-specific categories</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-slate-600" />
                <h4 className="text-sm font-medium text-slate-900">Sub Users</h4>
              </div>
              <ul className="text-xs space-y-1 text-slate-600">
                <li>• Access scoped to their tenant</li>
                <li>• Role-based permissions</li>
                <li>• Accounts / PM / Viewer roles</li>
                <li>• No cross-tenant visibility</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
      )}
    </div>
  );
}
