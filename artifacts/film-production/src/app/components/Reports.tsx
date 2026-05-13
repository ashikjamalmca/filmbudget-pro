import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Download, FileSpreadsheet, Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import { useDailyExpenses } from '../hooks/useDailyExpenses';
import { useArtists } from '../hooks/useArtists';
import { useMusicExpenses } from '../hooks/useMusicExpenses';

interface Props {
  projectId: string | null;
}

const COLORS = ['#1E3A8A', '#3B82F6', '#60A5FA', '#FACC15', '#FCD34D', '#FDE68A'];

export function Reports({ projectId }: Props) {
  const { data: dashboard, loading } = useDashboard(projectId);
  const { expenses } = useDailyExpenses(projectId);
  const { people: artists } = useArtists(projectId, 'artist');
  const { people: technicians } = useArtists(projectId, 'technician');
  const { expenses: music } = useMusicExpenses(projectId);

  const [dateFrom, setDateFrom] = useState<Date>(new Date(new Date().getFullYear(), 0, 1));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [department, setDepartment] = useState('all');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  if (loading || !dashboard) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" /></div>;
  }

  const totalBudget = dashboard.totalBudget;

  const budgetAllocation = [
    { name: 'Daily Expenses', value: Math.round(totalBudget * 0.16), color: COLORS[0] },
    { name: 'Artists', value: Math.round(totalBudget * 0.30), color: COLORS[1] },
    { name: 'Technicians', value: Math.round(totalBudget * 0.24), color: COLORS[2] },
    { name: 'Equipment', value: Math.round(totalBudget * 0.12), color: COLORS[3] },
    { name: 'Post Production', value: Math.round(totalBudget * 0.10), color: COLORS[4] },
    { name: 'Music', value: Math.round(totalBudget * 0.08), color: COLORS[5] },
  ];

  const totalExpenses = expenses.reduce((s, e) => s + e.total, 0);
  const totalArtistsPaid = artists.reduce((s, a) => s + a.paid, 0);
  const totalTechniciansPaid = technicians.reduce((s, t) => s + t.paid, 0);
  const totalMusicPaid = music.reduce((s, m) => s + m.paid, 0);

  const departmentExpenses = [
    { department: 'Daily Expenses', budget: Math.round(totalBudget * 0.16), spent: totalExpenses },
    { department: 'Artists', budget: Math.round(totalBudget * 0.30), spent: totalArtistsPaid },
    { department: 'Technicians', budget: Math.round(totalBudget * 0.24), spent: totalTechniciansPaid },
    { department: 'Equipment', budget: Math.round(totalBudget * 0.12), spent: 0 },
    { department: 'Post Production', budget: Math.round(totalBudget * 0.10), spent: 0 },
    { department: 'Music & Sound', budget: Math.round(totalBudget * 0.08), spent: totalMusicPaid },
  ].map(d => ({ ...d, variance: d.budget - d.spent, percentage: d.budget > 0 ? Math.round((d.spent / d.budget) * 100) : 0 }));

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2">Reports & Analytics</h1>
          <p className="text-sm md:text-base text-gray-600">Comprehensive financial reports and insights</p>
        </div>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-end">
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm text-gray-600">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateFrom, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm text-gray-600">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateTo, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm text-gray-600">Department</label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />Print
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg mb-4">Budget Allocation by Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={budgetAllocation} cx="50%" cy="50%" labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={90} dataKey="value">
                {budgetAllocation.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {budgetAllocation.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg mb-4">Daily Spending Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dashboard.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#1E3A8A" strokeWidth={3} name="Daily Spend" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 md:p-6 lg:col-span-2">
          <h3 className="text-base md:text-lg mb-4">Budget vs Actual by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboard.budgetVsActual}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="budget" fill="#1E3A8A" name="Budget" />
              <Bar dataKey="actual" fill="#FACC15" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

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
              {departmentExpenses.map((dept, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{dept.department}</td>
                  <td className="py-3 px-4 text-sm text-right">{formatCurrency(dept.budget)}</td>
                  <td className="py-3 px-4 text-sm text-right">{formatCurrency(dept.spent)}</td>
                  <td className={`py-3 px-4 text-sm text-right ${dept.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dept.variance)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">{dept.percentage}%</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${dept.percentage > 90 ? 'bg-red-500' : dept.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
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
                <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(departmentExpenses.reduce((s, d) => s + d.budget, 0))}</td>
                <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(departmentExpenses.reduce((s, d) => s + d.spent, 0))}</td>
                <td className="py-4 px-4 text-right text-green-600">{formatCurrency(departmentExpenses.reduce((s, d) => s + d.variance, 0))}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
