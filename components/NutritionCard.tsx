import React from 'react';
import { MacroProfile } from '../types';

interface NutritionCardProps {
  data: MacroProfile;
  title?: string;
  compact?: boolean;
  targets?: MacroProfile; // Optional daily targets
}

export const NutritionCard: React.FC<NutritionCardProps> = ({ data, title, compact = false, targets }) => {
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

  const renderMacro = (label: string, value: number, colorClass: string, bgClass: string, target?: number) => {
    const percent = target ? Math.min((value / target) * 100, 100) : 0;
    
    return (
      <div className="flex flex-col">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{label}</span>
          <div className="text-right">
             <span className="font-bold text-gray-900">{Math.round(value)}g</span>
             {target && <span className="text-xs text-gray-400 font-normal ml-1">/ {target}g</span>}
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden relative">
          <div className={`${colorClass} h-2 rounded-full absolute top-0 left-0`} style={{ width: target ? `${percent}%` : '100%' }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      {title && <h3 className="text-gray-500 text-sm font-medium mb-3 uppercase tracking-wider">{title}</h3>}
      <div className="flex justify-between items-end mb-4">
         <div>
            <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">{Math.round(data.calories)}</span>
                <span className="text-gray-500 ml-1 font-medium">kcal</span>
                {targets && (
                    <span className="text-sm text-gray-400 ml-2">
                        of {targets.calories} goal
                    </span>
                )}
            </div>
            {targets && (
                 <div className="w-full max-w-[200px] bg-gray-100 h-1.5 rounded-full mt-2">
                    <div 
                        className="bg-orange-500 h-1.5 rounded-full" 
                        style={{ width: `${Math.min((data.calories / targets.calories) * 100, 100)}%` }}
                    />
                 </div>
            )}
         </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {renderMacro("Protein", data.protein, "bg-blue-500", "bg-blue-50", targets?.protein)}
        {renderMacro("Carbs", data.carbs, "bg-green-500", "bg-green-50", targets?.carbs)}
        {renderMacro("Fat", data.fat, "bg-yellow-500", "bg-yellow-50", targets?.fat)}
        {renderMacro("Fiber", fiber, "bg-purple-500", "bg-purple-50", targets?.fiber)}
      </div>
    </div>
  );
};