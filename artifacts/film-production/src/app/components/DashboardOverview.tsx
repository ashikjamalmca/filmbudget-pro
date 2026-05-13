import React from 'react';
import { Card } from './ui/card';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function DashboardOverview() {
  const summaryCards = [
    {
      title: 'Total Budget',
      value: '₹50,00,000',
      icon: DollarSign,
      color: 'bg-blue-500',
      progress: 100,
      progressColor: 'bg-blue-500'
    },
    {
      title: 'Total Paid',
      value: '₹23,40,000',
      icon: CreditCard,
      color: 'bg-red-500',
      progress: 46.8,
      progressColor: 'bg-red-500',
      trend: { value: '46.8%', direction: 'up' }
    },
    {
      title: 'Balance',
      value: '₹26,60,000',
      icon: Wallet,
      color: 'bg-green-500',
      progress: 53.2,
      progressColor: 'bg-green-500'
    },
    {
      title: 'Budget Status',
      value: 'On Track',
      subValue: '53.2% remaining',
      icon: AlertCircle,
      color: 'bg-[#FACC15]',
      progress: 46.8,
      progressColor: 'bg-green-500'
    }
  ];

  const budgetVsActual = [
    { department: 'Daily Exp', budget: 800000, actual: 620000 },
    { department: 'Artists', budget: 1500000, actual: 950000 },
    { department: 'Technicians', budget: 1200000, actual: 780000 },
    { department: 'Equipment', budget: 600000, actual: 520000 },
    { department: 'Post Prod', budget: 500000, actual: 280000 },
    { department: 'Music', budget: 400000, actual: 190000 }
  ];

  const dailySpendTrend = [
    { date: 'Oct 28', amount: 45000 },
    { date: 'Oct 29', amount: 52000 },
    { date: 'Oct 30', amount: 38000 },
    { date: 'Oct 31', amount: 61000 },
    { date: 'Nov 1', amount: 48000 },
    { date: 'Nov 2', amount: 55000 },
    { date: 'Nov 3', amount: 42000 }
  ];

  const recentActivity = [
    { date: '2025-11-03', department: 'Daily Expenses', head: 'Location Fee', amount: 15000, addedBy: 'Nivin Pauly' },
    { date: '2025-11-03', department: 'Artists', head: 'Lead Actor Payment', amount: 200000, addedBy: 'Antony Perumbavoor' },
    { date: '2025-11-02', department: 'Equipment', head: 'Camera Rental', amount: 45000, addedBy: 'Manju Warrier' },
    { date: '2025-11-02', department: 'Daily Expenses', head: 'Crew Meals', amount: 8500, addedBy: 'Nivin Pauly' },
    { date: '2025-11-01', department: 'Technicians', head: 'DOP Payment', amount: 150000, addedBy: 'Antony Perumbavoor' },
    { date: '2025-11-01', department: 'Post Production', head: 'Editing Suite', amount: 25000, addedBy: 'Manju Warrier' }
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl text-gray-900">{card.value}</p>
                  {card.subValue && (
                    <p className="text-sm text-gray-500 mt-1">{card.subValue}</p>
                  )}
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              {card.trend && (
                <div className="flex items-center gap-1 text-sm">
                  {card.trend.direction === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={card.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {card.trend.value}
                  </span>
                </div>
              )}

              <div className="mt-4">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${card.progressColor} transition-all`}
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Budget vs Actual */}
        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg mb-4">Budget vs Actual by Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={budgetVsActual}>
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

        {/* Daily Spend Trend */}
        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg mb-4">Daily Spending Trend</h3>
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
                name="Daily Spend"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-4 md:p-6">
        <h3 className="text-base md:text-lg mb-4">Recent Activity</h3>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Department</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Expense Head</th>
                <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Amount</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600 hidden sm:table-cell">Added By</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((activity, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-xs md:text-sm whitespace-nowrap">{activity.date}</td>
                  <td className="py-3 px-4 text-xs md:text-sm">{activity.department}</td>
                  <td className="py-3 px-4 text-xs md:text-sm">{activity.head}</td>
                  <td className="py-3 px-4 text-xs md:text-sm text-right whitespace-nowrap">{formatCurrency(activity.amount)}</td>
                  <td className="py-3 px-4 text-xs md:text-sm hidden sm:table-cell">{activity.addedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
