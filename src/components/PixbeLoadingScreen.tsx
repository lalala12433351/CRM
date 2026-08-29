import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface PixbeLoadingScreenProps {
  companyName?: string;
  userName?: string;
  onFinish?: () => void;
}

export const PixbeLoadingScreen: React.FC<PixbeLoadingScreenProps> = ({ companyName, userName, onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Authenticating workspace...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(35);
      setStatusText(companyName ? `Connecting to ${companyName} database...` : 'Connecting to company database...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(70);
      setStatusText('Syncing leads, pipeline & permissions...');
    }, 1100);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Workspace ready! Launching dashboard...');
    }, 1800);

    const timer4 = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [companyName, onFinish]);

  return (
    <div className="fixed inset-0 z-50 min-h-screen w-full bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100 flex items-center justify-center p-4 select-none relative overflow-hidden font-sans animate-in fade-in duration-300">
      
      {/* Background Soft Glows (Matching Login Page) */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-400/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Background Wave Vector (Matching Login Page) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute -bottom-10 left-0 w-full h-[380px] opacity-40" viewBox="0 0 1200 400" fill="none">
          <path d="M0 250C300 150 600 350 900 200C1050 125 1150 180 1200 200V400H0V250Z" fill="url(#wave-gradient-splash)" />
          <defs>
            <linearGradient id="wave-gradient-splash" x1="0" y1="0" x2="1200" y2="400" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60A5FA" stopOpacity="0.4" />
              <stop offset="0.5" stopColor="#818CF8" stopOpacity="0.3" />
              <stop offset="1" stopColor="#C084FC" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* CENTER CONTENT - Transparent (No Card Background) */}
      <div className="relative z-10 w-full max-w-sm text-center space-y-6 animate-in fade-in zoom-in duration-700">
        
        {/* Animated Pixbe Logo Icon (Fades in & glows) */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-3xl bg-blue-500/25 blur-2xl animate-pulse" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-2xl shadow-blue-600/30 transform hover:scale-105 transition-transform animate-in fade-in zoom-in duration-1000">
            <div className="w-full h-full bg-slate-900/10 rounded-[22px] flex items-center justify-center backdrop-blur-sm">
              <svg className="w-11 h-11 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 4H14C16.7614 4 19 6.23858 19 9C19 11.7614 16.7614 14 14 14H11V20H7V4Z" fill="url(#p-icon-splash-grad)" />
                <circle cx="14" cy="9" r="2" fill="#38BDF8" />
                <path d="M7 4H12C14.2091 4 16 5.79086 16 8C16 10.2091 14.2091 12 12 12H7V4Z" fill="white" fillOpacity="0.3" />
                <defs>
                  <linearGradient id="p-icon-splash-grad" x1="7" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffffff" />
                    <stop offset="1" stopColor="#E0F2FE" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Brand Text Header - Transparent (No Box) */}
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center font-sans">
            pixbee
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block ml-0.5 animate-bounce" />
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {companyName || 'CRM & TeleSales Suite'}
          </p>
        </div>

        {/* Progress Bar & Status Message - Transparent */}
        <div className="space-y-3 pt-2">
          <div className="w-full bg-slate-200/80 rounded-full h-2.5 p-0.5 border border-white shadow-inner overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-center space-x-2 text-xs text-slate-600 font-semibold">
            <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
            <span>{statusText}</span>
          </div>
        </div>

        {/* User Greeting - Transparent */}
        {userName && (
          <div className="text-xs text-slate-500 font-medium pt-2">
            Logging in as <span className="text-slate-900 font-bold">{userName}</span>
          </div>
        )}
      </div>
    </div>
  );
};
