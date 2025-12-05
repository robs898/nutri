import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, History, Settings, Cloud, User as UserIcon } from 'lucide-react';
import { ViewState, Meal, FirebaseConfig } from './types';
import { getStoredMeals, saveMeal, deleteMeal, APP_STORAGE_KEY } from './services/storageService';
import { initFirebase, fetchMealsFromCloud, saveMealToCloud, deleteMealFromCloud, subscribeToAuthChanges } from './services/firebaseService';
import { User } from 'firebase/auth';
import { DashboardView } from './components/DashboardView';
import { AddMealView } from './components/AddMealView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribeAuth: () => void;

    const initializeData = async () => {
        setIsLoading(true);
        const cloudConfigStr = localStorage.getItem('pixel-nutrition-firebase-config');
        
        if (cloudConfigStr) {
            try {
                const config = JSON.parse(cloudConfigStr) as FirebaseConfig;
                const success = initFirebase(config);
                if (success) {
                    setIsCloudConfigured(true);
                    
                    // Listen for auth changes
                    unsubscribeAuth = subscribeToAuthChanges(async (user) => {
                        setCurrentUser(user);
                        if (user) {
                            try {
                                const cloudMeals = await fetchMealsFromCloud();
                                setMeals(cloudMeals);
                            } catch (e) {
                                console.error("Error fetching cloud meals", e);
                            }
                        } else {
                            // If logged out but config exists, show local or empty? 
                            // Let's show local fallback or empty.
                            setMeals(getStoredMeals());
                        }
                        setIsLoading(false);
                    })!; // Bang operator since we know init returned true
                    return;
                }
            } catch (e) {
                console.error("Invalid cloud config", e);
            }
        }
        
        // Default to local storage if no cloud config
        setMeals(getStoredMeals());
        setIsLoading(false);
    };

    initializeData();

    return () => {
        if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const handleSaveMeal = async (meal: Meal) => {
    if (isCloudConfigured && currentUser) {
        saveMealToCloud(meal).catch(err => alert("Failed to save to cloud: " + err.message));
        setMeals(prev => [meal, ...prev]);
    } else {
        const updated = saveMeal(meal);
        setMeals(updated);
    }
    setView(ViewState.DASHBOARD);
  };

  const handleDeleteMeal = async (id: string) => {
    if (confirm("Are you sure you want to delete this meal?")) {
        if (isCloudConfigured && currentUser) {
            deleteMealFromCloud(id).catch(err => alert("Failed to delete from cloud"));
            setMeals(prev => prev.filter(m => m.id !== id));
        } else {
            const updated = deleteMeal(id);
            setMeals(updated);
        }
    }
  };

  const handleImportMeals = async (importedMeals: Meal[]) => {
    const currentIds = new Set(meals.map(m => m.id));
    const newMeals = importedMeals.filter(m => !currentIds.has(m.id));
    const combined = [...newMeals, ...meals].sort((a, b) => b.timestamp - a.timestamp);
    
    if (isCloudConfigured && currentUser) {
        const uploadPromises = newMeals.map(m => saveMealToCloud(m));
        await Promise.all(uploadPromises);
        setMeals(combined);
    } else {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(combined));
        setMeals(combined);
    }
  };

  const handleClearAll = () => {
      if (!isCloudConfigured) {
        localStorage.removeItem(APP_STORAGE_KEY);
        setMeals([]);
      }
      setView(ViewState.DASHBOARD);
  };

  const renderView = () => {
    if (isLoading) {
        return <div className="flex h-full items-center justify-center text-gray-400">Loading...</div>;
    }

    switch (view) {
      case ViewState.DASHBOARD:
        return <DashboardView meals={meals} />;
      case ViewState.ADD:
        return <AddMealView onSave={handleSaveMeal} onCancel={() => setView(ViewState.DASHBOARD)} />;
      case ViewState.HISTORY:
        return <HistoryView meals={meals} onDelete={handleDeleteMeal} />;
      case ViewState.SETTINGS:
        return <SettingsView meals={meals} onImport={handleImportMeals} onClear={handleClearAll} currentUser={currentUser} />;
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
              <span className={`w-2 h-6 rounded-full ${isCloudConfigured && currentUser ? 'bg-blue-600' : 'bg-gray-400'}`}></span>
              Pixel Nutrition
            </h1>
            <div className="flex items-center space-x-2">
                {isCloudConfigured && currentUser && (
                   <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
                      {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} className="w-full h-full object-cover" />
                      ) : (
                          <UserIcon size={16} className="text-blue-600" />
                      )}
                   </div>
                )}
                <button 
                onClick={() => setView(ViewState.SETTINGS)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    view === ViewState.SETTINGS ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                >
                    <Settings size={20} />
                </button>
            </div>
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
      
       <div className="hidden sm:block fixed bottom-4 right-4 text-gray-400 text-xs">
         {isCloudConfigured 
            ? currentUser 
                ? `Syncing as ${currentUser.email}`
                : 'Cloud Configured (Not Signed In)'
            : 'Local Storage Mode'}
      </div>
    </div>
  );
};

export default App;