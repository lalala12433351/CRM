import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  AlertCircle, 
  Loader2, 
  UserCheck, 
  Shield, 
  Eye, 
  EyeOff, 
  Bot, 
  ArrowRight,
  RefreshCw,
  Check
} from 'lucide-react';
import { Agent } from '../types';
import { loginWithApi } from '../lib/auth';

interface LoginViewProps {
  agents: Agent[];
  onLogin: (agent: Agent) => void;
  onSwitchToSignUp?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ agents, onLogin, onSwitchToSignUp }) => {
  const [email, setEmail] = useState('admin@kiteaviation');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [activeTab, setActiveTab] = useState<'credentials' | 'quick'>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMessage('Please agree to the User Agreement & Privacy Policy to proceed.');
      return;
    }
    setErrorMessage(null);

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    const result = await loginWithApi(targetEmail, password);
    setIsLoading(false);

    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      const matchedAgent = agents.find((a) => a.email.toLowerCase() === targetEmail);
      if (matchedAgent) {
        onLogin(matchedAgent);
      } else {
        setErrorMessage(
          result.error || `Invalid credentials for "${email}". Please check email and password.`
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100 flex items-center justify-center p-3 md:p-8 select-none relative overflow-hidden font-sans">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-400/15 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Main Glass Canvas Card */}
      <div className="w-full max-w-5xl h-auto min-h-[620px] bg-gradient-to-b from-sky-100/90 via-blue-50/85 to-indigo-100/90 backdrop-blur-2xl border border-white/60 rounded-[36px] shadow-2xl shadow-blue-900/30 p-6 md:p-10 relative overflow-hidden flex flex-col justify-between">
        
        {/* Futuristic Background Wave Vector & Rays */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="absolute -bottom-10 left-0 w-full h-[380px] opacity-40" viewBox="0 0 1200 400" fill="none">
            <path d="M0 250C300 150 600 350 900 200C1050 125 1150 180 1200 200V400H0V250Z" fill="url(#wave-gradient)" />
            <defs>
              <linearGradient id="wave-gradient" x1="0" y1="0" x2="1200" y2="400" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60A5FA" stopOpacity="0.4" />
                <stop offset="0.5" stopColor="#818CF8" stopOpacity="0.3" />
                <stop offset="1" stopColor="#C084FC" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* TOP BAR - Logo on Top Left */}
        <div className="relative z-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            {/* P Icon Badge */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-900/10 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4H14C16.7614 4 19 6.23858 19 9C19 11.7614 16.7614 14 14 14H11V20H7V4Z" fill="url(#p-icon-grad)" />
                  <circle cx="14" cy="9" r="2" fill="#38BDF8" />
                  <path d="M7 4H12C14.2091 4 16 5.79086 16 8C16 10.2091 14.2091 12 12 12H7V4Z" fill="white" fillOpacity="0.3" />
                  <defs>
                    <linearGradient id="p-icon-grad" x1="7" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ffffff" />
                      <stop offset="1" stopColor="#E0F2FE" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight flex items-center font-sans">
              pixbee
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-0.5 mt-2" />
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-white/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/80 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Pixbe CRM Cloud v3.6</span>
          </div>
        </div>

        {/* MIDDLE SECTION - Left Graphic & Right Floating Form Card */}
        <div className="relative z-20 my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT SIDE - Futuristic Branding & Floating AI Prompts */}
          <div className="lg:col-span-6 space-y-6 pl-2 md:pl-4">
            
            {/* Floating Glass Chat Bubbles */}
            <div className="space-y-2.5 max-w-sm">
              <div className="bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl p-2.5 px-3.5 shadow-sm text-slate-700 text-xs font-medium flex items-center space-x-2.5 transform -rotate-1 hover:rotate-0 transition-transform">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span>Find your future clients</span>
              </div>

              <div className="bg-white/80 backdrop-blur-md border border-white/90 rounded-2xl p-2.5 px-3.5 shadow-sm text-slate-700 text-xs font-medium flex items-center space-x-2.5 translate-x-4 hover:translate-x-3 transition-transform">
                <span>Give me just one second, okay?</span>
              </div>

              <div className="bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl p-2.5 px-3.5 shadow-sm text-slate-700 text-xs font-medium flex items-center space-x-2.5 transform rotate-1 hover:rotate-0 transition-transform">
                <span>I'll need to verify your identity first, though.</span>
              </div>
            </div>

            {/* Branding Text */}
            <div className="pt-2">
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none my-1 font-sans">
                pixbee
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-md font-medium">
              Next-generation Intelligent CRM & TeleSales Suite. Real-time Lead Automation, Power Dialer & Meta CAPI Integration.
            </p>
          </div>

          {/* RIGHT SIDE - Floating White Form Card */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-white rounded-3xl shadow-xl shadow-blue-900/10 p-6 md:p-8 space-y-5">
              
              {/* Form Title & Tabs */}
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Log in to Pixbe Account
                </h3>
                <div className="flex items-center space-x-4 mt-3 border-b border-slate-100 pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('credentials')}
                    className={`text-xs font-bold pb-1 transition-all cursor-pointer relative ${
                      activeTab === 'credentials'
                        ? 'text-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Email Login
                    {activeTab === 'credentials' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('quick')}
                    className={`text-xs font-bold pb-1 transition-all cursor-pointer relative ${
                      activeTab === 'quick'
                        ? 'text-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Quick Demo Presets
                    {activeTab === 'quick' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-xs font-medium flex items-start space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {activeTab === 'credentials' ? (
                /* Standard Credentials Login Form */
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email (e.g. admin@kiteaviation)"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Policy Agreement Checkbox */}
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAgreedToTerms(!agreedToTerms)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        agreedToTerms
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {agreedToTerms && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span className="text-[11px] text-slate-500 font-medium">
                      I have read and agree to the{' '}
                      <span className="text-blue-600 hover:underline cursor-pointer">User Agreement</span> and{' '}
                      <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
                    </span>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Log In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Quick One-Click Demo Accounts */
                <div className="space-y-3 pt-1">
                  <div className="text-xs text-slate-500 font-medium mb-2">
                    Select a preset role to log in instantly without typing credentials:
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickPreset('admin@kiteaviation', 'admin')}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                          Log In as Master Admin
                        </div>
                        <div className="text-[10px] text-blue-700/80 font-medium">
                          admin@kiteaviation • password: admin
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-600 text-white uppercase">
                      Admin
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickPreset('employee@kiteaviation', 'employee')}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-slate-800">
                          Log In as Employee / Telecaller
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          employee@kiteaviation • password: employee
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700 uppercase">
                      Staff
                    </span>
                  </button>
                </div>
              )}

              {/* Bottom Registration Link */}
              <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (onSwitchToSignUp) onSwitchToSignUp();
                  }}
                  className="text-sky-500 hover:text-sky-600 font-bold bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  Create Company Account (Sign Up)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className="text-slate-500 font-medium hover:text-slate-800 hover:underline cursor-pointer"
                >
                  Quick Demo Access
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT Action Icon */}
        <div className="relative z-20 flex justify-end">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'credentials' ? 'quick' : 'credentials')}
            title="Toggle Quick Mode"
            className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md border border-white text-slate-600 hover:text-blue-600 flex items-center justify-center shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

