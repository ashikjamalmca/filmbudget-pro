import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { CalendarIcon, Plus, Trash2, Loader2, CheckCircle, Tag, Globe, User } from 'lucide-react';
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
  const { addExpenses } = useDailyExpenses(projectId);
  const { withSubs, subsFor, loading: catLoading } = useExpenseCategories();
  const { profile } = useAuth();
  const { profiles, loading: usersLoading } = useProfiles();
  const { entries: remunerationEntries, addPayment: addRemunerationPayment } = useRemuneration(projectId);

  const [date, setDate] = useState<Date>(new Date());
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [description, setDescription] = useState('');
  const [linkedRemunerationId, setLinkedRemunerationId] = useState('');
  const [remunerationAmount, setRemunerationAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('');
  const [referenceNo, setReferenceNo] = useState('');

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
  const isRemunerationCategory = selectedCategory?.name?.toLowerCase() === 'remuneration';

  const handleCategoryChange = (val: string) => {
    setCategoryId(val);
    setSubcategoryId('');
    setLinkedRemunerationId('');
    setRemunerationAmount(0);
  };

  const handleSave = async () => {
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }
    if (isRemunerationCategory) {
      if (!linkedRemunerationId) {
        setError('Please select a person from the Subcategory / Person Name dropdown.');
        return;
      }
      if (!remunerationAmount || remunerationAmount <= 0) {
        setError('Please enter a payment amount.');
        return;
      }
    } else {
      if (rows.some(r => !r.accountHead)) {
        setError('Please fill in all Item / Service descriptions.');
        return;
      }
    }
    setSaving(true);
    setError(null);

    if (isRemunerationCategory) {
      const linkedEntry = remunerationEntries.find(e => e.id === linkedRemunerationId);
      const personName = linkedEntry?.person_name ?? 'Remuneration Payment';
      const { error: err } = await addExpenses([{
        expense_date: format(date, 'yyyy-MM-dd'),
        department: 'Remuneration',
        account_head: personName,
        amount: remunerationAmount,
        nos: 1,
        bill_url: null,
        paid_by: paidBy || null,
        description: description || null,
        pay_method: payMethod || null,
        reference_no: referenceNo || null,
        category_id: categoryId,
        subcategory_id: null,
      }]);
      if (err) { setSaving(false); setError(err); return; }
      await addRemunerationPayment(
        linkedRemunerationId,
        remunerationAmount,
        format(date, 'yyyy-MM-dd'),
        paidBy || null,
        description || 'Paid via Daily Expenses',
        null,
      );
    } else {
      const { error: err } = await addExpenses(rows.map(r => ({
        expense_date: format(date, 'yyyy-MM-dd'),
        department: selectedCategory?.name ?? '',
        account_head: r.accountHead,
        amount: r.amount,
        nos: r.nos,
        bill_url: null,
        paid_by: paidBy || null,
        description: description || null,
        pay_method: payMethod || null,
        reference_no: referenceNo || null,
        category_id: categoryId || null,
        subcategory_id: subcategoryId || null,
      })));
      if (err) { setSaving(false); setError(err); return; }
    }

    setSaving(false);
    setRows([{ id: '1', accountHead: '', amount: 0, nos: 1, bill: null }]);
    setCategoryId('');
    setSubcategoryId('');
    setPaidBy('');
    setDescription('');
    setLinkedRemunerationId('');
    setRemunerationAmount(0);
    setPayMethod('');
    setReferenceNo('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setRows([{ id: '1', accountHead: '', amount: 0, nos: 1, bill: null }]);
    setCategoryId('');
    setSubcategoryId('');
    setPaidBy('');
    setDescription('');
    setLinkedRemunerationId('');
    setRemunerationAmount(0);
    setPayMethod('');
    setReferenceNo('');
    setError(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl mb-4 md:mb-6">Add Daily Expenses</h2>

            {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded">{error}</p>}
            {saved && (
              <div className="flex items-center gap-2 text-green-600 text-sm mb-4 bg-green-50 p-3 rounded">
                <CheckCircle className="w-4 h-4" /> Expenses saved successfully.
              </div>
            )}

            {/* Row 1 — Category + Subcategory */}
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
                {isRemunerationCategory ? (
                  <>
                    <Label>Person Name <span className="text-red-400">*</span></Label>
                    {remunerationEntries.length === 0 ? (
                      <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        No remuneration records found. Add them first in the Remuneration module.
                      </p>
                    ) : (
                      <Select value={linkedRemunerationId} onValueChange={setLinkedRemunerationId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select person" />
                        </SelectTrigger>
                        <SelectContent>
                          {remunerationEntries.map(e => (
                            <SelectItem key={e.id} value={e.id}>
                              <span className="flex items-center gap-2">
                                <span className="font-medium">{e.person_name}</span>
                                <span className="text-gray-400 text-xs">· {e.department}</span>
                                <span className="text-amber-600 text-xs ml-1">
                                  Bal: ₹{e.balance_amount.toLocaleString('en-IN')}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>

            {/* Expense detail rows — simplified for Remuneration, full multi-row otherwise */}
            {isRemunerationCategory ? (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg space-y-3">
                  <div className="space-y-2">
                    <Label>Payment Amount (₹) <span className="text-red-400">*</span></Label>
                    <Input
                      type="number"
                      placeholder="0"
                      className="text-lg font-semibold bg-white"
                      value={remunerationAmount || ''}
                      onChange={e => setRemunerationAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  {linkedRemunerationId && (() => {
                    const entry = remunerationEntries.find(e => e.id === linkedRemunerationId);
                    if (!entry) return null;
                    return (
                      <div className="flex flex-wrap gap-4 text-sm pt-1 border-t border-indigo-100">
                        <span className="text-gray-500">Agreed: <span className="font-medium text-gray-800">₹{entry.agreed_amount.toLocaleString('en-IN')}</span></span>
                        <span className="text-gray-500">Paid so far: <span className="font-medium text-green-700">₹{entry.paid_amount.toLocaleString('en-IN')}</span></span>
                        <span className="text-gray-500">Balance: <span className="font-medium text-amber-700">₹{entry.balance_amount.toLocaleString('en-IN')}</span></span>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t">
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-sm text-gray-600 mb-1">Payment Amount</p>
                    <p className="text-xl md:text-2xl text-[#1E3A8A] font-semibold">{formatCurrency(remunerationAmount)}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={handleCancel}>Cancel</Button>
                  <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 w-full sm:w-auto" onClick={handleSave} disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Payment'}
                  </Button>
                </div>
              </div>
            ) : (
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

                {/* Date + Pay Method + Reference No + Paid By — single row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
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
                    <Label>Pay Method <span className="text-gray-400 font-normal">(optional)</span></Label>
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card', 'Petty Cash'].map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference No <span className="text-gray-400 font-normal">(optional)</span></Label>
                    <Input
                      placeholder="Cheque no., UPI ref, transaction ID..."
                      value={referenceNo}
                      onChange={e => setReferenceNo(e.target.value)}
                    />
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

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <Textarea
                    placeholder="Notes, transaction context, or any relevant details..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={handleCancel}>Cancel</Button>
                  <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 w-full sm:w-auto" onClick={handleSave} disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Day Summary'}
                  </Button>
                </div>
              </div>
            )}
      </Card>
    </div>
  );
}
