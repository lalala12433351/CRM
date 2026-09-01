import React, { useEffect, useState } from 'react';

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
      setStatusText(companyName ? `Connecting to ${companyName}...` : 'Connecting to database...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(70);
      setStatusText('Syncing leads, pipeline & permissions...');
    }, 1000);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Workspace ready...');
    }, 1600);

    const timer4 = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [companyName, onFinish]);

  return (
    <div className="fixed inset-0 z-50 min-h-screen w-full bg-gradient-to-br from-[#005cee] to-[#0048cb] flex items-center justify-center p-6 select-none relative overflow-hidden font-sans text-white animate-in fade-in duration-300">
      
      {/* Concentric Decorative Wave Arcs (Exact match to login theme) */}
      <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] pointer-events-none">
        <svg 
          className="w-full h-full opacity-35" 
          viewBox="0 0 500 500" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="80" cy="460" r="380" stroke="#60a5fa" strokeWidth="1.75" />
          <circle cx="80" cy="460" r="300" stroke="#93c5fd" strokeWidth="1.5" />
          <circle cx="80" cy="460" r="220" stroke="#bfdbfe" strokeWidth="1.25" />
          <circle cx="80" cy="460" r="140" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.6" />
        </svg>
      </div>

      {/* Center Simple Content */}
      <div className="relative z-10 w-full max-w-sm text-center space-y-6 animate-in fade-in zoom-in duration-500">
        
        {/* Simple Pixbe CRM Header Text */}
        <div>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-none">
            Pixbe CRM
          </h1>
          <p className="text-sm font-medium text-blue-100/80 mt-3">
            {companyName || 'Intelligent Sales & Automation Suite'}
          </p>
        </div>

        {/* Minimal Progress Bar & Status Text */}
        <div className="space-y-3 pt-2 max-w-xs mx-auto">
          <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden backdrop-blur-xs">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-xs text-blue-100/90 font-medium">
            {statusText}
          </div>
        </div>

        {/* User Greeting if available */}
        {userName && (
          <div className="text-xs text-blue-200/80 pt-1">
            Logging in as <span className="text-white font-semibold">{userName}</span>
          </div>
        )}
      </div>

      {/* Subtle Copyright at bottom */}
      <div className="absolute bottom-6 text-[11px] text-blue-200/60 font-medium">
        © {new Date().getFullYear()} Pixbe Cloud Suite. All rights reserved.
      </div>
    </div>
  );
};
