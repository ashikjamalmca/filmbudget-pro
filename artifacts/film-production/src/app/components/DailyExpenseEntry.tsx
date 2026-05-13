import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { CalendarIcon, Plus, Trash2, Loader2, CheckCircle, Tag, Globe, User, DollarSign, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { useDailyExpenses } from '../hooks/useDailyExpenses';
import { useExpenseCategories } from '../hooks/useExpenseCategories';
import { useProfiles } from '../hooks/useProfiles';
import { useAuth } from '../context/AuthContext';
import { useRemuneration } from '../hooks/useRemuneration';

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

export function DailyExpenseEntry({ projectId }: Props) {
  const { expenses, loading, addExpenses, deleteExpense } = useDailyExpenses(projectId);
  const { withSubs, subsFor, loading: catLoading } = useExpenseCategories();
  const { profile } = useAuth();
  const { profiles, loading: usersLoading } = useProfiles();
  const { entries: remunerationEntries, addPayment: addRemunerationPayment } = useRemuneration(projectId);

  const [date, setDate] = useState<Date>(new Date());
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [description, setDescription] = useState('');
  const [isRemunerationPayment, setIsRemunerationPayment] = useState(false);
  const [linkedRemunerationId, setLinkedRemunerationId] = useState('');

  // Default paidBy to the currently logged-in user's name once profile loads
  useEffect(() => {
    if (profile?.full_name && !paidBy) {
      setPaidBy(profile.full_name);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.full_name]);
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

  const selectedCategory = withSubs.find(c => c.id === categoryId);
  const availableSubcategories = categoryId ? subsFor(categoryId) : [];

  const handleCategoryChange = (val: string) => {
    setCategoryId(val);
    setSubcategoryId('');
  };

  const handleSave = async () => {
    if (!categoryId || rows.some(r => !r.accountHead)) {
      setError('Please select a category and fill in all item/service descriptions.');
      return;
    }
    if (isRemunerationPayment && !linkedRemunerationId) {
      setError('Please select a remuneration record to link, or uncheck the remuneration option.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await addExpenses(rows.map(r => ({
      expense_date: format(date, 'yyyy-MM-dd'),
      department: selectedCategory?.name ?? '',
      account_head: r.accountHead,
      amount: r.amount,
      nos: r.nos,
      bill_url: null,
      paid_by: paidBy || null,
      description: description || null,
      category_id: categoryId || null,
      subcategory_id: subcategoryId || null,
    })));
    if (err) { setSaving(false); setError(err); return; }

    // If this is a remuneration payment, record it in the payment history
    if (isRemunerationPayment && linkedRemunerationId) {
      const totalAmount = calculateTotal();
      await addRemunerationPayment(
        linkedRemunerationId,
        totalAmount,
        format(date, 'yyyy-MM-dd'),
        paidBy || null,
        description || 'Paid via Daily Expenses',
        null,
      );
    }

    setSaving(false);
    setRows([{ id: '1', accountHead: '', amount: 0, nos: 1, bill: null }]);
    setCategoryId('');
    setSubcategoryId('');
    setPaidBy('');
    setDescription('');
    setIsRemunerationPayment(false);
    setLinkedRemunerationId('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setRows([{ id: '1', accountHead: '', amount: 0, nos: 1, bill: null }]);
    setCategoryId('');
    setSubcategoryId('');
    setPaidBy('');
    setDescription('');
    setIsRemunerationPayment(false);
    setLinkedRemunerationId('');
    setError(null);
  };

  const getCategoryLabel = (exp: typeof expenses[0]) => {
    const cat = withSubs.find(c => c.id === exp.category_id);
    const sub = cat?.subcategories.find(s => s.id === exp.subcategory_id);
    if (cat && sub) return `${cat.name} › ${sub.name}`;
    if (cat) return cat.name;
    return exp.department || '—';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Tabs defaultValue="entry" className="space-y-4 md:space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="entry">Daily Expense Entry</TabsTrigger>
          <TabsTrigger value="history">Expense History</TabsTrigger>
        </TabsList>

        {/* ── Entry Tab ── */}
        <TabsContent value="entry" className="space-y-4 md:space-y-6">
          <Card className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl mb-4 md:mb-6">Add Daily Expenses</h2>

            {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded">{error}</p>}
            {saved && (
              <div className="flex items-center gap-2 text-green-600 text-sm mb-4 bg-green-50 p-3 rounded">
                <CheckCircle className="w-4 h-4" /> Expenses saved successfully.
              </div>
            )}

            {/* Row 1 — Date + Paid By */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                <Label>Paid By</Label>
                {usersLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 h-10">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading users...
                  </div>
                ) : (
                  <Select value={paidBy} onValueChange={setPaidBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => (
                        <SelectItem key={p.id} value={p.full_name ?? p.id}>
                          <span className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{p.full_name ?? p.id}</span>
                            {p.id === profile?.id && (
                              <span className="text-xs text-indigo-500 ml-1">(you)</span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Row 2 — Category + Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Category</Label>
                {catLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 h-10">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading categories...
                  </div>
                ) : (
                  <Select value={categoryId} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {withSubs.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            {cat.tenant_id === null
                              ? <Globe className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                              : <Tag className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            }
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-gray-400 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-indigo-400" /> Platform default</span>
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3 text-blue-400" /> Company-specific</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Subcategory <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Select
                  value={subcategoryId}
                  onValueChange={setSubcategoryId}
                  disabled={!categoryId || availableSubcategories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !categoryId ? 'Select a category first' :
                      availableSubcategories.length === 0 ? 'No subcategories available' :
                      'Select subcategory'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubcategories.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3 — Description */}
            <div className="space-y-2 mb-4">
              <Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Textarea
                placeholder="Notes, transaction context, or any relevant details..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Row 4 — Remuneration linking */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => { setIsRemunerationPayment(v => !v); setLinkedRemunerationId(''); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  isRemunerationPayment
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>
                  {isRemunerationPayment ? 'Linked as Remuneration Payment' : 'Link as Remuneration Payment'}
                </span>
                <Link2 className="w-3.5 h-3.5 ml-1 opacity-60" />
              </button>

              {isRemunerationPayment && (
                <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 space-y-2">
                  <Label className="text-xs text-indigo-700">Select Remuneration Record</Label>
                  {remunerationEntries.length === 0 ? (
                    <p className="text-xs text-indigo-500">
                      No remuneration entries found for this project. Add them first in the Remuneration module.
                    </p>
                  ) : (
                    <Select value={linkedRemunerationId} onValueChange={setLinkedRemunerationId}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select person / record" />
                      </SelectTrigger>
                      <SelectContent>
                        {remunerationEntries.map(e => (
                          <SelectItem key={e.id} value={e.id}>
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{e.person_name}</span>
                              <span className="text-gray-400 text-xs">· {e.department}</span>
                              <span className="text-amber-600 text-xs ml-1">
                                Balance: ₹{e.balance_amount.toLocaleString('en-IN')}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-indigo-500">
                    The total expense amount will be recorded as a payment against the selected remuneration record.
                  </p>
                </div>
              )}
            </div>

            {/* Expense detail rows */}
            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-4 text-sm text-gray-600 px-2">
                <div className="col-span-4">Item / Service</div>
                <div className="col-span-2">Amount (₹)</div>
                <div className="col-span-2">Nos</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-2">Actions</div>
              </div>

              {rows.map(row => (
                <div key={row.id}>
                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <Input placeholder="e.g. Location fee, Meals" value={row.accountHead}
                        onChange={e => updateRow(row.id, 'accountHead', e.target.value)} title="Item / Service" />
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
                      <span className="text-gray-900 font-medium">{formatCurrency(row.amount * row.nos)}</span>
                    </div>
                    <div className="col-span-2">
                      {rows.length > 1 && (
                        <Button variant="outline" size="sm" onClick={() => removeRow(row.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mobile */}
                  <Card className="md:hidden p-4 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Item / Service</Label>
                      <Input placeholder="e.g. Location fee" value={row.accountHead}
                        onChange={e => updateRow(row.id, 'accountHead', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Amount (₹)</Label>
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
                      <span className="text-base font-medium">{formatCurrency(row.amount * row.nos)}</span>
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
                  <p className="text-xl md:text-2xl text-[#1E3A8A] font-semibold">{formatCurrency(calculateTotal())}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button variant="outline" className="w-full sm:w-auto" onClick={handleCancel}>Cancel</Button>
                <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 w-full sm:w-auto" onClick={handleSave} disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Day Summary'}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history">
          <Card className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl mb-4 md:mb-6">Expense History</h2>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" /></div>
            ) : expenses.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No expenses recorded yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Category</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Item / Service</th>
                      <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Paid By</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Amount</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Nos</th>
                      <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Total</th>
                      <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(item => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-xs whitespace-nowrap text-gray-700">{item.expense_date}</td>
                        <td className="py-3 px-4 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-gray-800">{getCategoryLabel(item)}</span>
                            {item.description && (
                              <p className="text-gray-400 text-xs truncate max-w-[160px]" title={item.description}>{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-700">{item.account_head}</td>
                        <td className="py-3 px-4 text-xs">
                          {item.paid_by
                            ? <Badge variant="outline" className="text-xs font-normal">{item.paid_by}</Badge>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-3 px-4 text-xs text-right text-gray-700">{formatCurrency(item.amount)}</td>
                        <td className="py-3 px-4 text-xs text-right text-gray-700">{item.nos}</td>
                        <td className="py-3 px-4 text-xs text-right font-medium text-gray-900 whitespace-nowrap">{formatCurrency(item.total)}</td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="outline" size="sm" onClick={() => deleteExpense(item.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t">
                      <td colSpan={6} className="py-3 px-4 text-right text-sm text-gray-600 font-medium">Grand Total:</td>
                      <td className="py-3 px-4 text-right text-[#1E3A8A] font-semibold">
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
