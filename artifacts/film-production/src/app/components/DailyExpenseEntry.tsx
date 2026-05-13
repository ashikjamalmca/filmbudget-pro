import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Plus, Trash2, Loader2, CheckCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { useDailyExpenses } from '../hooks/useDailyExpenses';
import { useExpenseCategories } from '../hooks/useExpenseCategories';
import { useProfiles } from '../hooks/useProfiles';
import { useAuth } from '../context/AuthContext';
import { useRemuneration } from '../hooks/useRemuneration';

interface ExpenseRow {
  id: string;
  categoryId: string;
  subcategoryId: string;
  accountHead: string;
  amount: number;
  nos: number;
  bill: File | null;
  linkedRemunerationId: string;
}

interface Props {
  projectId: string | null;
}

const emptyRow = (): ExpenseRow => ({
  id: Date.now().toString() + Math.random(),
  categoryId: '',
  subcategoryId: '',
  accountHead: '',
  amount: 0,
  nos: 1,
  bill: null,
  linkedRemunerationId: '',
});

export function DailyExpenseEntry({ projectId }: Props) {
  const { addExpenses } = useDailyExpenses(projectId);
  const { withSubs, subsFor, loading: catLoading } = useExpenseCategories();
  const { profile } = useAuth();
  const { profiles, loading: usersLoading } = useProfiles();
  const { entries: remunerationEntries, addPayment: addRemunerationPayment } = useRemuneration(projectId);

  const [date, setDate] = useState<Date>(new Date());
  const [paidBy, setPaidBy] = useState('');
  const [description, setDescription] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [rows, setRows] = useState<ExpenseRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.full_name && !paidBy) setPaidBy(profile.full_name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.full_name]);

  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const updateRow = (id: string, field: keyof ExpenseRow, value: any) =>
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'categoryId') {
        updated.subcategoryId = '';
        updated.accountHead = '';
        updated.linkedRemunerationId = '';
      }
      return updated;
    }));

  const isRemuneration = (row: ExpenseRow) => {
    const cat = withSubs.find(c => c.id === row.categoryId);
    return cat?.name?.toLowerCase() === 'remuneration';
  };

  const calculateTotal = () => rows.reduce((sum, r) => sum + r.amount * r.nos, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  const handleSave = async () => {
    for (const r of rows) {
      if (!r.categoryId) { setError('Please select a category for every row.'); return; }
      if (isRemuneration(r)) {
        if (!r.linkedRemunerationId) { setError('Please select a person for every Remuneration row.'); return; }
        if (!r.amount || r.amount <= 0) { setError('Please enter an amount for every Remuneration row.'); return; }
      } else {
        if (!r.accountHead) { setError('Please fill in Item / Service for every row.'); return; }
      }
    }
    setSaving(true);
    setError(null);

    const expensePayload = rows.map(r => {
      const cat = withSubs.find(c => c.id === r.categoryId);
      const personName = isRemuneration(r)
        ? (remunerationEntries.find(e => e.id === r.linkedRemunerationId)?.person_name ?? 'Remuneration Payment')
        : r.accountHead;
      return {
        expense_date: format(date, 'yyyy-MM-dd'),
        department: cat?.name ?? '',
        account_head: personName,
        amount: r.amount,
        nos: isRemuneration(r) ? 1 : r.nos,
        bill_url: null,
        paid_by: paidBy || null,
        description: description || null,
        pay_method: payMethod || null,
        reference_no: referenceNo || null,
        category_id: r.categoryId || null,
        subcategory_id: r.subcategoryId || null,
      };
    });

    const { error: err } = await addExpenses(expensePayload);
    if (err) { setSaving(false); setError(err); return; }

    for (const r of rows.filter(isRemuneration)) {
      await addRemunerationPayment(
        r.linkedRemunerationId,
        r.amount,
        format(date, 'yyyy-MM-dd'),
        paidBy || null,
        description || 'Paid via Daily Expenses',
        null,
      );
    }

    setSaving(false);
    setRows([emptyRow()]);
    setPaidBy(profile?.full_name ?? '');
    setDescription('');
    setPayMethod('');
    setReferenceNo('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setRows([emptyRow()]);
    setPaidBy(profile?.full_name ?? '');
    setDescription('');
    setPayMethod('');
    setReferenceNo('');
    setError(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl">Add Daily Expenses</h2>
          <Button size="sm" className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white" onClick={addRow}>
            <Plus className="w-4 h-4 mr-2" /> Add New Row
          </Button>
        </div>

        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded">{error}</p>}
        {saved && (
          <div className="flex items-center gap-2 text-green-600 text-sm mb-4 bg-green-50 p-3 rounded">
            <CheckCircle className="w-4 h-4" /> Expenses saved successfully.
          </div>
        )}

        {/* ── Expense rows table ── */}
        <div className="space-y-2">
          {/* Desktop header */}
          <div className="hidden lg:grid grid-cols-[2fr_2fr_2.5fr_1.5fr_0.8fr_1.2fr_auto] gap-2 text-xs text-gray-500 font-medium px-1 pb-1 border-b">
            <div>Category</div>
            <div>Subcategory</div>
            <div>Item / Service</div>
            <div>Amount (₹)</div>
            <div>Nos</div>
            <div>Total</div>
            <div className="w-8" />
          </div>

          {rows.map((row, idx) => {
            const availableSubs = row.categoryId ? subsFor(row.categoryId) : [];
            const remRow = isRemuneration(row);
            const rowTotal = row.amount * row.nos;

            return (
              <div key={row.id}>
                {/* Desktop row */}
                <div className="hidden lg:grid grid-cols-[2fr_2fr_2.5fr_1.5fr_0.8fr_1.2fr_auto] gap-2 items-center">
                  {/* Category */}
                  <Select value={row.categoryId} onValueChange={v => updateRow(row.id, 'categoryId', v)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder={catLoading ? 'Loading…' : 'Category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {withSubs.map(cat => (
                        <SelectItem key={cat.id} value={cat.id} className="text-xs">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Subcategory / Person */}
                  {remRow ? (
                    <Select value={row.linkedRemunerationId} onValueChange={v => updateRow(row.id, 'linkedRemunerationId', v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                      <SelectContent>
                        {remunerationEntries.map(e => (
                          <SelectItem key={e.id} value={e.id} className="text-xs">
                            {e.person_name} · Bal: ₹{e.balance_amount.toLocaleString('en-IN')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={row.subcategoryId}
                      onValueChange={v => updateRow(row.id, 'subcategoryId', v)}
                      disabled={!row.categoryId || availableSubs.length === 0}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder={!row.categoryId ? '—' : availableSubs.length === 0 ? 'None' : 'Subcategory'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubs.map(sub => (
                          <SelectItem key={sub.id} value={sub.id} className="text-xs">{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Item / Service */}
                  {remRow ? (
                    <div className="h-9 flex items-center px-3 bg-gray-50 rounded border text-xs text-gray-400 italic">
                      {row.linkedRemunerationId
                        ? remunerationEntries.find(e => e.id === row.linkedRemunerationId)?.person_name ?? '—'
                        : 'Auto-filled from person'}
                    </div>
                  ) : (
                    <Input
                      className="h-9 text-xs"
                      placeholder="e.g. Location fee, Meals"
                      value={row.accountHead}
                      onChange={e => updateRow(row.id, 'accountHead', e.target.value)}
                    />
                  )}

                  {/* Amount */}
                  <Input
                    className="h-9 text-xs"
                    type="number"
                    placeholder="0"
                    value={row.amount || ''}
                    onChange={e => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                  />

                  {/* Nos */}
                  <Input
                    className="h-9 text-xs"
                    type="number"
                    placeholder="1"
                    value={remRow ? 1 : row.nos || ''}
                    disabled={remRow}
                    onChange={e => updateRow(row.id, 'nos', parseInt(e.target.value) || 1)}
                  />

                  {/* Total */}
                  <div className="h-9 flex items-center px-1">
                    <span className="text-xs font-medium text-gray-900">
                      {formatCurrency(remRow ? row.amount : rowTotal)}
                    </span>
                  </div>

                  {/* Remove */}
                  <div className="w-8 flex items-center justify-center">
                    {rows.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRow(row.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mobile card */}
                <Card className="lg:hidden p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Row {idx + 1}</span>
                    {rows.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow(row.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Category</Label>
                      <Select value={row.categoryId} onValueChange={v => updateRow(row.id, 'categoryId', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {withSubs.map(cat => (
                            <SelectItem key={cat.id} value={cat.id} className="text-xs">{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{remRow ? 'Person' : 'Subcategory'}</Label>
                      {remRow ? (
                        <Select value={row.linkedRemunerationId} onValueChange={v => updateRow(row.id, 'linkedRemunerationId', v)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Person" />
                          </SelectTrigger>
                          <SelectContent>
                            {remunerationEntries.map(e => (
                              <SelectItem key={e.id} value={e.id} className="text-xs">{e.person_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select
                          value={row.subcategoryId}
                          onValueChange={v => updateRow(row.id, 'subcategoryId', v)}
                          disabled={!row.categoryId || availableSubs.length === 0}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder={!row.categoryId ? '—' : 'Subcategory'} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSubs.map(sub => (
                              <SelectItem key={sub.id} value={sub.id} className="text-xs">{sub.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  {!remRow && (
                    <div className="space-y-1">
                      <Label className="text-xs">Item / Service</Label>
                      <Input className="text-xs" placeholder="e.g. Location fee" value={row.accountHead}
                        onChange={e => updateRow(row.id, 'accountHead', e.target.value)} />
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Amount (₹)</Label>
                      <Input className="text-xs" type="number" placeholder="0" value={row.amount || ''}
                        onChange={e => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nos</Label>
                      <Input className="text-xs" type="number" placeholder="1" disabled={remRow} value={remRow ? 1 : row.nos || ''}
                        onChange={e => updateRow(row.id, 'nos', parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Total</Label>
                      <div className="h-9 flex items-center text-xs font-medium text-gray-900">
                        {formatCurrency(remRow ? row.amount : rowTotal)}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Daily Total */}
        <div className="flex justify-end pt-4 border-t mt-4">
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-0.5">Daily Total</p>
            <p className="text-xl md:text-2xl text-[#1E3A8A] font-semibold">{formatCurrency(calculateTotal())}</p>
          </div>
        </div>

        {/* Date · Pay Method · Reference No · Paid By */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-sm">
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
        <div className="space-y-2 pt-2">
          <Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Textarea
            placeholder="Notes, transaction context, or any relevant details..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="resize-none"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleCancel}>Cancel</Button>
          <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 w-full sm:w-auto" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Day Summary'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
