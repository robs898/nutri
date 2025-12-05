import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, History, Settings } from 'lucide-react';
import { ViewState, Meal } from './types';
import { getStoredMeals, saveMeal, deleteMeal, APP_STORAGE_KEY } from './services/storageService';
import { DashboardView } from './components/DashboardView';
import { AddMealView } from './components/AddMealView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    setMeals(getStoredMeals());
  }, []);

  const handleSaveMeal = (meal: Meal) => {
    const updated = saveMeal(meal);
    setMeals(updated);
    setView(ViewState.DASHBOARD);
  };

  const handleDeleteMeal = (id: string) => {
    if (confirm("Are you sure you want to delete this meal?")) {
        const updated = deleteMeal(id);
        setMeals(updated);
    }
  };

  const handleImportMeals = (importedMeals: Meal[]) => {
    // Merge logic: Filter out duplicates based on ID, then combine
    const currentIds = new Set(meals.map(m => m.id));
    const newMeals = importedMeals.filter(m => !currentIds.has(m.id));
    
    const combined = [...newMeals, ...meals].sort((a, b) => b.timestamp - a.timestamp);
    
    // Save everything to storage
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(combined));
    setMeals(combined);
  };

  const handleClearAll = () => {
      localStorage.removeItem(APP_STORAGE_KEY);
      setMeals([]);
      setView(ViewState.DASHBOARD);
  };

  const renderView = () => {
    switch (view) {
      case ViewState.DASHBOARD:
        return <DashboardView meals={meals} />;
      case ViewState.ADD:
        return <AddMealView onSave={handleSaveMeal} onCancel={() => setView(ViewState.DASHBOARD)} />;
      case ViewState.HISTORY:
        return <HistoryView meals={meals} onDelete={handleDeleteMeal} />;
      case ViewState.SETTINGS:
        return <SettingsView meals={meals} onImport={handleImportMeals} onClear={handleClearAll} />;
      default:
        return <DashboardView meals={meals} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 font-sans">
      <div className="max-w-md mx-auto h-screen flex flex-col relative bg-white sm:shadow-xl sm:my-8 sm:h-[800px] sm:rounded-[3rem] sm:border-8 sm:border-gray-900 overflow-hidden">
        
        {/* Mobile Header */}
        <header className="px-6 pt-12 pb-4 bg-white z-10 sticky top-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              Pixel Nutrition
            </h1>
            <button 
              onClick={() => setView(ViewState.SETTINGS)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  view === ViewState.SETTINGS ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
                <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
          {renderView()}
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white border-t border-gray-100 px-6 py-4 pb-8 sticky bottom-0 z-20">
          <div className="flex justify-around items-center">
            <button
              onClick={() => setView(ViewState.DASHBOARD)}
              className={`flex flex-col items-center space-y-1 transition-colors ${
                view === ViewState.DASHBOARD ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <LayoutDashboard size={24} strokeWidth={view === ViewState.DASHBOARD ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Daily</span>
            </button>

            <button
              onClick={() => setView(ViewState.ADD)}
              className="flex flex-col items-center -mt-8"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                 view === ViewState.ADD ? 'bg-black text-white' : 'bg-blue-600 text-white'
              }`}>
                <PlusCircle size={28} />
              </div>
              <span className="text-[10px] font-medium mt-1 text-gray-600">Log</span>
            </button>

            <button
              onClick={() => setView(ViewState.HISTORY)}
              className={`flex flex-col items-center space-y-1 transition-colors ${
                view === ViewState.HISTORY ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <History size={24} strokeWidth={view === ViewState.HISTORY ? 2.5 : 2} />
              <span className="text-[10px] font-medium">History</span>
            </button>
          </div>
        </nav>

      </div>
      
      {/* Desktop Background Helper */}
      <div className="hidden sm:block fixed bottom-4 right-4 text-gray-400 text-xs">
         Preview Mode
      </div>
    </div>
  );
};

export default App;