
import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle, ShieldCheck, DollarSign, RefreshCw } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export const Settings: React.FC = () => {
  const { apiKey, setApiKey, fxRateConfig, setFxRateConfig } = useData();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'general' | 'fx'>('general');

  // API Key State
  const [inputKey, setInputKey] = useState('');
  const [keyStatus, setKeyStatus] = useState<'idle' | 'saved'>('idle');

  // FX State
  const [usdRate, setUsdRate] = useState<number>(7.82);
  const [fxStatus, setFxStatus] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    if (apiKey) setInputKey(apiKey);
    if (fxRateConfig) setUsdRate(fxRateConfig.usdToHkd);
  }, [apiKey, fxRateConfig]);

  const handleSaveKey = () => {
    setApiKey(inputKey);
    setKeyStatus('saved');
    setTimeout(() => setKeyStatus('idle'), 2000);
  };

  const handleSaveFx = () => {
      setFxRateConfig({
          usdToHkd: usdRate,
          source: 'custom',
          lastUpdated: new Date().toISOString()
      });
      setFxStatus('saved');
      setTimeout(() => setFxStatus('idle'), 2000);
  };

  const applyPreset = (rate: number) => {
      setUsdRate(rate);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-mono text-white mb-2">SYSTEM CONFIGURATION</h2>
        <p className="text-gray-400 text-sm">
           Manage API credentials and global calculation parameters.
        </p>
      </div>

      <div className="flex gap-6 mb-6 border-b border-gray-800">
          <button 
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-1 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'general' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab('fx')}
            className={`pb-3 px-1 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'fx' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            FX Rates
          </button>
      </div>

      {activeTab === 'general' && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl shadow-lg animate-fade-in">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Key size={20} />
            </div>
            <div>
                <h3 className="text-base font-bold text-gray-200">AI Service Credentials</h3>
                <p className="text-xs text-gray-500">Google Gemini API Key required for intelligent analysis.</p>
            </div>
            </div>

            <div className="space-y-4">
            <div>
                <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">API Key</label>
                <input 
                type="password" 
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-gray-950 border border-gray-700 rounded px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none font-mono placeholder-gray-600"
                />
            </div>

            <div className="bg-blue-900/10 border border-blue-900/30 rounded p-4 flex gap-3 items-start">
                <ShieldCheck size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                    <h4 className="text-xs font-bold text-blue-300 mb-1">Secure Local Storage</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                    Your key is stored securely in your browser's <code>localStorage</code>. It is never transmitted to any server other than Google's official API endpoints directly from your browser.
                    </p>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button 
                onClick={handleSaveKey}
                className={`flex items-center gap-2 px-6 py-2 rounded text-sm font-bold transition-all transform active:scale-95 ${
                    keyStatus === 'saved' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
                >
                {keyStatus === 'saved' ? <CheckCircle size={16} /> : <Save size={16} />}
                {keyStatus === 'saved' ? 'Saved Successfully' : 'Save Key'}
                </button>
            </div>
            </div>
        </div>
      )}

      {activeTab === 'fx' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl shadow-lg animate-fade-in">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <DollarSign size={20} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-200">Currency Conversion</h3>
                    <p className="text-xs text-gray-500">Set standard rates for USD to HKD normalization.</p>
                </div>
            </div>

            <div className="space-y-6">
                
                <div className="grid grid-cols-3 gap-4">
                     <button onClick={() => applyPreset(7.80)} className="p-3 rounded border border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-left group transition-all">
                        <div className="text-[10px] text-gray-500 font-mono uppercase mb-1 group-hover:text-gray-300">PEG Low</div>
                        <div className="text-lg font-bold text-white">7.80</div>
                     </button>
                     <button onClick={() => applyPreset(7.825)} className="p-3 rounded border border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-left group transition-all">
                        <div className="text-[10px] text-gray-500 font-mono uppercase mb-1 group-hover:text-gray-300">June 2025 Avg</div>
                        <div className="text-lg font-bold text-white">7.825</div>
                     </button>
                     <button onClick={() => applyPreset(7.85)} className="p-3 rounded border border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-left group transition-all">
                        <div className="text-[10px] text-gray-500 font-mono uppercase mb-1 group-hover:text-gray-300">PEG High</div>
                        <div className="text-lg font-bold text-white">7.85</div>
                     </button>
                </div>

                <div>
                    <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Custom USD/HKD Rate</label>
                    <div className="flex items-center">
                        <span className="bg-gray-800 border border-r-0 border-gray-700 text-gray-400 px-3 py-3 rounded-l text-sm font-mono">1 USD =</span>
                        <input 
                            type="number" 
                            step="0.0001"
                            value={usdRate}
                            onChange={(e) => setUsdRate(parseFloat(e.target.value))}
                            className="flex-1 bg-gray-950 border border-gray-700 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none font-mono"
                        />
                        <span className="bg-gray-800 border border-l-0 border-gray-700 text-gray-400 px-3 py-3 rounded-r text-sm font-mono">HKD</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                        <RefreshCw size={10}/> Used for converting HSBC & SCB reported figures.
                    </p>
                </div>

                <div className="pt-4 flex justify-end">
                    <button 
                    onClick={handleSaveFx}
                    className={`flex items-center gap-2 px-6 py-2 rounded text-sm font-bold transition-all transform active:scale-95 ${
                        fxStatus === 'saved' 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    >
                    {fxStatus === 'saved' ? <CheckCircle size={16} /> : <Save size={16} />}
                    {fxStatus === 'saved' ? 'Rate Updated' : 'Update Rate'}
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};
