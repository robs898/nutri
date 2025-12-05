import React from 'react';
import { MacroProfile } from '../types';

interface NutritionCardProps {
  data: MacroProfile;
  title?: string;
  compact?: boolean;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({ data, title, compact = false }) => {
  // Handle legacy data where fiber might be undefined
  const fiber = data.fiber || 0;

  if (compact) {
    return (
      <div className="grid grid-cols-5 gap-1 text-center text-xs text-gray-600 mt-2">
        <div className="bg-orange-50 p-1 rounded flex flex-col justify-center">
          <span className="block font-bold text-orange-600 text-xs sm:text-sm">{Math.round(data.calories)}</span>
          <span className="text-[9px] sm:text-[10px]">kcal</span>
        </div>
        <div className="bg-blue-50 p-1 rounded flex flex-col justify-center">
          <span className="block font-bold text-blue-600 text-xs sm:text-sm">{Math.round(data.protein)}g</span>
          <span className="text-[9px] sm:text-[10px]">Prot</span>
        </div>
        <div className="bg-green-50 p-1 rounded flex flex-col justify-center">
          <span className="block font-bold text-green-600 text-xs sm:text-sm">{Math.round(data.carbs)}g</span>
          <span className="text-[9px] sm:text-[10px]">Carb</span>
        </div>
        <div className="bg-yellow-50 p-1 rounded flex flex-col justify-center">
          <span className="block font-bold text-yellow-600 text-xs sm:text-sm">{Math.round(data.fat)}g</span>
          <span className="text-[9px] sm:text-[10px]">Fat</span>
        </div>
        <div className="bg-purple-50 p-1 rounded flex flex-col justify-center">
          <span className="block font-bold text-purple-600 text-xs sm:text-sm">{Math.round(fiber)}g</span>
          <span className="text-[9px] sm:text-[10px]">Fib</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      {title && <h3 className="text-gray-500 text-sm font-medium mb-3 uppercase tracking-wider">{title}</h3>}
      <div className="flex justify-between items-end mb-4">
         <div>
            <span className="text-4xl font-bold text-gray-900">{Math.round(data.calories)}</span>
            <span className="text-gray-500 ml-1 font-medium">kcal</span>
         </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Protein</span>
            <span className="font-bold text-gray-900">{Math.round(data.protein)}g</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Carbs</span>
            <span className="font-bold text-gray-900">{Math.round(data.carbs)}g</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Fat</span>
            <span className="font-bold text-gray-900">{Math.round(data.fat)}g</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Fiber</span>
            <span className="font-bold text-gray-900">{Math.round(fiber)}g</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};