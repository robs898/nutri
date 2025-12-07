import React, { useState, useRef } from 'react';
import { Send, Sparkles, Loader2, CalendarClock, Save, Camera, X, ImageIcon } from 'lucide-react';
import { analyzeMealDescription } from '../services/geminiService';
import { Meal, MealAnalysis } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { NutritionCard } from './NutritionCard';
import { MOCK_LOADING_PHRASES } from '../constants';

interface AddMealViewProps {
  onSave: (meal: Meal) => void;
  onCancel: () => void;
  initialData?: Meal | null;
}

export const AddMealView: React.FC<AddMealViewProps> = ({ onSave, onCancel, initialData }) => {
  const [input, setInput] = useState(initialData?.originalText || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MealAnalysis | null>(initialData?.analysis || null);
  const [loadingText, setLoadingText] = useState(MOCK_LOADING_PHRASES[0]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize with local ISO string for datetime-local input
  const [mealDate, setMealDate] = useState(() => {
    const ts = initialData?.timestamp || Date.now();
    const d = new Date(ts);
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip prefix if needed for some APIs, but Gemini usually takes full data url or raw base64.
        // The SDK helper handles standard base64 strings well, usually we strip the header for raw data.
        // But for display we need the header.
        // Let's store full data URL for display, and strip for API.
        setSelectedImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!input.trim() && !selectedImage) return;
    
    setIsAnalyzing(true);
    setResult(null);
    
    // Cycle loading text
    const textInterval = setInterval(() => {
        setLoadingText(MOCK_LOADING_PHRASES[Math.floor(Math.random() * MOCK_LOADING_PHRASES.length)]);
    }, 1500);

    try {
      // If we have an image, strip the data:image/jpeg;base64, prefix for the API
      let rawBase64 = undefined;
      if (selectedImage) {
          rawBase64 = selectedImage.split(',')[1];
      }

      const analysis = await analyzeMealDescription(input, rawBase64);
      setResult(analysis);
    } catch (error) {
      console.error(error);
      alert("Something went wrong analyzing the meal. Please try again.");
    } finally {
      clearInterval(textInterval);
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    
    const timestamp = new Date(mealDate).getTime();
    
    const newMeal: Meal = {
      id: initialData?.id || uuidv4(), // Preserve ID if editing
      timestamp: timestamp,
      originalText: input || (selectedImage ? "📸 Image Log" : ""),
      analysis: result
    };
    
    onSave(newMeal);
    // Only clear if not editing (though usually parent unmounts this view on save)
    if (!initialData) {
        setInput('');
        setResult(null);
        setSelectedImage(null);
        const now = new Date();
        setMealDate(new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16));
    }
  };

  const isEditing = !!initialData;

  return (
    <div className="flex flex-col h-full pb-20 md:pb-0">
      <div className="flex-1 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 px-1">{isEditing ? 'Edit Meal' : 'Log Meal'}</h2>
        
        {/* Input Area */}
        <div className="space-y-4">
             {/* Image Preview Area */}
            {selectedImage && (
                <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    <img src={selectedImage} alt="Meal preview" className="w-full h-full object-cover" />
                    <button 
                        onClick={() => {
                            setSelectedImage(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="relative">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedImage ? "Add any extra details (optional)..." : "e.g. 800kcal of christmas turkey dinner..."}
                className="w-full h-32 md:h-48 p-4 bg-white rounded-xl shadow-sm border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-lg placeholder:text-gray-400 transition-all"
                disabled={isAnalyzing || (!!result && !isEditing)}
            />
            
            {/* Camera/Image Button (Only show if no result yet) */}
            {!result && !isAnalyzing && (
                <div className="absolute bottom-3 right-3 flex space-x-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                        title="Add photo"
                    >
                        <Camera size={20} />
                        <span className="text-xs font-bold hidden sm:inline">Add Photo</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageSelect} 
                        accept="image/*" 
                        className="hidden" 
                    />
                </div>
            )}
            
             {!result && (
                <div className="absolute bottom-3 left-3 text-xs text-gray-400">
                  Powered by Gemini
                </div>
              )}
            </div>
        </div>

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-pulse">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm text-gray-500 font-medium">{loadingText}</p>
          </div>
        )}

        {result && (
          <div className="animate-fade-in-up space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-gray-700">Analysis Result</h3>
              <button 
                onClick={() => setResult(null)} 
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                Re-analyze Input
              </button>
            </div>
            
            <NutritionCard data={result} title={result.summary} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                <div>
                    <label className="block text-xs text-gray-500 font-bold uppercase mb-2 flex items-center gap-1">
                        <CalendarClock size={14} />
                        <span>Date & Time</span>
                    </label>
                    <input 
                        type="datetime-local"
                        value={mealDate}
                        onChange={(e) => setMealDate(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    />
                </div>

                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Detected Items</p>
                    <div className="flex flex-wrap gap-2">
                        {result.foodItems.map((item, idx) => (
                        <span key={idx} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-md">
                            {item}
                        </span>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-20 md:static md:mt-6 pt-4 bg-gradient-to-t from-[#f3f4f6] via-[#f3f4f6] to-transparent md:bg-none">
        {!result ? (
          <div className="flex gap-3">
             {isEditing && (
                <button
                    onClick={onCancel}
                    className="flex-1 py-4 rounded-xl font-bold text-lg bg-white text-gray-800 border border-gray-200 shadow-sm hover:bg-gray-50"
                >
                    Cancel
                </button>
             )}
            <button
                onClick={handleAnalyze}
                disabled={(!input.trim() && !selectedImage) || isAnalyzing}
                className={`flex-[2] py-4 rounded-xl flex items-center justify-center space-x-2 font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] ${
                (!input.trim() && !selectedImage) || isAnalyzing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
                <Sparkles size={20} />
                <span>{isEditing ? 'Re-Analyze' : 'Analyze'}</span>
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
             <button
              onClick={() => {
                  setResult(null); 
                  if(isEditing) onCancel();
              }}
              className="flex-1 py-4 rounded-xl font-bold text-lg bg-white text-gray-800 border border-gray-200 shadow-sm active:scale-[0.98] transition-transform hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-[2] py-4 rounded-xl flex items-center justify-center space-x-2 font-bold text-lg bg-blue-600 text-white shadow-lg active:scale-[0.98] transition-transform hover:bg-blue-700"
            >
              <span>{isEditing ? 'Update Log' : 'Save Log'}</span>
              {isEditing ? <Save size={20} /> : <Send size={20} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};