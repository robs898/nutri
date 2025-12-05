import React from 'react';
import { Meal } from '../types';
import { format } from 'date-fns';
import { Trash2, Calendar } from 'lucide-react';
import { NutritionCard } from './NutritionCard';

interface HistoryViewProps {
  meals: Meal[];
  onDelete: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ meals, onDelete }) => {
  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Calendar size={48} className="mb-4 opacity-50" />
        <p>No meals tracked yet.</p>
      </div>
    );
  }

  // Group by date
  const groupedMeals: Record<string, Meal[]> = {};
  meals.forEach(meal => {
    const dateKey = format(new Date(meal.timestamp), 'yyyy-MM-dd');
    if (!groupedMeals[dateKey]) {
      groupedMeals[dateKey] = [];
    }
    groupedMeals[dateKey].push(meal);
  });

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <h2 className="text-2xl font-bold text-gray-900 px-1">History</h2>
      {Object.entries(groupedMeals).map(([dateKey, daysMeals]) => (
        <div key={dateKey}>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
            {format(new Date(dateKey), 'EEE, MMM d')}
          </h3>
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {daysMeals.map((meal) => (
              <div key={meal.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900">{meal.analysis.summary}</h4>
                    <p className="text-xs text-gray-500 italic mt-0.5">"{meal.originalText}"</p>
                  </div>
                  <button 
                    onClick={() => onDelete(meal.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <NutritionCard data={meal.analysis} compact={true} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};