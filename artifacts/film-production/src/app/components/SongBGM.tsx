import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface MusicExpense {
  id: string;
  role: string;
  description: string;
  budget: number;
  paid: number;
  balance: number;
  remarks: string;
}

export function SongBGM() {
  const [expenses, setExpenses] = useState<MusicExpense[]>([
    { id: '1', role: 'Music Director', description: 'Original Score Composition', budget: 500000, paid: 250000, balance: 250000, remarks: '50% advance paid' },
    { id: '2', role: 'Lyricist', description: '4 Songs', budget: 200000, paid: 200000, balance: 0, remarks: 'Full payment completed' },
    { id: '3', role: 'Playback Singer - Male', description: '3 Songs', budget: 150000, paid: 100000, balance: 50000, remarks: 'Recording in progress' },
    { id: '4', role: 'Playback Singer - Female', description: '2 Songs', budget: 120000, paid: 60000, balance: 60000, remarks: '50% advance' },
    { id: '5', role: 'Studio Rent', description: 'Recording Sessions (10 days)', budget: 180000, paid: 108000, balance: 72000, remarks: '6 days completed' },
    { id: '6', role: 'Background Score', description: 'BGM Composition & Recording', budget: 400000, paid: 0, balance: 400000, remarks: 'Scheduled for next month' },
    { id: '7', role: 'Mixing & Mastering', description: '4 Songs + BGM', budget: 250000, paid: 0, balance: 250000, remarks: 'Post production phase' },
    { id: '8', role: 'Session Musicians', description: 'Orchestra & Instruments', budget: 300000, paid: 150000, balance: 150000, remarks: 'Per session basis' }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    role: '',
    description: '',
    budget: 0,
    remarks: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const calculateTotals = () => {
    return expenses.reduce((acc, expense) => ({
      budget: acc.budget + expense.budget,
      paid: acc.paid + expense.paid,
      balance: acc.balance + expense.balance
    }), { budget: 0, paid: 0, balance: 0 });
  };

  const handleAddExpense = () => {
    const expense: MusicExpense = {
      id: Date.now().toString(),
      role: newExpense.role,
      description: newExpense.description,
      budget: newExpense.budget,
      paid: 0,
      balance: newExpense.budget,
      remarks: newExpense.remarks
    };
    setExpenses([...expenses, expense]);
    setIsAddDialogOpen(false);
    setNewExpense({ role: '', description: '', budget: 0, remarks: '' });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const totals = calculateTotals();

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Song & BGM Budget</h1>
          <p className="text-gray-600">Manage music production expenses</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
              <Plus className="w-4 h-4 mr-2" />
              Add New Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Music Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role/Category</Label>
                <Input 
                  placeholder="e.g., Music Director, Singer, etc."
                  value={newExpense.role}
                  onChange={(e) => setNewExpense({ ...newExpense, role: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  placeholder="Brief description of work"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Budget Amount</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={newExpense.budget || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, budget: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea 
                  placeholder="Payment terms, schedule, etc."
                  value={newExpense.remarks}
                  onChange={(e) => setNewExpense({ ...newExpense, remarks: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button 
                  className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                  onClick={handleAddExpense}
                >
                  Add Expense
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Total Budget</p>
          <p className="text-3xl text-gray-900">{formatCurrency(totals.budget)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Total Paid</p>
          <p className="text-3xl text-gray-900">{formatCurrency(totals.paid)}</p>
          <div className="mt-2 text-sm text-gray-500">
            {((totals.paid / totals.budget) * 100).toFixed(1)}% of budget
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Balance Remaining</p>
          <p className="text-3xl text-[#1E3A8A]">{formatCurrency(totals.balance)}</p>
        </Card>
      </div>

      {/* Expense Table */}
      <Card className="p-6">
        <h2 className="text-xl mb-6">Music Production Expenses</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Role/Category</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Description</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Budget</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Paid</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Balance</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Remarks</th>
                <th className="text-center py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{expense.role}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{expense.description}</td>
                  <td className="py-3 px-4 text-sm text-right">{formatCurrency(expense.budget)}</td>
                  <td className="py-3 px-4 text-right">
                    <Input 
                      type="number" 
                      value={expense.paid} 
                      className="w-32 ml-auto text-right text-sm"
                      onChange={(e) => {
                        const newPaid = parseFloat(e.target.value) || 0;
                        setExpenses(expenses.map(exp => 
                          exp.id === expense.id 
                            ? { ...exp, paid: newPaid, balance: exp.budget - newPaid }
                            : exp
                        ));
                      }}
                    />
                  </td>
                  <td className="py-3 px-4 text-sm text-right">{formatCurrency(expense.balance)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{expense.remarks}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={2} className="py-4 px-4">Total</td>
                <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(totals.budget)}</td>
                <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(totals.paid)}</td>
                <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(totals.balance)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Progress Bars */}
      <Card className="p-6">
        <h2 className="text-xl mb-6">Budget Allocation Progress</h2>
        <div className="space-y-4">
          {expenses.map((expense) => {
            const percentage = (expense.paid / expense.budget) * 100;
            return (
              <div key={expense.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">{expense.role}</span>
                  <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      percentage === 100 ? 'bg-green-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-[#1E3A8A]'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
