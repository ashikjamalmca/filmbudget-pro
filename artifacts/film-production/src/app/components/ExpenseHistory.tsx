import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Trash2, Receipt, Search, X, SlidersHorizontal } from 'lucide-react';
import { useDailyExpenses } from '../hooks/useDailyExpenses';
import { useExpenseCategories } from '../hooks/useExpenseCategories';

interface Props {
  projectId: string | null;
}

const PAY_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card', 'Petty Cash'];

export function ExpenseHistory({ projectId }: Props) {
  const { expenses, loading, deleteExpense } = useDailyExpenses(projectId);
  const { withSubs } = useExpenseCategories();

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [payMethodFilter, setPayMethodFilter] = useState('');
  const [paidByFilter, setPaidByFilter] = useState('');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  const getCategoryLabel = (exp: typeof expenses[0]) => {
    const cat = withSubs.find(c => c.id === exp.category_id);
    const sub = cat?.subcategories.find(s => s.id === exp.subcategory_id);
    if (cat && sub) return `${cat.name} › ${sub.name}`;
    if (cat) return cat.name;
    return exp.department || '—';
  };

  const uniquePaidBy = useMemo(() =>
    [...new Set(expenses.map(e => e.paid_by).filter(Boolean))] as string[],
    [expenses]
  );

  const uniqueCategories = useMemo(() =>
    [...new Set(expenses.map(e => e.category_id).filter(Boolean))] as string[],
    [expenses]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return expenses.filter(e => {
      if (fromDate && e.expense_date < fromDate) return false;
      if (toDate && e.expense_date > toDate) return false;
      if (categoryFilter && e.category_id !== categoryFilter) return false;
      if (payMethodFilter && (e as any).pay_method !== payMethodFilter) return false;
      if (paidByFilter && e.paid_by !== paidByFilter) return false;
      if (q) {
        const haystack = [
          e.account_head, e.description, (e as any).reference_no, e.paid_by, e.department,
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, search, fromDate, toDate, categoryFilter, payMethodFilter, paidByFilter]);

  const hasFilters = search || fromDate || toDate || categoryFilter || payMethodFilter || paidByFilter;

  const clearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setCategoryFilter('');
    setPayMethodFilter('');
    setPaidByFilter('');
  };

  const grandTotal = filtered.reduce((s, e) => s + e.total, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">

      {/* Filter Card */}
      <Card className="p-4 md:p-5">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-[#1E3A8A]" />
          <span className="font-medium text-sm text-gray-700">Filters</span>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs text-gray-500" onClick={clearFilters}>
              <X className="w-3 h-3 mr-1" /> Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Search */}
          <div className="xl:col-span-2 space-y-1">
            <Label className="text-xs text-gray-500">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                className="pl-8 h-9 text-xs"
                placeholder="Item, description, reference…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearch('')}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* From Date */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">From Date</Label>
            <Input
              type="date"
              className="h-9 text-xs"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>

          {/* To Date */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">To Date</Label>
            <Input
              type="date"
              className="h-9 text-xs"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                {uniqueCategories.map(cid => {
                  const cat = withSubs.find(c => c.id === cid);
                  return cat ? (
                    <SelectItem key={cid} value={cid} className="text-xs">{cat.name}</SelectItem>
                  ) : null;
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Pay Method */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Pay Method</Label>
            <Select value={payMethodFilter} onValueChange={setPayMethodFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                {PAY_METHODS.map(m => (
                  <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paid By */}
          {uniquePaidBy.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Paid By</Label>
              <Select value={paidByFilter} onValueChange={setPaidByFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  {uniquePaidBy.map(u => (
                    <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Active filter badges */}
        {hasFilters && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
            {search && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                Search: {search}
                <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {fromDate && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                From: {fromDate}
                <button onClick={() => setFromDate('')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {toDate && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                To: {toDate}
                <button onClick={() => setToDate('')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {categoryFilter && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                {withSubs.find(c => c.id === categoryFilter)?.name ?? categoryFilter}
                <button onClick={() => setCategoryFilter('')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {payMethodFilter && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                {payMethodFilter}
                <button onClick={() => setPayMethodFilter('')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {paidByFilter && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                {paidByFilter}
                <button onClick={() => setPaidByFilter('')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
          </div>
        )}
      </Card>

      {/* Results Card */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Expense History</h2>
          {!loading && (
            <span className="text-sm text-gray-400">
              {filtered.length}{hasFilters && expenses.length !== filtered.length ? ` of ${expenses.length}` : ''} record{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-25" />
            {expenses.length === 0 ? (
              <>
                <p className="font-medium">No expenses recorded yet</p>
                <p className="text-sm mt-1">Add expenses from the Daily Expense Entry screen.</p>
              </>
            ) : (
              <>
                <p className="font-medium">No results match your filters</p>
                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={clearFilters}>Clear filters</Button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Category</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Item / Service</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Paid By</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Pay Method</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Reference</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Nos</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Total</th>
                  <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-xs whitespace-nowrap text-gray-700">{item.expense_date}</td>
                    <td className="py-3 px-4 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-gray-800">{getCategoryLabel(item)}</span>
                        {item.description && (
                          <p className="text-gray-400 text-xs truncate max-w-[160px]" title={item.description}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700">{item.account_head}</td>
                    <td className="py-3 px-4 text-xs">
                      {item.paid_by
                        ? <Badge variant="outline" className="text-xs font-normal">{item.paid_by}</Badge>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {(item as any).pay_method
                        ? <Badge variant="secondary" className="text-xs font-normal">{(item as any).pay_method}</Badge>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 max-w-[110px] truncate" title={(item as any).reference_no ?? ''}>
                      {(item as any).reference_no || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-xs text-right text-gray-700">{formatCurrency(item.amount)}</td>
                    <td className="py-3 px-4 text-xs text-right text-gray-700">{item.nos}</td>
                    <td className="py-3 px-4 text-xs text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(item.total)}
                    </td>
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
                  <td colSpan={8} className="py-3 px-4 text-right text-sm text-gray-600 font-medium">
                    {hasFilters ? 'Filtered Total:' : 'Grand Total:'}
                  </td>
                  <td className="py-3 px-4 text-right text-[#1E3A8A] font-semibold whitespace-nowrap">
                    {formatCurrency(grandTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
