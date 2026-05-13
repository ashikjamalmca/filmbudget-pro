import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Loader2, Trash2, Receipt, Search, X, SlidersHorizontal, Paperclip,
  TrendingUp, CalendarDays, CreditCard, FileCheck, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, BarChart3, Wallet,
} from 'lucide-react';
import { usePaginatedExpenses, type ExpenseFilters } from '../hooks/usePaginatedExpenses';
import { useExpenseCategories } from '../hooks/useExpenseCategories';

interface Props {
  projectId: string | null;
}

const PAY_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card', 'Petty Cash'];
const PAGE_SIZES = [25, 50, 100];

const EMPTY_FILTERS: ExpenseFilters = {
  search: '',
  fromDate: '',
  toDate: '',
  categoryId: '',
  payMethod: '',
  paidBy: '',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

function StatCard({
  label, value, sub, icon, accent = false, loading = false,
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; accent?: boolean; loading?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide truncate">{label}</p>
          {loading
            ? <div className="h-6 w-24 bg-gray-100 rounded animate-pulse mt-1" />
            : <p className={`text-xl font-bold mt-0.5 truncate ${accent ? 'text-[#1E3A8A]' : 'text-gray-900'}`}>{value}</p>}
          {sub && !loading && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg shrink-0 ${accent ? 'bg-blue-50 text-[#1E3A8A]' : 'bg-gray-100 text-gray-500'}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function CategoryBar({ name, total, pct }: { name: string; total: number; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-gray-700 truncate">{name}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-gray-500">{pct.toFixed(1)}%</span>
          <span className="text-gray-900 font-medium">{formatCurrency(total)}</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1E3A8A] rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Pagination({
  page, totalPages, totalCount, pageSize, from, to,
  onPage, onPageSize,
}: {
  page: number; totalPages: number; totalCount: number; pageSize: number;
  from: number; to: number; onPage: (p: number) => void; onPageSize: (ps: number) => void;
}) {
  const pages = useMemo(() => {
    const arr: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) arr.push(i);
    } else {
      arr.push(1);
      if (page > 4) arr.push('...');
      for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) arr.push(i);
      if (page < totalPages - 3) arr.push('...');
      arr.push(totalPages);
    }
    return arr;
  }, [page, totalPages]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-500 order-2 sm:order-1">
        Showing <span className="font-medium text-gray-700">{Math.min(from + 1, totalCount)}–{Math.min(to + 1, totalCount)}</span> of <span className="font-medium text-gray-700">{totalCount}</span> records
      </p>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onPage(1)} disabled={page === 1}>
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onPage(page - 1)} disabled={page === 1}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        {pages.map((p, i) =>
          p === '...'
            ? <span key={`dot-${i}`} className="w-8 text-center text-xs text-gray-400">…</span>
            : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                className={`h-8 w-8 p-0 text-xs ${p === page ? 'bg-[#1E3A8A] hover:bg-[#1E3A8A]/90' : ''}`}
                onClick={() => onPage(p as number)}
              >
                {p}
              </Button>
            )
        )}

        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onPage(page + 1)} disabled={page === totalPages}>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onPage(totalPages)} disabled={page === totalPages}>
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-2 order-3">
        <span className="text-xs text-gray-500 whitespace-nowrap">Per page</span>
        <Select value={String(pageSize)} onValueChange={v => onPageSize(Number(v))}>
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map(s => (
              <SelectItem key={s} value={String(s)} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function ExpenseHistory({ projectId }: Props) {
  const { withSubs } = useExpenseCategories();

  const [filters, setFilters] = useState<ExpenseFilters>(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  const activeFilters: ExpenseFilters = { ...filters, search: debouncedSearch };

  useEffect(() => { setPage(1); }, [
    debouncedSearch, filters.fromDate, filters.toDate, filters.categoryId, filters.payMethod, filters.paidBy,
  ]);

  const { expenses, totalCount, totalPages, stats, loading, statsLoading, deleteExpense, getBillUrl } =
    usePaginatedExpenses(projectId, activeFilters, page, pageSize);

  const setFilter = (key: keyof ExpenseFilters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const clearFilters = () => { setFilters(EMPTY_FILTERS); setDebouncedSearch(''); };

  const hasFilters = Object.values(filters).some(Boolean);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const getCategoryLabel = (exp: typeof expenses[0]) => {
    const cat = withSubs.find(c => c.id === exp.category_id);
    const sub = cat?.subcategories.find(s => s.id === exp.subcategory_id);
    if (cat && sub) return `${cat.name} › ${sub.name}`;
    if (cat) return cat.name;
    return (exp as any).department || '—';
  };

  const uniquePaidBy = useMemo(() =>
    [...new Set(expenses.map(e => e.paid_by).filter(Boolean))] as string[],
    [expenses],
  );

  const uniqueCategories = useMemo(() =>
    [...new Set(expenses.map(e => e.category_id).filter(Boolean))] as string[],
    [expenses],
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">

      {/* ── Analytics Summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Spend"
          value={formatCurrency(stats?.totalSpend ?? 0)}
          sub={hasFilters ? 'filtered' : 'all time'}
          icon={<Wallet className="w-4 h-4" />}
          accent
          loading={statsLoading}
        />
        <StatCard
          label="Transactions"
          value={stats ? String(stats.totalCount) : '—'}
          sub={`${stats?.daysCount ?? 0} day${stats?.daysCount !== 1 ? 's' : ''} active`}
          icon={<Receipt className="w-4 h-4" />}
          loading={statsLoading}
        />
        <StatCard
          label="Daily Average"
          value={formatCurrency(stats?.dailyAvg ?? 0)}
          sub="per active day"
          icon={<CalendarDays className="w-4 h-4" />}
          loading={statsLoading}
        />
        <StatCard
          label="Avg per Entry"
          value={formatCurrency(stats?.avgPerEntry ?? 0)}
          sub="per transaction"
          icon={<TrendingUp className="w-4 h-4" />}
          loading={statsLoading}
        />
        <StatCard
          label="Top Pay Method"
          value={stats?.topPayMethod ?? '—'}
          sub="most used"
          icon={<CreditCard className="w-4 h-4" />}
          loading={statsLoading}
        />
        <StatCard
          label="With Receipts"
          value={stats ? `${stats.withAttachment}` : '—'}
          sub={stats ? `of ${stats.totalCount} entries` : undefined}
          icon={<FileCheck className="w-4 h-4" />}
          loading={statsLoading}
        />
      </div>

      {/* ── Category & Pay Method breakdown ── */}
      {(stats && stats.totalCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Category breakdown */}
          <Card className="p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-sm font-semibold text-gray-800">Spend by Department</span>
            </div>
            {statsLoading
              ? <div className="space-y-3">{[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-1.5 bg-gray-100 rounded-full animate-pulse" />
                </div>
              ))}</div>
              : <div className="space-y-3">
                {stats.categoryBreakdown.map(cat => (
                  <CategoryBar key={cat.name} name={cat.name} total={cat.total} pct={cat.pct} />
                ))}
              </div>
            }
          </Card>

          {/* Pay method breakdown */}
          <Card className="p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-sm font-semibold text-gray-800">Payment Methods</span>
            </div>
            {statsLoading
              ? <div className="space-y-2">{[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
              ))}</div>
              : <div className="space-y-2">
                {stats.payMethodBreakdown.map(pm => {
                  const pct = stats.totalSpend > 0 ? (pm.total / stats.totalSpend) * 100 : 0;
                  return (
                    <div key={pm.method} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700 truncate">{pm.method}</span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <Badge variant="secondary" className="text-xs h-5">{pm.count} tx</Badge>
                            <span className="text-xs font-medium text-gray-900">{formatCurrency(pm.total)}</span>
                          </div>
                        </div>
                        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1E3A8A] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </Card>
        </div>
      )}

      {/* ── Filter Panel ── */}
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="col-span-2 md:col-span-2 space-y-1">
            <Label className="text-xs text-gray-500">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                className="pl-8 h-9 text-xs"
                placeholder="Item, description, reference…"
                value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
              />
              {filters.search && (
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setFilter('search', '')}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-gray-500">From Date</Label>
            <Input type="date" className="h-9 text-xs" value={filters.fromDate}
              onChange={e => setFilter('fromDate', e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-gray-500">To Date</Label>
            <Input type="date" className="h-9 text-xs" value={filters.toDate}
              onChange={e => setFilter('toDate', e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Category</Label>
            <Select value={filters.categoryId} onValueChange={v => setFilter('categoryId', v)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All categories" /></SelectTrigger>
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

          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Pay Method</Label>
            <Select value={filters.payMethod} onValueChange={v => setFilter('payMethod', v)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All methods" /></SelectTrigger>
              <SelectContent>
                {PAY_METHODS.map(m => (
                  <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {uniquePaidBy.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Paid By</Label>
              <Select value={filters.paidBy} onValueChange={v => setFilter('paidBy', v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All users" /></SelectTrigger>
                <SelectContent>
                  {uniquePaidBy.map(u => (
                    <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {hasFilters && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
            {filters.search && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                Search: {filters.search}
                <button onClick={() => setFilter('search', '')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.fromDate && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                From: {filters.fromDate}
                <button onClick={() => setFilter('fromDate', '')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.toDate && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                To: {filters.toDate}
                <button onClick={() => setFilter('toDate', '')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.categoryId && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                {withSubs.find(c => c.id === filters.categoryId)?.name ?? filters.categoryId}
                <button onClick={() => setFilter('categoryId', '')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.payMethod && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                {filters.payMethod}
                <button onClick={() => setFilter('payMethod', '')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.paidBy && (
              <Badge variant="secondary" className="text-xs gap-1 pr-1">
                {filters.paidBy}
                <button onClick={() => setFilter('paidBy', '')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
          </div>
        )}
      </Card>

      {/* ── Results Table ── */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Expense History</h2>
          {!loading && totalCount > 0 && (
            <span className="text-sm text-gray-400">
              {totalCount} record{totalCount !== 1 ? 's' : ''}
              {hasFilters ? ' (filtered)' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-25" />
            {totalCount === 0 && !hasFilters ? (
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
                          <Button variant="outline" size="sm" onClick={() => deleteExpense(item.id)}>
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
                      {hasFilters ? 'Filtered Total (this page):' : 'Page Total:'}
                    </td>
                    <td className="py-3 px-4 text-right text-[#1E3A8A] font-semibold whitespace-nowrap">
                      {formatCurrency(expenses.reduce((s, e) => s + e.total, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                from={from}
                to={to}
                onPage={setPage}
                onPageSize={ps => { setPageSize(ps); setPage(1); }}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}
