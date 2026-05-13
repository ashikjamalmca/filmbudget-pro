import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Download, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

export function DailyExpenseComparison() {
  const [date, setDate] = useState<Date>(new Date());
  const [department, setDepartment] = useState('all');

  const comparisonData = [
    {
      category: 'Batta (Daily Allowance)',
      items: [
        { name: 'Cast Members', budget: 50000, today: 48000, difference: 2000, status: 'under' },
        { name: 'Crew Members', budget: 35000, today: 35000, difference: 0, status: 'exact' }
      ]
    },
    {
      category: 'Lodging',
      items: [
        { name: 'Hotel Accommodation', budget: 80000, today: 85000, difference: -5000, status: 'over' },
        { name: 'Guest House', budget: 25000, today: 22000, difference: 3000, status: 'under' }
      ]
    },
    {
      category: 'Mess (Meals)',
      items: [
        { name: 'Breakfast', budget: 8000, today: 7500, difference: 500, status: 'under' },
        { name: 'Lunch', budget: 12000, today: 13500, difference: -1500, status: 'over' },
        { name: 'Dinner', budget: 10000, today: 9800, difference: 200, status: 'under' }
      ]
    },
    {
      category: 'Equipment',
      items: [
        { name: 'Camera Rental', budget: 45000, today: 45000, difference: 0, status: 'exact' },
        { name: 'Lighting Equipment', budget: 30000, today: 28000, difference: 2000, status: 'under' },
        { name: 'Sound Equipment', budget: 20000, today: 20000, difference: 0, status: 'exact' }
      ]
    },
    {
      category: 'Vehicles',
      items: [
        { name: 'Production Van', budget: 8000, today: 8000, difference: 0, status: 'exact' },
        { name: 'Artist Vehicles', budget: 15000, today: 16500, difference: -1500, status: 'over' }
      ]
    },
    {
      category: 'Location',
      items: [
        { name: 'Location Fee', budget: 50000, today: 50000, difference: 0, status: 'exact' },
        { name: 'Security', budget: 10000, today: 9500, difference: 500, status: 'under' }
      ]
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getTotals = () => {
    let totalBudget = 0;
    let totalToday = 0;

    comparisonData.forEach(category => {
      category.items.forEach(item => {
        totalBudget += item.budget;
        totalToday += item.today;
      });
    });

    return {
      budget: totalBudget,
      today: totalToday,
      difference: totalBudget - totalToday
    };
  };

  const totals = getTotals();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {/* Filters */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-end">
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm text-gray-600">Select Date</label>
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

          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm text-gray-600">Department</label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="batta">Batta</SelectItem>
                <SelectItem value="lodging">Lodging</SelectItem>
                <SelectItem value="mess">Mess</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="vehicles">Vehicles</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Total Budget (Today)</p>
          <p className="text-2xl md:text-3xl text-gray-900">{formatCurrency(totals.budget)}</p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Total Spent (Today)</p>
          <p className="text-2xl md:text-3xl text-gray-900">{formatCurrency(totals.today)}</p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Difference</p>
          <p className={`text-2xl md:text-3xl ${totals.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totals.difference >= 0 ? '+' : ''}{formatCurrency(totals.difference)}
          </p>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl mb-4 md:mb-6">Budget vs Actual Comparison</h2>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 text-xs md:text-sm text-gray-600">Account Head</th>
                <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Budget</th>
                <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Today</th>
                <th className="text-right py-3 px-4 text-xs md:text-sm text-gray-600">Difference</th>
                <th className="text-center py-3 px-4 text-xs md:text-sm text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((category, categoryIndex) => (
                <React.Fragment key={categoryIndex}>
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="py-3 px-4 text-gray-900">
                      {category.category}
                    </td>
                  </tr>
                  {category.items.map((item, itemIndex) => {
                    const isOver = item.difference < 0;
                    const isUnder = item.difference > 0;
                    
                    return (
                      <tr key={itemIndex} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm pl-8">{item.name}</td>
                        <td className="py-3 px-4 text-sm text-right">{formatCurrency(item.budget)}</td>
                        <td className="py-3 px-4 text-sm text-right">{formatCurrency(item.today)}</td>
                        <td className={`py-3 px-4 text-sm text-right ${
                          isOver ? 'text-red-600' : isUnder ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {item.difference > 0 ? '+' : ''}{formatCurrency(item.difference)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                            isOver 
                              ? 'bg-red-100 text-red-700' 
                              : isUnder 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isOver ? 'Over Budget' : isUnder ? 'Under Budget' : 'On Track'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              <tr className="bg-gray-100">
                <td className="py-4 px-4">Total</td>
                <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(totals.budget)}</td>
                <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(totals.today)}</td>
                <td className={`py-4 px-4 text-right ${totals.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.difference > 0 ? '+' : ''}{formatCurrency(totals.difference)}
                </td>
                <td className="py-4 px-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
