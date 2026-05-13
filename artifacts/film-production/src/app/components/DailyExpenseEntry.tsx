import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CalendarIcon, Upload, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useDailyExpenses } from '../hooks/useDailyExpenses';

interface ExpenseRow {
  id: string;
  accountHead: string;
  amount: number;
  nos: number;
  bill: File | null;
}

interface Props {
  projectId: string | null;
}

const departments = [
  'Batta (Daily Allowance)',
  'Lodging',
  'Mess (Meals)',
  'Equipment Rental',
  'Vehicles',
  'Location Fee',
  'Others',
];

export function DailyExpenseEntry({ projectId }: Props) {
  const { expenses, loading, addExpenses, deleteExpense } = useDailyExpenses(projectId);
  const [date, setDate] = useState<Date>(new Date());
  const [department, setDepartment] = useState('');
  const [rows, setRows] = useState<ExpenseRow[]>([{ id: '1', accountHead: '', amount: 0, nos: 1, bill: null }]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRow = () => setRows([...rows, { id: Date.now().toString(), accountHead: '', amount: 0, nos: 1, bill: null }]);
  const removeRow = (id: string) => setRows(rows.filter(r => r.id !== id));
  const updateRow = (id: string, field: keyof ExpenseRow, value: any) =>
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  const calculateTotal = () => rows.reduce((sum, r) => sum + r.amount * r.nos, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  const handleSave = async () => {
    if (!department || rows.some(r => !r.accountHead)) {
      setError('Please fill in department and all account heads.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await addExpenses(rows.map(r => ({
      expense_date: format(date, 'yyyy-MM-dd'),
      department,
      account_head: r.accountHead,
      amount: r.amount,
      nos: r.nos,
      bill_url: null,
    })));
    setSaving(false);
    if (err) { setError(err); return; }
    setRows([{ id: '1', accountHead: '', amount: 0, nos: 1, bill: null }]);
    setDepartment('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Tabs defaultValue="entry" className="space-y-4 md:space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="entry">Daily Expense Entry</TabsTrigger>
          <TabsTrigger value="history">Expense History</TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="space-y-4 md:space-y-6">
          <Card className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl mb-4 md:mb-6">Add Daily Expenses</h2>

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            {saved && (
              <div className="flex items-center gap-2 text-green-600 text-sm mb-4">
                <CheckCircle className="w-4 h-4" /> Expenses saved successfully.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-4 text-sm text-gray-600 px-2">
                <div className="col-span-4">Account Head</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Nos</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-2">Actions</div>
              </div>

              {rows.map(row => (
                <div key={row.id}>
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <Input placeholder="e.g., Location fee, Meals" value={row.accountHead}
                        onChange={e => updateRow(row.id, 'accountHead', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="0" value={row.amount || ''}
                        onChange={e => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="1" value={row.nos || ''}
                        onChange={e => updateRow(row.id, 'nos', parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="col-span-2 px-2">
                      <span className="text-gray-900">{formatCurrency(row.amount * row.nos)}</span>
                    </div>
                    <div className="col-span-2 flex gap-2">
                      {rows.length > 1 && (
                        <Button variant="outline" size="sm" onClick={() => removeRow(row.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Card className="md:hidden p-4 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Account Head</Label>
                      <Input placeholder="e.g., Location fee" value={row.accountHead}
                        onChange={e => updateRow(row.id, 'accountHead', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Amount</Label>
                        <Input type="number" placeholder="0" value={row.amount || ''}
                          onChange={e => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Nos</Label>
                        <Input type="number" placeholder="1" value={row.nos || ''}
                          onChange={e => updateRow(row.id, 'nos', parseInt(e.target.value) || 1)} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="text-base">{formatCurrency(row.amount * row.nos)}</span>
                    </div>
                    {rows.length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => removeRow(row.id)}>
                        <Trash2 className="w-4 h-4 text-red-500 mr-2" /> Remove
                      </Button>
                    )}
                  </Card>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                <Button variant="outline" onClick={addRow} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" /> Add New Row
                </Button>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-sm text-gray-600 mb-1">Daily Total</p>
                  <p className="text-xl md:text-2xl text-[#1E3A8A]">{formatCurrency(calculateTotal())}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button variant="outline" className="w-full sm:w-auto"
                  onClick={() => { setRows([{ id: '1', accountHead: '', amount: 0, nos: 1, bill: null }]); setDepartment(''); }}>
                  Cancel
                </Button>
                <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 w-full sm:w-auto" onClick={handleSave} disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Day Summary'}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl mb-4 md:mb-6">Expense History</h2>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" /></div>
            ) : expenses.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No expenses recorded yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Department</th>
                      <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Account Head</th>
                      <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Amount</th>
                      <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Nos</th>
                      <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Total</th>
                      <th className="text-center py-3 px-4 text-xs md:text-sm text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(item => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-xs md:text-sm whitespace-nowrap">{item.expense_date}</td>
                        <td className="py-3 px-4 text-xs md:text-sm">{item.department}</td>
                        <td className="py-3 px-4 text-xs md:text-sm">{item.account_head}</td>
                        <td className="py-3 px-4 text-xs md:text-sm text-right">{formatCurrency(item.amount)}</td>
                        <td className="py-3 px-4 text-xs md:text-sm text-right">{item.nos}</td>
                        <td className="py-3 px-4 text-xs md:text-sm text-right whitespace-nowrap">{formatCurrency(item.total)}</td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="outline" size="sm" onClick={() => deleteExpense(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="py-3 px-4 text-right text-sm">Total:</td>
                      <td className="py-3 px-4 text-right text-[#1E3A8A]">
                        {formatCurrency(expenses.reduce((s, e) => s + e.total, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
