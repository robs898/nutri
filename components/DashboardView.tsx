import React, { useMemo, useState } from 'react';
import { Meal, TimeRange, MacroProfile } from '../types';
import { startOfDay, startOfWeek, startOfMonth, isAfter, format } from 'date-fns';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { NutritionCard } from './NutritionCard';
import { UK_ADULT_MALE_TARGETS } from '../constants';

interface DashboardViewProps {
  meals: Meal[];
}

interface TrendChartProps {
  title: string;
  data: any[];
  dataKey: string;
  color: string;
  unit: string;
  target?: number;
}

const TrendChart: React.FC<TrendChartProps> = ({ title, data, dataKey, color, unit, target }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-64 flex flex-col">
    <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title} Trend</h3>
        {target && (
            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                Target: {target}{unit}
            </span>
        )}
    </div>
    <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="name" 
              tick={{fontSize: 10}} 
              tickLine={false} 
              axisLine={false}
              minTickGap={10}
              interval="preserveStartEnd"
            />
            <Tooltip 
              cursor={{fill: '#f3f4f6'}}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              formatter={(value: number) => [`${Math.round(value)}${unit}`, title]}
              labelStyle={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}
            />
            {target && (
                <ReferenceLine y={target} stroke={color} strokeDasharray="3 3" opacity={0.5} />
            )}
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
    </div>
  </div>
);

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
        calories: m.analysis.calories,
        protein: m.analysis.protein,
        carbs: m.analysis.carbs,
        fat: m.analysis.fat,
        fiber: m.analysis.fiber || 0
      })).reverse(); 
    } else {
      // Group by day for week/month view
      const dailyMap = new Map<string, { calories: number, protein: number, carbs: number, fat: number, fiber: number }>();
      const now = new Date();

      // Initialize days to ensure chronological order and fill gaps
      if (range === TimeRange.WEEK) {
         const start = startOfWeek(now, { weekStartsOn: 1 });
         for(let i=0; i<7; i++) {
             const d = new Date(start);
             d.setDate(d.getDate() + i);
             dailyMap.set(format(d, 'EEE'), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
         }
      } else if (range === TimeRange.MONTH) {
         // Show days from 1st up to today
         const currentDay = now.getDate();
         for(let i=1; i<=currentDay; i++) {
             dailyMap.set(i.toString(), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
         }
      }

      filteredMeals.forEach(meal => {
        const key = range === TimeRange.WEEK 
          ? format(new Date(meal.timestamp), 'EEE')
          : format(new Date(meal.timestamp), 'd');
        
        const current = dailyMap.get(key) || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
        
        dailyMap.set(key, {
            calories: current.calories + meal.analysis.calories,
            protein: current.protein + meal.analysis.protein,
            carbs: current.carbs + meal.analysis.carbs,
            fat: current.fat + meal.analysis.fat,
            fiber: current.fiber + (meal.analysis.fiber || 0),
        });
      });

      return Array.from(dailyMap).map(([name, data]) => ({ name, ...data }));
    }
  }, [filteredMeals, range]);

  const showCardTargets = range === TimeRange.DAY;
  const showChartTargets = range !== TimeRange.DAY;

  return (
    <div className="space-y-6 pb-24 md:pb-0">
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

      <NutritionCard 
        data={totals} 
        title={`${range.toLowerCase()} Total`} 
        targets={showCardTargets ? UK_ADULT_MALE_TARGETS : undefined} 
      />

      <div className="grid grid-cols-1 gap-4">
        <TrendChart 
            title="Calories" 
            data={chartData} 
            dataKey="calories" 
            color="#f97316" 
            unit="kcal" 
            target={showChartTargets ? UK_ADULT_MALE_TARGETS.calories : undefined}
        />
        <TrendChart 
            title="Protein" 
            data={chartData} 
            dataKey="protein" 
            color="#3b82f6" 
            unit="g"
            target={showChartTargets ? UK_ADULT_MALE_TARGETS.protein : undefined}
        />
        <TrendChart 
            title="Carbs" 
            data={chartData} 
            dataKey="carbs" 
            color="#22c55e" 
            unit="g"
            target={showChartTargets ? UK_ADULT_MALE_TARGETS.carbs : undefined}
        />
        <TrendChart 
            title="Fat" 
            data={chartData} 
            dataKey="fat" 
            color="#eab308" 
            unit="g"
            target={showChartTargets ? UK_ADULT_MALE_TARGETS.fat : undefined}
        />
         <TrendChart 
            title="Fiber" 
            data={chartData} 
            dataKey="fiber" 
            color="#a855f7" 
            unit="g"
            target={showChartTargets ? UK_ADULT_MALE_TARGETS.fiber : undefined}
        />
      </div>
    </div>
  );
};