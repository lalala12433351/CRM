import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateApiTokenModalProps {
  onClose: () => void;
  onGenerate: (payload: any) => void;
  initialData?: any;
}

export const CreateApiTokenModal: React.FC<CreateApiTokenModalProps> = ({ onClose, onGenerate, initialData }) => {
  const [tokenName, setTokenName] = useState(initialData?.name || '');
  const [recapturePreference, setRecapturePreference] = useState(initialData?.recapturePreference || 'Once a day');
  const [apiType, setApiType] = useState<'async' | 'sync'>(initialData?.apiType || 'async');

  const handleGenerate = () => {
    onGenerate({
      name: tokenName,
      recapturePreference,
      apiType
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{initialData ? 'Edit API Token' : 'Create new API Token'}</h2>
            <p className="text-[13px] text-slate-500 mt-1 font-medium">{initialData ? 'Update the configurable settings for this access token' : 'Generate a new access token for integrating with Telecrm APIs'}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 pt-0 space-y-6">
          
          {/* Token Name */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-slate-700">
              Token name
            </label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g. Product integration, development testing"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <p className="text-xs text-slate-500 font-medium pt-1">
              Choose a descriptive name for your token
            </p>
          </div>

          {/* Lead Recapture Preferences */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-slate-700">
              Lead Recapture Preferences
            </label>
            <select
              value={recapturePreference}
              onChange={(e) => setRecapturePreference(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="Once a day">Once a day</option>
              <option value="Always">Always</option>
              <option value="Never">Never</option>
            </select>
            <p className="text-xs text-slate-500 font-medium pt-1">
              Choose when to mark a repeat API lead as "recaptured."
            </p>
          </div>

          {/* Select API type */}
          <div className="space-y-3">
            <label className="block text-[13px] font-semibold text-slate-700">
              Select API type
            </label>

            {/* Option 1: Async APIs */}
            <div 
              onClick={() => setApiType('async')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${apiType === 'async' ? 'border-[#5b38d3] bg-[#fbf9ff]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="apiType"
                    checked={apiType === 'async'}
                    onChange={() => setApiType('async')}
                    className="w-4 h-4 text-[#5b38d3] bg-white border-gray-300 focus:ring-[#5b38d3] cursor-pointer"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-medium ${apiType === 'async' ? 'text-slate-900' : 'text-slate-700'}`}>Async APIs</span>
                    <span className="px-2.5 py-0.5 rounded-full border border-[#5b38d3] bg-white text-[#5b38d3] text-[11px] font-medium">Recommended</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-2 font-medium">
                    Fire-and-forget operations ideal for high-volume lead processing. Lower cost with higher rate limits.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    <div>
                      <h4 className="text-[13px] font-semibold text-slate-800 mb-2">Use Cases:</h4>
                      <ul className="space-y-1.5">
                        <li className="flex items-center text-[13px] text-slate-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2 flex-shrink-0"></span>
                          Create new leads
                        </li>
                        <li className="flex items-center text-[13px] text-slate-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2 flex-shrink-0"></span>
                          Update lead information
                        </li>
                        <li className="flex items-center text-[13px] text-slate-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2 flex-shrink-0"></span>
                          Bulk lead operations
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-slate-800 mb-2">Benefits:</h4>
                      <ul className="space-y-1.5">
                        <li className="flex items-center text-[13px] text-slate-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2 flex-shrink-0"></span>
                          18,000 requests/hour
                        </li>
                        <li className="flex items-center text-[13px] text-slate-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2 flex-shrink-0"></span>
                          Lower cost per request
                        </li>
                        <li className="flex items-center text-[13px] text-slate-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2 flex-shrink-0"></span>
                          High scalability
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Option 2: Sync APIs */}
            <div 
              onClick={() => setApiType('sync')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${apiType === 'sync' ? 'border-[#5b38d3] bg-[#fbf9ff]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="apiType"
                    checked={apiType === 'sync'}
                    onChange={() => setApiType('sync')}
                    className="w-4 h-4 text-[#5b38d3] bg-white border-gray-300 focus:ring-[#5b38d3] cursor-pointer"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-medium ${apiType === 'sync' ? 'text-slate-900' : 'text-slate-700'}`}>Sync APIs</span>
                    <span className="px-2.5 py-0.5 rounded-full border border-slate-200 bg-white text-slate-600 text-[11px] font-medium">Rate-limited</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-2 font-medium">
                    Real time operations with immediate JSON responses. For data retrieval and search operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!tokenName.trim()}
            className="px-6 py-2 rounded-lg bg-[#6342E8] hover:bg-[#5234D0] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            {initialData ? 'Update Token' : 'Generate Token'}
          </button>
        </div>
      </div>
    </div>
  );
};
