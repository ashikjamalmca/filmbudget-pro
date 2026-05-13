import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Loader2, Trash2, Receipt, Search, X, SlidersHorizontal,
  Paperclip, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { useDailyExpenses } from '../hooks/useDailyExpenses';
import { useExpensesPage, type ExpenseFilters } from '../hooks/useExpensesPage';
import { useExpenseCategories } from '../hooks/useExpenseCategories';

interface Props {
  projectId: string | null;
}

const PAY_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card', 'Petty Cash'];
const PAGE_SIZES = [25, 50, 100];

export function ExpenseHistory({ projectId }: Props) {
  const { deleteExpense, getBillUrl } = useDailyExpenses(projectId);
  const { withSubs } = useExpenseCategories();

  // Filter state (immediate — drives UI)
  const [searchInput, setSearchInput] = useState('');
  const [fromDate, setFromDate]       = useState('');
  const [toDate, setToDate]           = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [payMethodFilter, setPayMethodFilter] = useState('');
  const [paidByInput, setPaidByInput] = useState('');

  // Debounced values sent to the API
  const [filters, setFilters] = useState<ExpenseFilters>({
    search: '', fromDate: '', toDate: '',
    categoryId: '', payMethod: '', paidBy: '',
  });

  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Debounce search + paidBy — 400 ms
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput, paidBy: paidByInput }));
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput, paidByInput]);

  // Immediate filter changes reset page to 1
  const applyFilter = useCallback((key: keyof ExpenseFilters, value: string) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  }, []);

  const { expenses, total, totalPages, totalAmount, loading, error, refetch } =
    useExpensesPage(projectId, page, pageSize, filters);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  const getCategoryLabel = (exp: typeof expenses[0]) => {
    const cat = withSubs.find(c => c.id === exp.category_id);
    const sub = cat?.subcategories.find(s => s.id === exp.subcategory_id);
    if (cat && sub) return `${cat.name} › ${sub.name}`;
    if (cat) return cat.name;
    return exp.department || '—';
  };

  const hasFilters = filters.search || filters.fromDate || filters.toDate ||
    filters.categoryId || filters.payMethod || filters.paidBy;

  const clearFilters = () => {
    setSearchInput('');
    setPaidByInput('');
    setFromDate('');
    setToDate('');
    setCategoryFilter('');
    setPayMethodFilter('');
    setFilters({ search: '', fromDate: '', toDate: '', categoryId: '', payMethod: '', paidBy: '' });
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    refetch();
  };

  const fromRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRecord   = Math.min(page * pageSize, total);

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

        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3">
          {/* Search */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                className="pl-8 h-9 text-xs"
                placeholder="Item, description, reference…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchInput('')}>
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
              onChange={e => { setFromDate(e.target.value); applyFilter('fromDate', e.target.value); }}
            />
          </div>

          {/* To Date */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">To Date</Label>
            <Input
              type="date"
              className="h-9 text-xs"
              value={toDate}
              onChange={e => { setToDate(e.target.value); applyFilter('toDate', e.target.value); }}
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Category</Label>
            <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); applyFilter('categoryId', v === '_all' ? '' : v); }}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all" className="text-xs">All categories</SelectItem>
                {withSubs.map(cat => (
                  <SelectItem key={cat.id} value={cat.id} className="text-xs">{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pay Method */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Pay Method</Label>
            <Select value={payMethodFilter} onValueChange={v => { setPayMethodFilter(v); applyFilter('payMethod', v === '_all' ? '' : v); }}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all" className="text-xs">All methods</SelectItem>
                {PAY_METHODS.map(m => (
                  <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paid By */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Paid By</Label>
            <Input
              className="h-9 text-xs"
              placeholder="Search name…"
              value={paidByInput}
              onChange={e => setPaidByInput(e.target.value)}
            />
          </div>
        </div>

        {/* Active filter badges */}
        {hasFilters && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
            {filters.search && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                Search: {filters.search}
                <button onClick={() => { setSearchInput(''); setFilters(f => ({ ...f, search: '' })); setPage(1); }}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.fromDate && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                From: {filters.fromDate}
                <button onClick={() => { setFromDate(''); applyFilter('fromDate', ''); }}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.toDate && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                To: {filters.toDate}
                <button onClick={() => { setToDate(''); applyFilter('toDate', ''); }}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.categoryId && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                {withSubs.find(c => c.id === filters.categoryId)?.name ?? filters.categoryId}
                <button onClick={() => { setCategoryFilter(''); applyFilter('categoryId', ''); }}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.payMethod && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                {filters.payMethod}
                <button onClick={() => { setPayMethodFilter(''); applyFilter('payMethod', ''); }}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.paidBy && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                Paid by: {filters.paidBy}
                <button onClick={() => { setPaidByInput(''); setFilters(f => ({ ...f, paidBy: '' })); setPage(1); }}>
                  <X className="w-3 h-3" />
                </button>
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
              {total > 0 ? `${fromRecord}–${toRecord} of ${total} record${total !== 1 ? 's' : ''}` : '0 records'}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-25" />
            {!hasFilters ? (
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
          <>
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
                    <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Actions</th>
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
                        <div className="flex items-center justify-center gap-1.5">
                          {(item as any).bill_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              title="Download attachment"
                              onClick={async () => {
                                const url = await getBillUrl((item as any).bill_url);
                                if (url) window.open(url, '_blank', 'noreferrer');
                              }}
                            >
                              <Paperclip className="w-3.5 h-3.5 text-[#1E3A8A]" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
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
                      {formatCurrency(totalAmount)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t gap-4 flex-wrap">
              {/* Page size */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Rows per page:</span>
                <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map(s => (
                      <SelectItem key={s} value={String(s)} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Page info + navigation */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  title="First page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  title="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>

                <span className="text-xs text-gray-600 px-2 whitespace-nowrap">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline" size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  title="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                  title="Last page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
