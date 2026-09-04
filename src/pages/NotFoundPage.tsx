import React from 'react';
import { 
  Compass, 
  ArrowLeft, 
  Home, 
  Users, 
  PhoneCall, 
  Layers, 
  CheckSquare, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (view: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-8 text-center select-none font-sans animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-xl relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 404 Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-bold font-mono mb-6">
          <Compass className="w-3.5 h-3.5 animate-spin-slow text-indigo-600" />
          <span>ERROR 404</span>
        </div>

        {/* Big Number & Heading */}
        <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-slate-900 mb-2 font-sans">
          404
        </h1>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 tracking-tight font-sans">
          Page Not Found
        </h2>
        
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          The page or view you are looking for doesn't exist, has been moved, or you may have clicked an outdated link.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={() => onNavigate('leads')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#5034a8] hover:bg-[#432b8e] text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
          >
            <Users className="w-4 h-4" />
            <span>Go to Leads</span>
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
              } else {
                onNavigate('leads');
              }
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Quick Jump Links */}
        <div className="pt-6 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Quick Navigation
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => onNavigate('pipeline')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/60 transition-colors flex items-center justify-center space-x-1.5 font-medium cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Pipeline</span>
            </button>
            <button
              onClick={() => onNavigate('followups')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/60 transition-colors flex items-center justify-center space-x-1.5 font-medium cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
              <span>Follow-ups</span>
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/60 transition-colors flex items-center justify-center space-x-1.5 font-medium cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Tasks</span>
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/60 transition-colors flex items-center justify-center space-x-1.5 font-medium cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Settings</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
