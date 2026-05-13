import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CalendarIcon, Upload, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ExpenseRow {
  id: string;
  accountHead: string;
  amount: number;
  nos: number;
  bill: string | null;
}

export function DailyExpenseEntry() {
  const [date, setDate] = useState<Date>(new Date());
  const [department, setDepartment] = useState('');
  const [expenses, setExpenses] = useState<ExpenseRow[]>([
    { id: '1', accountHead: '', amount: 0, nos: 1, bill: null }
  ]);

  const departments = [
    'Batta (Daily Allowance)',
    'Lodging',
    'Mess (Meals)',
    'Equipment Rental',
    'Vehicles',
    'Location Fee',
    'Others'
  ];

  const addNewRow = () => {
    setExpenses([...expenses, {
      id: Date.now().toString(),
      accountHead: '',
      amount: 0,
      nos: 1,
      bill: null
    }]);
  };

  const removeRow = (id: string) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const updateExpense = (id: string, field: keyof ExpenseRow, value: any) => {
    setExpenses(expenses.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const calculateTotal = () => {
    return expenses.reduce((sum, exp) => sum + (exp.amount * exp.nos), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const mockExpenseHistory = [
    { date: '2025-11-02', head: 'Location Fee', amount: 15000, nos: 1, total: 15000, addedBy: 'Nivin Pauly', bill: 'invoice_001.pdf' },
    { date: '2025-11-02', head: 'Crew Meals', amount: 250, nos: 35, total: 8750, addedBy: 'Nivin Pauly', bill: 'receipt_002.pdf' },
    { date: '2025-11-01', head: 'Vehicle Rental', amount: 5000, nos: 3, total: 15000, addedBy: 'Manju Warrier', bill: null },
    { date: '2025-11-01', head: 'Equipment Rental', amount: 12000, nos: 1, total: 12000, addedBy: 'Manju Warrier', bill: 'invoice_003.pdf' }
  ];

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {/* Desktop Table Header - Hidden on mobile */}
              <div className="hidden md:grid grid-cols-12 gap-4 text-sm text-gray-600 px-2">
                <div className="col-span-4">Account Head</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Nos</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-2">Bill</div>
              </div>

              {expenses.map((expense) => (
                <div key={expense.id}>
                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <Input
                        placeholder="e.g., Location fee, Meals, etc."
                        value={expense.accountHead}
                        onChange={(e) => updateExpense(expense.id, 'accountHead', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={expense.amount || ''}
                        onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="1"
                        value={expense.nos || ''}
                        onChange={(e) => updateExpense(expense.id, 'nos', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-2 px-2">
                      <span className="text-gray-900">
                        {formatCurrency(expense.amount * expense.nos)}
                      </span>
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Upload className="w-4 h-4" />
                      </Button>
                      {expenses.length > 1 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeRow(expense.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <Card className="md:hidden p-4 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Account Head</Label>
                      <Input
                        placeholder="e.g., Location fee, Meals, etc."
                        value={expense.accountHead}
                        onChange={(e) => updateExpense(expense.id, 'accountHead', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Amount</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={expense.amount || ''}
                          onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Nos</Label>
                        <Input
                          type="number"
                          placeholder="1"
                          value={expense.nos || ''}
                          onChange={(e) => updateExpense(expense.id, 'nos', parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="text-base">{formatCurrency(expense.amount * expense.nos)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Bill
                      </Button>
                      {expenses.length > 1 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeRow(expense.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </Card>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                <Button variant="outline" onClick={addNewRow} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Row
                </Button>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-sm text-gray-600 mb-1">Daily Total</p>
                  <p className="text-xl md:text-2xl text-[#1E3A8A]">{formatCurrency(calculateTotal())}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 w-full sm:w-auto">
                  Save Day Summary
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl mb-4 md:mb-6">Expense History</h2>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Account Head</th>
                    <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Amount</th>
                    <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Nos</th>
                    <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Total</th>
                    <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Bill</th>
                    <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Added By</th>
                  </tr>
                </thead>
                <tbody>
                  {mockExpenseHistory.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-xs md:text-sm whitespace-nowrap">{item.date}</td>
                      <td className="py-3 px-4 text-xs md:text-sm">{item.head}</td>
                      <td className="py-3 px-4 text-xs md:text-sm text-right">{formatCurrency(item.amount)}</td>
                      <td className="py-3 px-4 text-xs md:text-sm text-right">{item.nos}</td>
                      <td className="py-3 px-4 text-xs md:text-sm text-right whitespace-nowrap">{formatCurrency(item.total)}</td>
                      <td className="py-3 px-4 text-xs md:text-sm">
                        {item.bill ? (
                          <span className="text-[#1E3A8A] hover:underline cursor-pointer truncate block max-w-[120px]">{item.bill}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs md:text-sm">{item.addedBy}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="py-3 px-4 text-right">Total:</td>
                    <td className="py-3 px-4 text-right text-[#1E3A8A]">
                      {formatCurrency(mockExpenseHistory.reduce((sum, item) => sum + item.total, 0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
