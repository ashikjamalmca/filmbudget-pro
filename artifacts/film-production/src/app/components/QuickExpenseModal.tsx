import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Plus, Trash2, Loader2, CheckCircle, User, Paperclip, X, ImageIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useDailyExpenses } from '../hooks/useDailyExpenses';
import { useExpenseCategories } from '../hooks/useExpenseCategories';
import { useProfiles } from '../hooks/useProfiles';
import { useAuth } from '../context/AuthContext';
import { useRemuneration } from '../hooks/useRemuneration';
import { compressImage, formatBytes } from '../../lib/imageUtils';

interface ExpenseRow {
  id: string;
  categoryId: string;
  subcategoryId: string;
  accountHead: string;
  amount: number;
  nos: number;
  linkedRemunerationId: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
}

const emptyRow = (): ExpenseRow => ({
  id: Date.now().toString() + Math.random(),
  categoryId: '',
  subcategoryId: '',
  accountHead: '',
  amount: 0,
  nos: 1,
  linkedRemunerationId: '',
});

export function QuickExpenseModal({ open, onClose, projectId }: Props) {
  const { addExpenses, uploadBillFile } = useDailyExpenses(projectId);
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

  // Attachment state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.full_name && !paidBy) setPaidBy(profile.full_name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.full_name]);

  const clearAttachment = () => {
    setAttachmentFile(null);
    setCompressedSize(null);
    if (attachmentPreview) { URL.revokeObjectURL(attachmentPreview); setAttachmentPreview(null); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reset = () => {
    setRows([emptyRow()]);
    setPaidBy(profile?.full_name ?? '');
    setDescription('');
    setPayMethod('');
    setReferenceNo('');
    setError(null);
    setSaved(false);
    clearAttachment();
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFileSelect = async (file: File) => {
    setAttachmentFile(file);
    setCompressedSize(null);
    if (file.type.startsWith('image/')) {
      setAttachmentPreview(URL.createObjectURL(file));
      setCompressing(true);
      try {
        const compressed = await compressImage(file);
        setCompressedSize(compressed.size);
      } catch {
        // ignore preview errors
      } finally {
        setCompressing(false);
      }
    } else {
      setAttachmentPreview(null);
    }
  };

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

  const calculateTotal = () => rows.reduce((sum, r) => sum + r.amount * (isRemuneration(r) ? 1 : r.nos), 0);

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

    // Upload attachment first (compress if image → upload → get storage path)
    let billPath: string | null = null;
    if (attachmentFile) {
      const { path, error: uploadErr } = await uploadBillFile(attachmentFile);
      if (uploadErr) { setSaving(false); setError(`Attachment upload failed: ${uploadErr}`); return; }
      billPath = path;
    }

    const expensePayload = rows.map(r => {
      const cat = withSubs.find(c => c.id === r.categoryId);
      const remRow = isRemuneration(r);
      const personName = remRow
        ? (remunerationEntries.find(e => e.id === r.linkedRemunerationId)?.person_name ?? 'Remuneration Payment')
        : r.accountHead;
      return {
        expense_date: format(date, 'yyyy-MM-dd'),
        department: cat?.name ?? '',
        account_head: personName,
        amount: r.amount,
        nos: remRow ? 1 : r.nos,
        bill_url: billPath,
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
    setSaved(true);
    setTimeout(() => { setSaved(false); handleClose(); }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-lg text-[#1E3A8A]">Add Daily Expense</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded">
              <CheckCircle className="w-4 h-4" /> Expenses saved successfully!
            </div>
          )}

          {/* Expense rows */}
          <div className="space-y-3">
            {rows.map((row, idx) => {
              const availableSubs = row.categoryId ? subsFor(row.categoryId) : [];
              const remRow = isRemuneration(row);
              const rowTotal = remRow ? row.amount : row.amount * row.nos;

              return (
                <div key={row.id} className="border rounded-lg p-3 space-y-3 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Row {idx + 1}</span>
                    {rows.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(row.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Category */}
                    <div className="space-y-1">
                      <Label className="text-xs">Category</Label>
                      <Select value={row.categoryId} onValueChange={v => updateRow(row.id, 'categoryId', v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={catLoading ? 'Loading…' : 'Category'} />
                        </SelectTrigger>
                        <SelectContent>
                          {withSubs.map(cat => (
                            <SelectItem key={cat.id} value={cat.id} className="text-xs">{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subcategory / Person */}
                    <div className="space-y-1">
                      <Label className="text-xs">{remRow ? 'Person' : 'Subcategory'}</Label>
                      {remRow ? (
                        <Select value={row.linkedRemunerationId} onValueChange={v => updateRow(row.id, 'linkedRemunerationId', v)}>
                          <SelectTrigger className="h-8 text-xs">
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
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder={!row.categoryId ? '—' : availableSubs.length === 0 ? 'None' : 'Subcategory'} />
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

                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 items-end">
                    {/* Item / Service */}
                    <div className="space-y-1">
                      <Label className="text-xs">Item / Service</Label>
                      {remRow ? (
                        <div className="h-8 flex items-center px-2 bg-white rounded border text-xs text-gray-400 italic">
                          {row.linkedRemunerationId
                            ? remunerationEntries.find(e => e.id === row.linkedRemunerationId)?.person_name ?? '—'
                            : 'Auto-filled'}
                        </div>
                      ) : (
                        <Input
                          className="h-8 text-xs"
                          placeholder="e.g. Location fee"
                          value={row.accountHead}
                          onChange={e => updateRow(row.id, 'accountHead', e.target.value)}
                        />
                      )}
                    </div>
                    {/* Amount */}
                    <div className="space-y-1">
                      <Label className="text-xs">Amount (₹)</Label>
                      <Input
                        className="h-8 text-xs"
                        type="number"
                        placeholder="0"
                        value={row.amount || ''}
                        onChange={e => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    {/* Nos */}
                    <div className="space-y-1">
                      <Label className="text-xs">Nos</Label>
                      <Input
                        className="h-8 text-xs"
                        type="number"
                        placeholder="1"
                        disabled={remRow}
                        value={remRow ? 1 : row.nos || ''}
                        onChange={e => updateRow(row.id, 'nos', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    {/* Total */}
                    <div className="space-y-1">
                      <Label className="text-xs">Total</Label>
                      <div className="h-8 flex items-center text-xs font-semibold text-[#1E3A8A]">
                        {formatCurrency(rowTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add row */}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed text-gray-500 hover:text-[#1E3A8A] hover:border-[#1E3A8A]"
            onClick={addRow}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Another Row
          </Button>

          {/* Grand total */}
          <div className="flex justify-end pt-1">
            <div className="text-right">
              <p className="text-xs text-gray-500">Daily Total</p>
              <p className="text-xl font-semibold text-[#1E3A8A]">{formatCurrency(calculateTotal())}</p>
            </div>
          </div>

          {/* Meta fields */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t">
            {/* Date */}
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start h-9 text-xs">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {format(date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Pay Method */}
            <div className="space-y-1">
              <Label className="text-xs">Pay Method <span className="text-gray-400">(optional)</span></Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card', 'Petty Cash'].map(m => (
                    <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference No */}
            <div className="space-y-1">
              <Label className="text-xs">Reference No <span className="text-gray-400">(optional)</span></Label>
              <Input
                className="h-9 text-xs"
                placeholder="UPI ref, cheque no…"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
              />
            </div>

            {/* Paid By */}
            <div className="space-y-1">
              <Label className="text-xs">Paid By</Label>
              {usersLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 h-9">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                </div>
              ) : (
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.full_name ?? p.id} className="text-xs">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          {p.full_name ?? p.id}
                          {p.id === profile?.id && <span className="text-indigo-500">(you)</span>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs">Description <span className="text-gray-400">(optional)</span></Label>
            <Textarea
              placeholder="Notes or transaction context…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="resize-none text-xs"
              rows={2}
            />
          </div>

          {/* ── Attachment Upload ── */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              Attachment <span className="text-gray-400 font-normal">(bill / invoice / receipt — optional)</span>
            </Label>

            {!attachmentFile ? (
              <label
                className="flex items-center gap-3 w-full px-3 py-2.5 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#1E3A8A]/40 hover:bg-[#1E3A8A]/5 transition-colors"
                htmlFor="attachment-input-modal"
              >
                <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600">Click to attach a bill, invoice, or receipt</p>
                  <p className="text-xs text-gray-400">Images are auto-compressed · PDF supported</p>
                </div>
                <input
                  id="attachment-input-modal"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 p-2.5 border rounded-lg bg-gray-50">
                {/* Thumbnail or icon */}
                {attachmentPreview ? (
                  <img src={attachmentPreview} alt="preview" className="w-10 h-10 object-cover rounded border flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center rounded border bg-white flex-shrink-0">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{attachmentFile.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {attachmentFile.type.startsWith('image/') ? (
                      <>
                        <ImageIcon className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{formatBytes(attachmentFile.size)}</span>
                        {compressing && (
                          <span className="text-xs text-blue-500 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> compressing…
                          </span>
                        )}
                        {!compressing && compressedSize !== null && compressedSize < attachmentFile.size && (
                          <span className="text-xs text-green-600">
                            → {formatBytes(compressedSize)} ({Math.round((1 - compressedSize / attachmentFile.size) * 100)}% smaller)
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <FileText className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{formatBytes(attachmentFile.size)} · PDF</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Remove */}
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={clearAttachment}>
                  <X className="w-3 h-3 text-gray-500" />
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
            <Button
              size="sm"
              className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white min-w-[120px]"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Saving…</>
                : 'Save Expenses'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
