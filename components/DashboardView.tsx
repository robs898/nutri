import React, { useMemo, useState } from 'react';
import { Meal, TimeRange, MacroProfile } from '../types';
import { startOfDay, startOfWeek, startOfMonth, isAfter, format, getDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { NutritionCard } from './NutritionCard';

interface DashboardViewProps {
  meals: Meal[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ meals }) => {
  const [range, setRange] = useState<TimeRange>(TimeRange.DAY);

  const filteredMeals = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case TimeRange.DAY:
        startDate = startOfDay(now);
        break;
      case TimeRange.WEEK:
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
        break;
      case TimeRange.MONTH:
        startDate = startOfMonth(now);
        break;
    }

    return meals.filter(meal => isAfter(new Date(meal.timestamp), startDate));
  }, [meals, range]);

  const totals: MacroProfile = useMemo(() => {
    return filteredMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.analysis.calories,
      protein: acc.protein + meal.analysis.protein,
      carbs: acc.carbs + meal.analysis.carbs,
      fat: acc.fat + meal.analysis.fat,
      fiber: acc.fiber + (meal.analysis.fiber || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }, [filteredMeals]);

  const chartData = useMemo(() => {
    if (range === TimeRange.DAY) {
      // Group by meal for daily view
      return filteredMeals.map(m => ({
        name: format(new Date(m.timestamp), 'HH:mm'),
        cal: m.analysis.calories
      })).reverse(); // Oldest first for chart left-to-right
    } else {
      // Group by day for week/month view
      const dailyMap = new Map<string, number>();
      
      // Initialize days if Week view to show empty days
      if (range === TimeRange.WEEK) {
         const start = startOfWeek(new Date(), { weekStartsOn: 1 });
         for(let i=0; i<7; i++) {
             const d = new Date(start);
             d.setDate(d.getDate() + i);
             dailyMap.set(format(d, 'EEE'), 0);
         }
      }

      filteredMeals.forEach(meal => {
        const key = range === TimeRange.WEEK 
          ? format(new Date(meal.timestamp), 'EEE')
          : format(new Date(meal.timestamp), 'd');
        
        const current = dailyMap.get(key) || 0;
        dailyMap.set(key, current + meal.analysis.calories);
      });

      // Convert map to array
      if (range === TimeRange.WEEK) {
        return Array.from(dailyMap).map(([name, cal]) => ({ name, cal }));
      } else {
         return Array.from(dailyMap).map(([name, cal]) => ({ name, cal })).reverse();
      }
    }
  }, [filteredMeals, range]);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="bg-white rounded-lg p-1 flex shadow-sm border border-gray-100">
          {(Object.keys(TimeRange) as Array<keyof typeof TimeRange>).map((key) => (
            <button
              key={key}
              onClick={() => setRange(TimeRange[key])}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                range === TimeRange[key]
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <NutritionCard data={totals} title={`${range.toLowerCase()} Total`} />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-64">
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Calories Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis 
              dataKey="name" 
              tick={{fontSize: 10}} 
              tickLine={false} 
              axisLine={false}
              interval={0}
            />
            <Tooltip 
              cursor={{fill: '#f3f4f6'}}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar dataKey="cal" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#3b82f6" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};