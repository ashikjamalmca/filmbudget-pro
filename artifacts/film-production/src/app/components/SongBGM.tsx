import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useMusicExpenses } from '../hooks/useMusicExpenses';

interface Props {
  projectId: string | null;
}

export function SongBGM({ projectId }: Props) {
  const { expenses, loading, addExpense, updatePayment, deleteExpense } = useMusicExpenses(projectId);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ role: '', description: '', budget: '', remarks: '' });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

  const totals = expenses.reduce((acc, e) => ({
    budget: acc.budget + e.budget,
    paid: acc.paid + e.paid,
    balance: acc.balance + e.balance,
  }), { budget: 0, paid: 0, balance: 0 });

  const handleAdd = async () => {
    if (!form.role || !form.budget) return;
    setSaving(true);
    await addExpense({ role: form.role, description: form.description, budget: Number(form.budget), remarks: form.remarks });
    setSaving(false);
    setIsOpen(false);
    setForm({ role: '', description: '', budget: '', remarks: '' });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Song & BGM Budget</h1>
          <p className="text-gray-600">Manage music production expenses</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"><Plus className="w-4 h-4 mr-2" />Add New Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Music Expense</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Role / Category</Label><Input placeholder="e.g., Music Director, Singer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Input placeholder="Brief description of work" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Budget Amount (₹)</Label><Input type="number" placeholder="0" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></div>
              <div className="space-y-2"><Label>Remarks</Label><Textarea placeholder="Payment terms, schedule, etc." value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleAdd} disabled={saving}>
                  {saving ? 'Adding...' : 'Add Expense'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6"><p className="text-sm text-gray-600 mb-1">Total Budget</p><p className="text-3xl text-gray-900">{formatCurrency(totals.budget)}</p></Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Total Paid</p>
          <p className="text-3xl text-gray-900">{formatCurrency(totals.paid)}</p>
          {totals.budget > 0 && <div className="mt-2 text-sm text-gray-500">{((totals.paid / totals.budget) * 100).toFixed(1)}% of budget</div>}
        </Card>
        <Card className="p-6"><p className="text-sm text-gray-600 mb-1">Balance Remaining</p><p className="text-3xl text-[#1E3A8A]">{formatCurrency(totals.balance)}</p></Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" /></div>
      ) : (
        <>
          <Card className="p-6">
            <h2 className="text-xl mb-6">Music Production Expenses</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Role / Category</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Description</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-600">Budget</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-600">Paid</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-600">Balance</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Remarks</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-gray-500 text-sm">No music expenses added yet.</td></tr>
                  ) : expenses.map(exp => (
                    <tr key={exp.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{exp.role}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{exp.description}</td>
                      <td className="py-3 px-4 text-sm text-right">{formatCurrency(exp.budget)}</td>
                      <td className="py-3 px-4 text-right">
                        <Input
                          type="number"
                          defaultValue={exp.paid}
                          className="w-32 ml-auto text-right text-sm"
                          onBlur={e => updatePayment(exp.id, parseFloat(e.target.value) || 0, exp.budget)}
                        />
                      </td>
                      <td className="py-3 px-4 text-sm text-right">{formatCurrency(exp.balance)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{exp.remarks}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => deleteExpense(exp.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {expenses.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={2} className="py-4 px-4">Total</td>
                      <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(totals.budget)}</td>
                      <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(totals.paid)}</td>
                      <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(totals.balance)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>

          {expenses.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl mb-6">Budget Allocation Progress</h2>
              <div className="space-y-4">
                {expenses.map(exp => {
                  const pct = exp.budget > 0 ? (exp.paid / exp.budget) * 100 : 0;
                  return (
                    <div key={exp.id}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">{exp.role}</span>
                        <span className="text-sm text-gray-600">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-yellow-500' : 'bg-[#1E3A8A]'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
