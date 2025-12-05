import React, { useRef } from 'react';
import { Meal } from '../types';
import { Download, Upload, Trash2, Database, AlertTriangle } from 'lucide-react';
import { saveMeal } from '../services/storageService';

interface SettingsViewProps {
  meals: Meal[];
  onImport: (meals: Meal[]) => void;
  onClear: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ meals, onImport, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(meals, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `pixel-nutrition-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as Meal[];
        
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].analysis) {
           if (confirm(`Found ${parsed.length} meals in backup. Import them? This will merge with existing data.`)) {
             onImport(parsed);
             alert("Import successful!");
           }
        } else {
            alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Failed to parse file.");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearData = () => {
      if(confirm("DANGER: This will permanently delete all your tracked meals. This cannot be undone. Are you sure?")) {
          onClear();
      }
  };

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-900 px-1">Settings</h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <Database size={20} />
            </div>
            <h3 className="font-bold text-gray-800">Data Management</h3>
        </div>
        
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Your data is currently stored locally on this device. 
            Export a backup regularly to keep your history safe.
        </p>

        <div className="space-y-3">
            <button 
                onClick={handleExport}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
            >
                <div className="flex items-center space-x-3">
                    <Download size={18} className="text-gray-600 group-hover:text-blue-600" />
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Export Backup</span>
                </div>
                <span className="text-xs text-gray-400">{meals.length} records</span>
            </button>

            <button 
                onClick={handleImportClick}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
            >
                <div className="flex items-center space-x-3">
                    <Upload size={18} className="text-gray-600 group-hover:text-blue-600" />
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Import Backup</span>
                </div>
            </button>
            {/* Hidden Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
            />
        </div>
      </div>

      <div className="bg-red-50 p-6 rounded-xl border border-red-100">
         <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle size={20} className="text-red-500" />
            <h3 className="font-bold text-red-700">Danger Zone</h3>
        </div>
        <button 
            onClick={handleClearData}
            className="w-full py-3 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors"
        >
            Clear All Data
        </button>
      </div>
      
      <div className="text-center text-xs text-gray-400 mt-8">
        Pixel Nutrition AI v1.0.0
      </div>
    </div>
  );
};