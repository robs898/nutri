import React, { useRef, useState, useEffect } from 'react';
import { Meal } from '../types';
import { Download, Upload, Database, AlertTriangle, Cloud, Check, Wifi, LogOut, LogIn, Copy, Bot, ChevronDown } from 'lucide-react';
import { signInWithGoogle, signOut, isFirebaseInitialized, initFirebase } from '../services/firebaseService';
import { User } from 'firebase/auth';

interface SettingsViewProps {
  meals: Meal[];
  onImport: (meals: Meal[]) => void;
  onClear: () => void;
  currentUser: User | null;
}

const AVAILABLE_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)', desc: 'Best balance of speed and intelligence.' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', desc: 'Smarter reasoning, slightly slower.' },
    { id: 'gemini-2.5-flash-lite-latest', name: 'Gemini 2.5 Flash Lite', desc: 'Fastest response time.' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ meals, onImport, onClear, currentUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [configJson, setConfigJson] = useState('');
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<React.ReactNode | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

  useEffect(() => {
    const checkConfig = () => {
        const savedConfig = localStorage.getItem('pixel-nutrition-firebase-config');
        if (savedConfig) {
          setConfigJson(savedConfig);
          
          if (isFirebaseInitialized()) {
             setIsCloudConfigured(true);
             setConfigError(null);
          } else {
             try {
                const parsed = JSON.parse(savedConfig);
                if (initFirebase(parsed)) {
                    setIsCloudConfigured(true);
                    setConfigError(null);
                } else {
                    setIsCloudConfigured(false);
                    setConfigError("The saved configuration appears to be invalid. Please check it below.");
                }
             } catch (e) {
                setIsCloudConfigured(false);
                setConfigError("Could not parse saved configuration.");
             }
          }
        }
        
        const savedModel = localStorage.getItem('pixel-nutrition-model');
        if (savedModel) setSelectedModel(savedModel);
    };
    
    checkConfig();
  }, []);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newModel = e.target.value;
      setSelectedModel(newModel);
      localStorage.setItem('pixel-nutrition-model', newModel);
  };

  const extractConfigObject = (str: string): string | null => {
    let startIndex = str.search(/firebaseConfig\s*=\s*\{/);
    
    if (startIndex !== -1) {
       startIndex = str.indexOf('{', startIndex);
    } else {
       const apiKeyIndex = str.indexOf('apiKey');
       if (apiKeyIndex !== -1) {
           startIndex = str.lastIndexOf('{', apiKeyIndex);
       } else {
           startIndex = str.indexOf('{');
       }
    }

    if (startIndex === -1) return null;

    let braceCount = 0;
    let foundStart = false;
    
    for (let i = startIndex; i < str.length; i++) {
      if (str[i] === '{') {
          braceCount++;
          foundStart = true;
      }
      if (str[i] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          return str.substring(startIndex, i + 1);
        }
      }
    }

    return null;
  };

  const handleSaveConfig = () => {
    setConfigError(null);
    try {
      const rawInput = configJson.trim();
      let processingInput = rawInput;
      if (rawInput.includes('apiKey') && !rawInput.includes('{')) {
          processingInput = `{${rawInput}}`;
      }

      const extractedObject = extractConfigObject(processingInput);

      if (!extractedObject) {
        throw new Error("Could not find a valid configuration object (starting with { and ending with }).");
      }
      
      const parse = new Function(`return ${extractedObject}`);
      const parsed = parse();

      if (!parsed || typeof parsed !== 'object') {
         throw new Error("Parsed result is not a valid object.");
      }

      if (!parsed.apiKey || !parsed.projectId) {
         throw new Error("Configuration is missing 'apiKey' or 'projectId'. Please check if you copied the correct code.");
      }

      if (!initFirebase(parsed)) {
          throw new Error("Firebase failed to initialize with these settings. Please check your project configuration.");
      }

      localStorage.setItem('pixel-nutrition-firebase-config', JSON.stringify(parsed));
      setIsCloudConfigured(true);
      alert("Configuration connected! Reloading app...");
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert(`Error parsing configuration: ${e.message}\n\nTip: Copy the code block starting with 'const firebaseConfig = ...'`);
    }
  };

  const handleDisconnectCloud = () => {
    if (confirm("Disconnect from cloud? This will switch back to local storage.")) {
      localStorage.removeItem('pixel-nutrition-firebase-config');
      setIsCloudConfigured(false);
      setConfigJson('');
      setConfigError(null);
      setSignInError(null);
      window.location.reload();
    }
  };
  
  const handleSignIn = async () => {
      setSignInError(null);
      try {
          if (!isFirebaseInitialized()) {
             const saved = localStorage.getItem('pixel-nutrition-firebase-config');
             if (saved) {
                 initFirebase(JSON.parse(saved));
             }
          }
          await signInWithGoogle();
      } catch (e: any) {
          console.error(e);
          if (e.code === 'auth/unauthorized-domain' || (e.message && e.message.includes('auth/unauthorized-domain'))) {
              const domain = window.location.hostname;
              setSignInError(
                  <div className="space-y-2">
                      <p className="font-bold">Unauthorized Domain</p>
                      <p>You must add this domain to your Firebase Console:</p>
                      <div className="bg-white p-2 border rounded text-gray-800 font-mono break-all flex justify-between items-center">
                          <span>{domain}</span>
                          <button onClick={() => navigator.clipboard.writeText(domain)} className="p-1 hover:bg-gray-100 rounded">
                              <Copy size={14}/>
                          </button>
                      </div>
                      <p>Go to <b>Authentication &gt; Settings &gt; Authorized Domains</b> and add it.</p>
                  </div>
              );
          } else if (e.code === 'auth/popup-blocked') {
              setSignInError("Popup blocked. Please allow popups for this site in your browser settings.");
          } else {
              setSignInError(`Sign in failed: ${e.message}`);
          }
      }
  };

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
           if (confirm(`Found ${parsed.length} meals in backup. Import them?`)) {
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <h2 className="text-2xl font-bold text-gray-900 px-1">Settings</h2>

      {/* Model Selection */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <div className="flex items-center space-x-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                <Bot size={20} />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-gray-800">AI Model</h3>
                <p className="text-xs text-gray-500">Choose the brain behind the app.</p>
            </div>
         </div>
         <div className="relative">
             <select 
                value={selectedModel}
                onChange={handleModelChange}
                className="w-full p-3 pl-4 pr-10 appearance-none bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
             >
                 {AVAILABLE_MODELS.map(m => (
                     <option key={m.id} value={m.id}>{m.name}</option>
                 ))}
             </select>
             <ChevronDown size={16} className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" />
         </div>
         <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
             <p className="text-xs text-gray-600">
                 {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.desc}
             </p>
         </div>
      </div>

      {/* Cloud Sync Section */}
      <div className={`p-6 rounded-xl shadow-sm border ${isCloudConfigured ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center space-x-3 mb-4">
            <div className={`p-2 rounded-full ${isCloudConfigured ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                <Cloud size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800">Cloud Sync</h3>
              <p className="text-xs text-gray-500">
                {isCloudConfigured ? 'Configured' : 'Connect to Google Firebase (Free)'}
              </p>
            </div>
            {isCloudConfigured && <Check size={20} className="text-blue-600" />}
        </div>

        {!isCloudConfigured ? (
          <div className="space-y-4">
             {configError && (
                 <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs border border-red-100 flex items-start space-x-2">
                     <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                     <span>{configError}</span>
                 </div>
             )}
             <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs font-bold text-gray-700 mb-2">How to connect:</p>
                <ol className="list-decimal pl-4 space-y-1 text-xs text-gray-600">
                    <li>Go to <b>Project Settings</b> in Firebase Console.</li>
                    <li>Scroll down to "Your apps" and select the Web app <b>(&lt;/&gt;)</b>.</li>
                    <li>Copy the <code>const firebaseConfig = ...</code> code block.</li>
                    <li>Paste it below exactly as it is.</li>
                </ol>
             </div>
             
             <textarea 
                value={configJson}
                onChange={(e) => {
                    setConfigJson(e.target.value);
                    if (configError) setConfigError(null);
                }}
                placeholder='Paste the full code here...'
                className="w-full h-32 p-3 text-xs font-mono bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
             />
             <button onClick={handleSaveConfig} className="w-full py-2 bg-black text-white rounded-lg text-sm font-bold flex items-center justify-center space-x-2">
                <Wifi size={16} />
                <span>Connect Config</span>
             </button>
          </div>
        ) : (
          <div className="space-y-3">
             {!currentUser ? (
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                   <p className="text-sm text-gray-600 mb-3">Sign in to sync your data across devices.</p>
                   {signInError && (
                       <div className="mb-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
                           {signInError}
                       </div>
                   )}
                   <button onClick={handleSignIn} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center justify-center space-x-2 shadow-sm">
                      <LogIn size={16} />
                      <span>Sign in with Google</span>
                   </button>
                </div>
             ) : (
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center space-x-2 mb-3">
                        {currentUser.photoURL && (
                            <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                        )}
                        <div>
                            <p className="text-xs text-gray-500">Signed in as</p>
                            <p className="text-sm font-bold text-gray-800">{currentUser.displayName || currentUser.email}</p>
                        </div>
                    </div>
                    <button onClick={signOut} className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 hover:bg-gray-200">
                      <LogOut size={14} />
                      <span>Sign Out</span>
                   </button>
                </div>
             )}

             <button onClick={handleDisconnectCloud} className="w-full py-2 mt-2 text-red-500 text-xs hover:underline">
                Remove Configuration
             </button>
          </div>
        )}
      </div>

      {/* Local Backup Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
            <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                <Database size={20} />
            </div>
            <h3 className="font-bold text-gray-800">Backups</h3>
        </div>
        <div className="space-y-3">
            <button onClick={handleExport} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group">
                <div className="flex items-center space-x-3">
                    <Download size={18} className="text-gray-600 group-hover:text-blue-600" />
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Export Backup</span>
                </div>
            </button>
            <button onClick={handleImportClick} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group">
                <div className="flex items-center space-x-3">
                    <Upload size={18} className="text-gray-600 group-hover:text-blue-600" />
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Import Backup</span>
                </div>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
        </div>
      </div>

      <div className="bg-red-50 p-6 rounded-xl border border-red-100">
         <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle size={20} className="text-red-500" />
            <h3 className="font-bold text-red-700">Danger Zone</h3>
        </div>
        <button onClick={() => { if(confirm("Are you sure?")) onClear(); }} className="w-full py-3 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors">
            Clear Local Data
        </button>
      </div>
    </div>
  );
};