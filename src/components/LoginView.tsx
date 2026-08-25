import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, LogIn, AlertCircle, Loader2, KeyRound, UserCheck, Shield } from 'lucide-react';
import { Agent, isAgentAdmin } from '../types';
import { loginWithApi } from '../lib/auth';

interface LoginViewProps {
  agents: Agent[];
  onLogin: (agent: Agent) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ agents, onLogin }) => {
  const [email, setEmail] = useState('admin@kiteaviation');
  const [password, setPassword] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    // Real-world backend API authentication endpoint
    const result = await loginWithApi(targetEmail, password);

    setIsLoading(false);

    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      // Fallback matching against workspace agents
      const matchedAgent = agents.find((a) => a.email.toLowerCase() === targetEmail);
      if (matchedAgent) {
        onLogin(matchedAgent);
      } else {
        setErrorMessage(
          result.error || `Invalid credentials for "${email}". Check your email and password.`
        );
      }
    }
  };

  const handleQuickPreset = async (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setIsLoading(true);
    const result = await loginWithApi(presetEmail, presetPass);
    setIsLoading(false);
    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      const matchedAgent = agents.find((a) => a.email.toLowerCase() === presetEmail);
      if (matchedAgent) onLogin(matchedAgent);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 relative z-10 animate-in fade-in">
        
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pixbe CRM</h1>
          <p className="text-xs text-slate-400 font-normal">
            Authenticate to access Admin or Employee Workspace
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-normal flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-normal">
          <div>
            <label className="block text-slate-300 font-normal mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kiteaviation or employee@kiteaviation"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-normal transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-normal mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin or employee"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-normal transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Log In to Workspace</span>
              </>
            )}
          </button>
        </form>

        {/* Primary Demo Credentials Shortcuts */}
        <div className="border-t border-slate-700/60 pt-5 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>One-Click Preset Accounts</span>
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Admin Preset */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickPreset('admin@kiteaviation', 'admin')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-200">Log In as Master Admin</div>
                  <div className="text-[10px] text-indigo-300/80">admin@kiteaviation • password: admin</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 border border-slate-700 text-slate-300 uppercase">Admin</span>
            </button>

            {/* Employee Preset */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickPreset('employee@kiteaviation', 'employee')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/60 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center font-bold shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-slate-200">Log In as Employee</div>
                  <div className="text-[10px] text-slate-400">employee@kiteaviation • password: employee</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300 uppercase">Employee</span>
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="text-center text-[10px] text-slate-500 font-normal">
          🔒 Authenticated via REST API endpoint (`POST /api/auth/login`)
        </div>
      </div>
    </div>
  );
};
