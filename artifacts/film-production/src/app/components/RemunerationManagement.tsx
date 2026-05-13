import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import {
  Plus, Trash2, Loader2, History, ChevronDown, ChevronUp,
  DollarSign, Users, TrendingUp, AlertCircle, Check, Clock, Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRemuneration, DEPARTMENTS } from '../hooks/useRemuneration';
import type { RemunerationEntry, RemunerationPayment } from '../hooks/useRemuneration';
import { useProfiles } from '../hooks/useProfiles';
import { useAuth } from '../context/AuthContext';

interface Props { projectId: string | null; }

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'bg-gray-100 text-gray-700',   icon: Clock  },
  partial:  { label: 'Partial',  color: 'bg-amber-100 text-amber-700',  icon: AlertCircle },
  complete: { label: 'Complete', color: 'bg-green-100 text-green-700',  icon: Check  },
};

const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

// ── Add/Edit Entry Dialog ────────────────────────────────────────────────────
function EntryDialog({
  trigger,
  onSave,
  initial,
}: {
  trigger: React.ReactNode;
  onSave: (v: any) => Promise<{ error: string | null }>;
  initial?: Partial<RemunerationEntry>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    department: initial?.department ?? '',
    role: initial?.role ?? '',
    person_name: initial?.person_name ?? '',
    item_service: initial?.item_service ?? '',
    agreed_amount: initial?.agreed_amount?.toString() ?? '',
    paid_by: initial?.paid_by ?? '',
    payment_date: initial?.payment_date ?? '',
    remarks: initial?.remarks ?? '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.department || !form.person_name || !form.agreed_amount) {
      setErr('Department, Person Name, and Agreed Amount are required.');
      return;
    }
    setSaving(true); setErr(null);
    const { error } = await onSave({
      department: form.department,
      role: form.role,
      person_name: form.person_name,
      item_service: form.item_service || null,
      agreed_amount: parseFloat(form.agreed_amount) || 0,
      paid_by: form.paid_by || null,
      payment_date: form.payment_date || null,
      remarks: form.remarks || null,
    });
    setSaving(false);
    if (error) { setErr(error); return; }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Entry' : 'Add Remuneration Entry'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {err && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{err}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Department <span className="text-red-400">*</span></Label>
              <Select value={form.department} onValueChange={v => set('department', v)}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Role / Designation</Label>
              <Input placeholder="e.g. Lead Actor, DOP" value={form.role} onChange={e => set('role', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Person Name <span className="text-red-400">*</span></Label>
              <Input placeholder="Full name" value={form.person_name} onChange={e => set('person_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Item / Service</Label>
              <Input placeholder="e.g. Shoot days, Song recording" value={form.item_service} onChange={e => set('item_service', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Agreed Amount (₹) <span className="text-red-400">*</span></Label>
            <Input type="number" placeholder="0" value={form.agreed_amount} onChange={e => set('agreed_amount', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Remarks / Notes</Label>
            <Textarea placeholder="Any additional notes..." value={form.remarks} onChange={e => set('remarks', e.target.value)} rows={2} className="resize-none" />
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleSubmit} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : (initial ? 'Update' : 'Add Entry')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Payment History Sheet ───────────────────────────────────────────────────
function PaymentHistorySheet({
  entry,
  open,
  onClose,
  onAddPayment,
  onDeletePayment,
}: {
  entry: RemunerationEntry | null;
  open: boolean;
  onClose: () => void;
  onAddPayment: (entryId: string, amount: number, date: string, paidBy: string | null, remarks: string | null) => Promise<{ error: string | null }>;
  onDeletePayment: (paymentId: string, entryId: string) => Promise<{ error: string | null }>;
}) {
  const { profile } = useAuth();
  const { profiles } = useProfiles();
  const [payments, setPayments] = useState<RemunerationPayment[]>([]);
  const [loadingPay, setLoadingPay] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    paid_by: profile?.full_name ?? '',
    remarks: '',
  });
  const { fetchPayments } = useRemuneration(entry?.project_id ?? null);

  const reload = async () => {
    if (!entry) return;
    setLoadingPay(true);
    const data = await fetchPayments(entry.id);
    setPayments(data);
    setLoadingPay(false);
  };

  useEffect(() => { if (open && entry) reload(); }, [open, entry?.id]);

  const handleAdd = async () => {
    if (!entry || !payForm.amount) { setErr('Amount is required.'); return; }
    setSaving(true); setErr(null);
    const { error } = await onAddPayment(
      entry.id,
      parseFloat(payForm.amount),
      payForm.payment_date,
      payForm.paid_by || null,
      payForm.remarks || null,
    );
    setSaving(false);
    if (error) { setErr(error); return; }
    setPayForm(f => ({ ...f, amount: '', remarks: '' }));
    setShowForm(false);
    await reload();
  };

  const handleDelete = async (paymentId: string) => {
    if (!entry) return;
    await onDeletePayment(paymentId, entry.id);
    await reload();
  };

  if (!entry) return null;

  const sc = STATUS_CONFIG[entry.status];
  const Icon = sc.icon;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-base">Payment History</SheetTitle>
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">{entry.person_name}</p>
            <p className="text-sm text-slate-500">{entry.department} · {entry.role}</p>
            {entry.item_service && <p className="text-xs text-slate-400">{entry.item_service}</p>}
          </div>
        </SheetHeader>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-3 py-4 border-b">
          <div className="text-center">
            <p className="text-xs text-slate-500">Agreed</p>
            <p className="text-sm font-semibold text-slate-900">{fmt(entry.agreed_amount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Paid</p>
            <p className="text-sm font-semibold text-green-700">{fmt(entry.paid_amount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-sm font-semibold text-amber-700">{fmt(entry.balance_amount)}</p>
          </div>
        </div>

        {/* Add payment toggle */}
        <div className="py-4 border-b">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(f => !f)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Record Payment</span>
            {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          {showForm && (
            <div className="mt-4 space-y-3 p-4 bg-slate-50 rounded-lg">
              {err && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{err}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount (₹) *</Label>
                  <Input type="number" placeholder="0" value={payForm.amount}
                    onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Date</Label>
                  <Input type="date" value={payForm.payment_date}
                    onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Paid By</Label>
                <Select value={payForm.paid_by} onValueChange={v => setPayForm(f => ({ ...f, paid_by: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.full_name ?? p.id}>
                        {p.full_name ?? p.id}
                        {p.id === profile?.id ? ' (you)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Remarks</Label>
                <Textarea placeholder="Payment notes..." rows={2} className="resize-none text-sm"
                  value={payForm.remarks} onChange={e => setPayForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleAdd} disabled={saving}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Save Payment
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Payment timeline */}
        <div className="pt-4 space-y-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Payment Log</p>
          {loadingPay ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No payments recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((pay, i) => (
                <div key={pay.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-green-700">{fmt(pay.amount)}</span>
                      <span className="text-xs text-slate-400">{pay.payment_date}</span>
                    </div>
                    {pay.paid_by && <p className="text-xs text-slate-500 mt-0.5">Paid by: {pay.paid_by}</p>}
                    {pay.remarks && <p className="text-xs text-slate-400 mt-0.5">{pay.remarks}</p>}
                    {pay.expense_id && (
                      <span className="inline-block mt-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                        Linked to expense
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="w-7 h-7 text-slate-300 hover:text-red-500 flex-shrink-0"
                    onClick={() => handleDelete(pay.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function RemunerationManagement({ projectId }: Props) {
  const {
    entries, loading, refetch,
    addEntry, updateEntry, deleteEntry,
    addPayment, fetchPayments, deletePayment,
  } = useRemuneration(projectId);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [historyEntry, setHistoryEntry] = useState<RemunerationEntry | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Summary totals
  const totalAgreed  = entries.reduce((s, e) => s + e.agreed_amount, 0);
  const totalPaid    = entries.reduce((s, e) => s + e.paid_amount, 0);
  const totalBalance = entries.reduce((s, e) => s + e.balance_amount, 0);

  // Filtered list
  const filtered = useMemo(() => entries.filter(e => {
    if (deptFilter !== 'all' && e.department !== deptFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.person_name.toLowerCase().includes(q) ||
             e.role.toLowerCase().includes(q) ||
             e.department.toLowerCase().includes(q);
    }
    return true;
  }), [entries, deptFilter, statusFilter, search]);

  // Group by department
  const byDept = useMemo(() => {
    const map: Record<string, RemunerationEntry[]> = {};
    filtered.forEach(e => {
      if (!map[e.department]) map[e.department] = [];
      map[e.department].push(e);
    });
    return map;
  }, [filtered]);

  const toggleDept = (dept: string) => setExpanded(x => ({ ...x, [dept]: !x[dept] }));

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Select a project to view remuneration.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Remuneration Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Unified crew & talent payment tracking across all departments</p>
        </div>
        <EntryDialog
          trigger={
            <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 shrink-0">
              <Plus className="w-4 h-4 mr-2" /> Add Entry
            </Button>
          }
          onSave={addEntry}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{entries.length}</p>
              <p className="text-xs text-slate-500">Total Entries</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{fmt(totalAgreed)}</p>
              <p className="text-xs text-slate-500">Total Agreed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <Check className="w-4.5 h-4.5 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{fmt(totalPaid)}</p>
              <p className="text-xs text-slate-500">Total Paid</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{fmt(totalBalance)}</p>
              <p className="text-xs text-slate-500">Balance Due</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search name, role, department..." className="pl-9"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No remuneration entries yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first entry to start tracking payments.</p>
          <EntryDialog
            trigger={
              <Button variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" /> Add First Entry
              </Button>
            }
            onSave={addEntry}
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-400 text-sm">No entries match your filters.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDept).map(([dept, deptEntries]) => {
            const isOpen = expanded[dept] !== false; // default open
            const deptAgreed  = deptEntries.reduce((s, e) => s + e.agreed_amount, 0);
            const deptPaid    = deptEntries.reduce((s, e) => s + e.paid_amount, 0);
            const deptBalance = deptEntries.reduce((s, e) => s + e.balance_amount, 0);

            return (
              <Card key={dept} className="overflow-hidden">
                {/* Department header */}
                <button
                  onClick={() => toggleDept(dept)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    <span className="font-semibold text-slate-900">{dept}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {deptEntries.length} {deptEntries.length === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-slate-400">Agreed</p>
                      <p className="text-sm font-medium text-slate-700">{fmt(deptAgreed)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Paid</p>
                      <p className="text-sm font-medium text-green-600">{fmt(deptPaid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Balance</p>
                      <p className="text-sm font-medium text-amber-600">{fmt(deptBalance)}</p>
                    </div>
                  </div>
                </button>

                {/* Entries table */}
                {isOpen && (
                  <div className="border-t border-slate-100">
                    {/* Desktop header */}
                    <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 text-xs text-slate-500 font-medium">
                      <div className="col-span-3">Person</div>
                      <div className="col-span-2">Role</div>
                      <div className="col-span-2">Item / Service</div>
                      <div className="col-span-1 text-right">Agreed</div>
                      <div className="col-span-1 text-right">Paid</div>
                      <div className="col-span-1 text-right">Balance</div>
                      <div className="col-span-1 text-center">Status</div>
                      <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {deptEntries.map(entry => {
                      const sc = STATUS_CONFIG[entry.status];
                      const Icon = sc.icon;
                      return (
                        <div key={entry.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                          {/* Desktop row */}
                          <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 items-center">
                            <div className="col-span-3">
                              <p className="text-sm font-medium text-slate-900">{entry.person_name}</p>
                              {entry.remarks && <p className="text-xs text-slate-400 truncate mt-0.5">{entry.remarks}</p>}
                            </div>
                            <div className="col-span-2 text-sm text-slate-600">{entry.role || '—'}</div>
                            <div className="col-span-2 text-sm text-slate-500">{entry.item_service || '—'}</div>
                            <div className="col-span-1 text-right text-sm font-medium text-slate-700">{fmt(entry.agreed_amount)}</div>
                            <div className="col-span-1 text-right text-sm text-green-600 font-medium">{fmt(entry.paid_amount)}</div>
                            <div className="col-span-1 text-right text-sm text-amber-600 font-medium">{fmt(entry.balance_amount)}</div>
                            <div className="col-span-1 flex justify-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                                <Icon className="w-3 h-3" /> {sc.label}
                              </span>
                            </div>
                            <div className="col-span-1 flex justify-end gap-1">
                              <Button
                                variant="ghost" size="icon"
                                className="w-7 h-7 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                title="Payment History"
                                onClick={() => setHistoryEntry(entry)}
                              >
                                <History className="w-3.5 h-3.5" />
                              </Button>
                              <EntryDialog
                                trigger={
                                  <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-slate-700">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      <path d="M11.333 2a1.886 1.886 0 0 1 2.667 2.667L4.667 14H2v-2.667L11.333 2Z"/>
                                    </svg>
                                  </Button>
                                }
                                onSave={(v) => updateEntry(entry.id, v)}
                                initial={entry}
                              />
                              <Button
                                variant="ghost" size="icon"
                                className="w-7 h-7 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                onClick={() => deleteEntry(entry.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Mobile card */}
                          <div className="md:hidden p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-slate-900">{entry.person_name}</p>
                                <p className="text-xs text-slate-500">{entry.role || '—'}</p>
                                {entry.item_service && <p className="text-xs text-slate-400">{entry.item_service}</p>}
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                                <Icon className="w-3 h-3" /> {sc.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-3">
                              <div className="text-center">
                                <p className="text-xs text-slate-400">Agreed</p>
                                <p className="text-sm font-semibold text-slate-700">{fmt(entry.agreed_amount)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-slate-400">Paid</p>
                                <p className="text-sm font-semibold text-green-600">{fmt(entry.paid_amount)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-slate-400">Balance</p>
                                <p className="text-sm font-semibold text-amber-600">{fmt(entry.balance_amount)}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline" size="sm"
                                className="flex-1 text-indigo-600 border-indigo-200"
                                onClick={() => setHistoryEntry(entry)}
                              >
                                <History className="w-3.5 h-3.5 mr-1.5" /> Payment History
                              </Button>
                              <Button
                                variant="outline" size="icon"
                                className="text-red-500 border-red-200 h-9 w-9"
                                onClick={() => deleteEntry(entry.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment history side sheet */}
      <PaymentHistorySheet
        entry={historyEntry}
        open={!!historyEntry}
        onClose={() => setHistoryEntry(null)}
        onAddPayment={addPayment}
        onDeletePayment={deletePayment}
      />
    </div>
  );
}
