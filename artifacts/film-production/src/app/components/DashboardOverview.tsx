import React from 'react';
import { Card } from './ui/card';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '../hooks/useDashboard';

interface Props {
  projectId: string | null;
}

export function DashboardOverview({ projectId }: Props) {
  const { data, loading } = useDashboard(projectId);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  if (!projectId) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No project selected.</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
      </div>
    );
  }

  const percentPaid = data.totalBudget > 0 ? (data.totalPaid / data.totalBudget) * 100 : 0;
  const percentBalance = 100 - percentPaid;
  const onTrack = percentPaid <= 75;

  const summaryCards = [
    { title: 'Total Budget', value: formatCurrency(data.totalBudget), icon: DollarSign, color: 'bg-blue-500', progress: 100, progressColor: 'bg-blue-500' },
    { title: 'Total Paid', value: formatCurrency(data.totalPaid), icon: CreditCard, color: 'bg-red-500', progress: percentPaid, progressColor: 'bg-red-500', trend: { value: `${percentPaid.toFixed(1)}%`, direction: 'up' as const } },
    { title: 'Balance', value: formatCurrency(data.balance), icon: Wallet, color: 'bg-green-500', progress: percentBalance, progressColor: 'bg-green-500' },
    { title: 'Budget Status', value: onTrack ? 'On Track' : 'Over Budget', subValue: `${percentBalance.toFixed(1)}% remaining`, icon: AlertCircle, color: 'bg-[#FACC15]', progress: percentPaid, progressColor: onTrack ? 'bg-green-500' : 'bg-red-500' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl text-gray-900">{card.value}</p>
                  {card.subValue && <p className="text-sm text-gray-500 mt-1">{card.subValue}</p>}
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              {card.trend && (
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">{card.trend.value}</span>
                </div>
              )}
              <div className="mt-4">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${card.progressColor} transition-all`} style={{ width: `${Math.min(card.progress, 100)}%` }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg mb-4">Budget vs Actual by Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.budgetVsActual}>
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

        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg mb-4">Daily Spending Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#1E3A8A" strokeWidth={3} name="Daily Spend" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4 md:p-6">
        <h3 className="text-base md:text-lg mb-4">Recent Activity</h3>
        {data.recentActivity.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No expenses recorded yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Department</th>
                  <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Expense Head</th>
                  <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActivity.map((activity, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-xs md:text-sm whitespace-nowrap">{activity.date}</td>
                    <td className="py-3 px-4 text-xs md:text-sm">{activity.department}</td>
                    <td className="py-3 px-4 text-xs md:text-sm">{activity.head}</td>
                    <td className="py-3 px-4 text-xs md:text-sm text-right whitespace-nowrap">{formatCurrency(activity.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
