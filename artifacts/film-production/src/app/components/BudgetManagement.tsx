import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from './ui/dialog';
import {
  PieChart, Wallet, TrendingUp, TrendingDown, AlertTriangle,
  Plus, Pencil, Trash2, Loader2, CheckCircle, IndianRupee,
  BarChart3, ShieldAlert,
} from 'lucide-react';
import { useBudget } from '../hooks/useBudget';

const DEPT_OPTIONS = [
  'Production', 'Logistics', 'Crew & Cast', 'Equipment',
  'Post Production', 'Administration', 'Marketing', 'Remuneration', 'Others',
];

interface Props { projectId: string | null; }

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function PctBar({ pct, over }: { pct: number; over: boolean }) {
  const capped = Math.min(pct, 100);
  const color = over ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${capped}%` }} />
      </div>
      <span className={`text-xs font-medium w-10 text-right ${over ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-gray-600'}`}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

export function BudgetManagement({ projectId }: Props) {
  const {
    allocations, spentByDept, totalBudget, totalAllocated, totalSpent, unallocated,
    loading, addAllocation, updateAllocation, deleteAllocation, updateProjectBudget,
  } = useBudget(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deptInput, setDeptInput] = useState('');
  const [customDept, setCustomDept] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetSaved, setBudgetSaved] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setDeptInput('');
    setCustomDept('');
    setAmountInput('');
    setNotesInput('');
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const a = allocations.find(x => x.id === id);
    if (!a) return;
    setEditingId(id);
    const isCustom = !DEPT_OPTIONS.includes(a.department);
    setDeptInput(isCustom ? '__custom__' : a.department);
    setCustomDept(isCustom ? a.department : '');
    setAmountInput(String(a.allocated_amount));
    setNotesInput(a.notes ?? '');
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSaveAllocation = async () => {
    const dept = deptInput === '__custom__' ? customDept.trim() : deptInput.trim();
    const amount = parseFloat(amountInput);
    if (!dept) { setFormError('Please select or enter a department name.'); return; }
    if (!amount || amount <= 0) { setFormError('Please enter a valid amount.'); return; }

    setSaving(true);
    setFormError(null);
    const { error } = editingId
      ? await updateAllocation(editingId, amount, notesInput || null)
      : await addAllocation(dept, amount, notesInput || null);
    setSaving(false);
    if (error) { setFormError(error); return; }
    setDialogOpen(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteAllocation = async (id: string) => {
    await deleteAllocation(id);
  };

  const handleSaveBudget = async () => {
    const amount = parseFloat(budgetInput);
    if (!amount || amount <= 0) return;
    setBudgetSaving(true);
    await updateProjectBudget(amount);
    setBudgetSaving(false);
    setEditingBudget(false);
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 3000);
  };

  const netBalance = totalBudget - totalSpent;
  const spentPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const allocatedPct = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;

  const trackedDepts = new Set(allocations.map(a => a.department));
  const untrackedSpent = Object.entries(spentByDept)
    .filter(([dept]) => !trackedDepts.has(dept))
    .reduce((s, [, v]) => s + v, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Budget Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Define, allocate and track your project budget</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle className="w-4 h-4" /> Saved
          </div>
        )}
      </div>

      {!projectId && (
        <Card className="p-8 text-center text-gray-400">
          <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a project to manage its budget.</p>
        </Card>
      )}

      {projectId && (
        <Tabs defaultValue="tracker">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="tracker" className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" /> Budget Tracker
            </TabsTrigger>
            <TabsTrigger value="setup" className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> Budget Setup
            </TabsTrigger>
          </TabsList>

          {/* ── TRACKER TAB ─────────────────────────────── */}
          <TabsContent value="tracker" className="space-y-6 mt-4">

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-xs text-gray-500 mb-1">Total Budget</p>
                <p className="text-xl font-bold text-[#1E3A8A]">{fmt(totalBudget)}</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
                  <div className="h-full bg-[#1E3A8A] rounded-full" style={{ width: `${Math.min(allocatedPct, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{allocatedPct.toFixed(0)}% allocated</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-gray-500 mb-1">Total Allocated</p>
                <p className="text-xl font-bold text-indigo-600">{fmt(totalAllocated)}</p>
                <p className="text-xs text-gray-400 mt-1">{allocations.length} departments</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-gray-500 mb-1">Total Spent</p>
                <p className={`text-xl font-bold ${spentPct > 100 ? 'text-red-600' : spentPct >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {fmt(totalSpent)}
                </p>
                <p className="text-xs text-gray-400 mt-1">{spentPct.toFixed(1)}% of total budget</p>
              </Card>
              <Card className={`p-4 ${netBalance < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <p className="text-xs text-gray-500 mb-1">Net Balance</p>
                <p className={`text-xl font-bold flex items-center gap-1 ${netBalance < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {netBalance < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {fmt(Math.abs(netBalance))}
                </p>
                <p className="text-xs mt-1 text-gray-500">{netBalance < 0 ? 'Over budget' : 'Remaining'}</p>
              </Card>
            </div>

            {/* Department breakdown */}
            {allocations.length === 0 ? (
              <Card className="p-8 text-center text-gray-400">
                <IndianRupee className="w-10 h-10 mx-auto mb-3 opacity-25" />
                <p className="font-medium">No budget allocations yet</p>
                <p className="text-sm mt-1">Go to Budget Setup to allocate budget across departments.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                  <h3 className="font-medium text-gray-800 text-sm">Department Breakdown</h3>
                  <span className="text-xs text-gray-400">{allocations.length} departments</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Department</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Allocated</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Spent</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Remaining</th>
                        <th className="py-3 px-4 text-xs text-gray-500 font-medium">Usage</th>
                        <th className="py-3 px-4 text-xs text-gray-500 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map(a => {
                        const spent = spentByDept[a.department] ?? 0;
                        const remaining = a.allocated_amount - spent;
                        const pct = a.allocated_amount > 0 ? (spent / a.allocated_amount) * 100 : 0;
                        const over = spent > a.allocated_amount;
                        return (
                          <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-3 px-4">
                              <span className="text-sm font-medium text-gray-800">{a.department}</span>
                              {a.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{a.notes}</p>}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-700">{fmt(a.allocated_amount)}</td>
                            <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">{fmt(spent)}</td>
                            <td className={`py-3 px-4 text-sm text-right font-semibold ${over ? 'text-red-600' : 'text-emerald-700'}`}>
                              {over ? '-' : ''}{fmt(Math.abs(remaining))}
                            </td>
                            <td className="py-3 px-4">
                              <PctBar pct={pct} over={over} />
                            </td>
                            <td className="py-3 px-4 text-center">
                              {over ? (
                                <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Over Budget</Badge>
                              ) : pct >= 80 ? (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Near Limit</Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">On Track</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-gray-50">
                        <td className="py-3 px-4 text-sm font-semibold text-gray-800">Total</td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-gray-800">{fmt(totalAllocated)}</td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">{fmt(totalSpent)}</td>
                        <td className={`py-3 px-4 text-sm text-right font-bold ${netBalance < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {netBalance < 0 ? '-' : ''}{fmt(Math.abs(netBalance))}
                        </td>
                        <td className="py-3 px-4">
                          <PctBar pct={spentPct} over={netBalance < 0} />
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Untracked spend */}
                {untrackedSpent > 0 && (
                  <div className="px-4 py-3 border-t bg-amber-50 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      <span className="font-semibold">{fmt(untrackedSpent)}</span> in expenses belong to departments not listed in your budget allocations.
                      Add those departments in Budget Setup to track them here.
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* Unallocated notice */}
            {totalBudget > 0 && unallocated !== 0 && (
              <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${unallocated < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                {unallocated < 0
                  ? <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  : <IndianRupee className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {unallocated < 0
                  ? `Total allocations exceed the project budget by ${fmt(Math.abs(unallocated))}. Consider revising your allocations or increasing the total budget.`
                  : `${fmt(unallocated)} (${((unallocated / totalBudget) * 100).toFixed(1)}% of budget) is unallocated across departments.`}
              </div>
            )}
          </TabsContent>

          {/* ── SETUP TAB ───────────────────────────────── */}
          <TabsContent value="setup" className="space-y-6 mt-4">

            {/* Total project budget */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Total Project Budget</h3>
                  <p className="text-sm text-gray-400 mt-0.5">The overall approved budget for this project</p>
                </div>
                {budgetSaved && (
                  <div className="flex items-center gap-1.5 text-green-600 text-xs bg-green-50 px-2 py-1 rounded">
                    <CheckCircle className="w-3.5 h-3.5" /> Saved
                  </div>
                )}
              </div>
              {editingBudget ? (
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <Input
                      type="number"
                      className="pl-7 text-lg font-semibold"
                      value={budgetInput}
                      onChange={e => setBudgetInput(e.target.value)}
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                  <Button onClick={handleSaveBudget} disabled={budgetSaving} className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
                    {budgetSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingBudget(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <p className="text-3xl font-bold text-[#1E3A8A]">{fmt(totalBudget)}</p>
                  <Button variant="outline" size="sm" onClick={() => { setBudgetInput(String(totalBudget)); setEditingBudget(true); }}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                </div>
              )}
            </Card>

            {/* Allocations */}
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Department Allocations</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Assign portions of the total budget to each department</p>
                </div>
                <Button size="sm" onClick={openAdd} className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
                  <Plus className="w-4 h-4 mr-1" /> Add Department
                </Button>
              </div>

              {allocations.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Wallet className="w-10 h-10 mx-auto mb-3 opacity-25" />
                  <p className="font-medium">No allocations yet</p>
                  <p className="text-sm mt-1">Click "Add Department" to start distributing your budget.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px]">
                      <thead>
                        <tr className="border-b bg-gray-50/50">
                          <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Department</th>
                          <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Allocated Amount</th>
                          <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">% of Budget</th>
                          <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Notes</th>
                          <th className="py-3 px-4 text-xs text-gray-500 font-medium text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocations.map(a => {
                          const pct = totalBudget > 0 ? (a.allocated_amount / totalBudget) * 100 : 0;
                          return (
                            <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="py-3 px-4 font-medium text-sm text-gray-800">{a.department}</td>
                              <td className="py-3 px-4 text-sm text-right text-gray-900 font-semibold">{fmt(a.allocated_amount)}</td>
                              <td className="py-3 px-4 text-sm text-right text-gray-500">{pct.toFixed(1)}%</td>
                              <td className="py-3 px-4 text-xs text-gray-400 max-w-[180px] truncate">{a.notes || '—'}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => openEdit(a.id)}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleDeleteAllocation(a.id)}>
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 bg-gray-50">
                          <td className="py-3 px-4 text-sm font-semibold text-gray-800">Total Allocated</td>
                          <td className="py-3 px-4 text-sm text-right font-bold text-[#1E3A8A]">{fmt(totalAllocated)}</td>
                          <td className="py-3 px-4 text-sm text-right font-semibold text-gray-600">{allocatedPct.toFixed(1)}%</td>
                          <td colSpan={2} />
                        </tr>
                        <tr className="bg-gray-50/50">
                          <td className="py-2 px-4 text-xs text-gray-500">Unallocated</td>
                          <td className={`py-2 px-4 text-xs text-right font-medium ${unallocated < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {unallocated < 0 ? '-' : ''}{fmt(Math.abs(unallocated))}
                          </td>
                          <td colSpan={3} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ── Add / Edit Dialog ─────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Allocation' : 'Add Department Allocation'}</DialogTitle>
          </DialogHeader>

          {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{formError}</p>}

          <div className="space-y-4">
            {!editingId && (
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={deptInput} onValueChange={setDeptInput}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPT_OPTIONS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {deptInput === '__custom__' && (
                  <Input
                    placeholder="Enter department name"
                    value={customDept}
                    onChange={e => setCustomDept(e.target.value)}
                    autoFocus
                  />
                )}
              </div>
            )}
            {editingId && (
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={deptInput === '__custom__' ? customDept : deptInput} disabled className="bg-gray-50" />
              </div>
            )}

            <div className="space-y-2">
              <Label>Allocated Amount (₹) <span className="text-red-400">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <Input
                  type="number"
                  placeholder="0"
                  className="pl-7"
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                />
              </div>
              {totalBudget > 0 && amountInput && (
                <p className="text-xs text-gray-400">
                  = {((parseFloat(amountInput) / totalBudget) * 100).toFixed(1)}% of total budget
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Textarea
                placeholder="Any notes about this allocation..."
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAllocation} disabled={saving} className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : editingId ? 'Save Changes' : 'Add Allocation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
