import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Trash2, Receipt } from 'lucide-react';
import { useDailyExpenses } from '../hooks/useDailyExpenses';
import { useExpenseCategories } from '../hooks/useExpenseCategories';

interface Props {
  projectId: string | null;
}

export function ExpenseHistory({ projectId }: Props) {
  const { expenses, loading, deleteExpense } = useDailyExpenses(projectId);
  const { withSubs } = useExpenseCategories();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  const getCategoryLabel = (exp: typeof expenses[0]) => {
    const cat = withSubs.find(c => c.id === exp.category_id);
    const sub = cat?.subcategories.find(s => s.id === exp.subcategory_id);
    if (cat && sub) return `${cat.name} › ${sub.name}`;
    if (cat) return cat.name;
    return exp.department || '—';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Expense History</h2>
          {!loading && expenses.length > 0 && (
            <span className="text-sm text-gray-400">{expenses.length} records</span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="font-medium">No expenses recorded yet</p>
            <p className="text-sm mt-1">Add expenses from the Daily Expense Entry screen.</p>
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
                    Grand Total:
                  </td>
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
    </div>
  );
}
