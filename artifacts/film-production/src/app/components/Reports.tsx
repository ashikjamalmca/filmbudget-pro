import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Reports() {
  const [dateFrom, setDateFrom] = useState<Date>(new Date(2025, 0, 1));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [department, setDepartment] = useState('all');

  const budgetAllocation = [
    { name: 'Daily Expenses', value: 800000, color: '#1E3A8A' },
    { name: 'Artists', value: 1500000, color: '#3B82F6' },
    { name: 'Technicians', value: 1200000, color: '#60A5FA' },
    { name: 'Equipment', value: 600000, color: '#FACC15' },
    { name: 'Post Production', value: 500000, color: '#FCD34D' },
    { name: 'Music', value: 400000, color: '#FDE68A' }
  ];

  const dailySpendTrend = [
    { date: 'Week 1', amount: 245000 },
    { date: 'Week 2', amount: 312000 },
    { date: 'Week 3', amount: 198000 },
    { date: 'Week 4', amount: 378000 },
    { date: 'Week 5', amount: 285000 },
    { date: 'Week 6', amount: 356000 },
    { date: 'Week 7', amount: 289000 }
  ];

  const budgetVsActual = [
    { category: 'Daily Exp', budget: 800000, actual: 620000 },
    { category: 'Artists', budget: 1500000, actual: 950000 },
    { category: 'Technicians', budget: 1200000, actual: 780000 },
    { category: 'Equipment', budget: 600000, actual: 520000 },
    { category: 'Post Prod', budget: 500000, actual: 280000 },
    { category: 'Music', budget: 400000, actual: 190000 }
  ];

  const departmentExpenses = [
    { department: 'Daily Expenses', budget: 800000, spent: 620000, variance: 180000, percentage: 77.5 },
    { department: 'Artists', budget: 1500000, spent: 950000, variance: 550000, percentage: 63.3 },
    { department: 'Technicians', budget: 1200000, spent: 780000, variance: 420000, percentage: 65.0 },
    { department: 'Equipment', budget: 600000, spent: 520000, variance: 80000, percentage: 86.7 },
    { department: 'Post Production', budget: 500000, spent: 280000, variance: 220000, percentage: 56.0 },
    { department: 'Music & Sound', budget: 400000, spent: 190000, variance: 210000, percentage: 47.5 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2">Reports & Analytics</h1>
          <p className="text-sm md:text-base text-gray-600">Comprehensive financial reports and insights</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-end">
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm text-gray-600">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(newDate) => newDate && setDateFrom(newDate)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm text-gray-600">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(newDate) => newDate && setDateTo(newDate)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm text-gray-600">Department</label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="daily">Daily Expenses</SelectItem>
                <SelectItem value="artists">Artists</SelectItem>
                <SelectItem value="technicians">Technicians</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="post">Post Production</SelectItem>
                <SelectItem value="music">Music</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Budget Allocation Pie Chart */}
        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg mb-4">Budget Allocation by Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={budgetAllocation}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {budgetAllocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {budgetAllocation.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Weekly Spend Trend */}
        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg mb-4">Weekly Spending Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailySpendTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#1E3A8A" 
                strokeWidth={3}
                name="Weekly Spend"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Budget vs Actual */}
        <Card className="p-4 md:p-6 lg:col-span-2">
          <h3 className="text-base md:text-lg mb-4">Budget vs Actual by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={budgetVsActual}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="budget" fill="#1E3A8A" name="Budget" />
              <Bar dataKey="actual" fill="#FACC15" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Department Summary Table */}
      <Card className="p-4 md:p-6">
        <h3 className="text-base md:text-lg mb-4 md:mb-6">Department-wise Summary</h3>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Department</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Budget</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Spent</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Variance</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">% Used</th>
                <th className="text-center py-3 px-4 text-sm text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {departmentExpenses.map((dept, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{dept.department}</td>
                  <td className="py-3 px-4 text-sm text-right">{formatCurrency(dept.budget)}</td>
                  <td className="py-3 px-4 text-sm text-right">{formatCurrency(dept.spent)}</td>
                  <td className={`py-3 px-4 text-sm text-right ${dept.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dept.variance)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">{dept.percentage}%</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex-1 max-w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            dept.percentage > 90 ? 'bg-red-500' : dept.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(dept.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td className="py-4 px-4">Total</td>
                <td className="py-4 px-4 text-right text-[#1E3A8A]">
                  {formatCurrency(departmentExpenses.reduce((sum, d) => sum + d.budget, 0))}
                </td>
                <td className="py-4 px-4 text-right text-[#1E3A8A]">
                  {formatCurrency(departmentExpenses.reduce((sum, d) => sum + d.spent, 0))}
                </td>
                <td className="py-4 px-4 text-right text-green-600">
                  {formatCurrency(departmentExpenses.reduce((sum, d) => sum + d.variance, 0))}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
