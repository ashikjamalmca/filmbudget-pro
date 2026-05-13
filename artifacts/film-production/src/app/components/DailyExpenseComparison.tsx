import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Download, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { useDailyExpenses } from '../hooks/useDailyExpenses';

interface Props {
  projectId: string | null;
}

export function DailyExpenseComparison({ projectId }: Props) {
  const { expenses } = useDailyExpenses(projectId);
  const [date, setDate] = useState<Date>(new Date());
  const [department, setDepartment] = useState('all');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  const selectedDate = format(date, 'yyyy-MM-dd');

  const todayExpenses = expenses.filter(e =>
    e.expense_date === selectedDate &&
    (department === 'all' || e.department === department)
  );

  const grouped: Record<string, typeof todayExpenses> = {};
  for (const exp of todayExpenses) {
    if (!grouped[exp.department]) grouped[exp.department] = [];
    grouped[exp.department].push(exp);
  }

  const totalToday = todayExpenses.reduce((s, e) => s + e.total, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-end">
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm text-gray-600">Select Date</label>
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
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm text-gray-600">Department</label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Batta (Daily Allowance)">Batta</SelectItem>
                <SelectItem value="Lodging">Lodging</SelectItem>
                <SelectItem value="Mess (Meals)">Mess</SelectItem>
                <SelectItem value="Equipment Rental">Equipment</SelectItem>
                <SelectItem value="Vehicles">Vehicles</SelectItem>
                <SelectItem value="Location Fee">Location</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Total Spent ({format(date, 'MMM d, yyyy')})</p>
          <p className="text-2xl md:text-3xl text-gray-900">{formatCurrency(totalToday)}</p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Number of Entries</p>
          <p className="text-2xl md:text-3xl text-gray-900">{todayExpenses.length}</p>
        </Card>
      </div>

      <Card className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl mb-4 md:mb-6">Expenses for {format(date, 'MMM d, yyyy')}</h2>
        {todayExpenses.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No expenses recorded for this date.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Department</th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Account Head</th>
                  <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Amount</th>
                  <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Nos</th>
                  <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([dept, items]) => (
                  <React.Fragment key={dept}>
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="py-2 px-4 text-sm text-gray-700">{dept}</td>
                    </tr>
                    {items.map(item => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-400 pl-8">&mdash;</td>
                        <td className="py-3 px-4 text-sm">{item.account_head}</td>
                        <td className="py-3 px-4 text-sm text-right">{formatCurrency(item.amount)}</td>
                        <td className="py-3 px-4 text-sm text-right">{item.nos}</td>
                        <td className="py-3 px-4 text-sm text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                <tr className="bg-gray-100">
                  <td colSpan={4} className="py-4 px-4 text-sm">Total</td>
                  <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(totalToday)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
