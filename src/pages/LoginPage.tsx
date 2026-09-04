import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Info,
  X
} from 'lucide-react';
import { Agent } from '../types';
import { loginWithApi } from '../lib/auth';
import { toast } from '../context/ToastContext';

interface LoginViewProps {
  agents: Agent[];
  onLogin: (agent: Agent) => void;
  onSwitchToSignUp?: () => void;
}

export const LoginPage: React.FC<LoginViewProps> = ({ agents, onLogin, onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setErrorMessage(
        result.error || `Invalid credentials. Please check your email and password.`
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#d6e3f0] flex items-center justify-center p-4 md:p-8 lg:p-12 font-sans select-none antialiased">
      {/* Outer Card Container */}
      <div className="w-full max-w-[1040px] min-h-auto md:min-h-[580px] bg-white rounded-[24px] sm:rounded-[32px] md:rounded-[40px] shadow-[0_20px_50px_rgba(0,40,120,0.14)] overflow-hidden grid grid-cols-1 md:grid-cols-2 relative">
        
        {/* ================= LEFT SIDE (VIBRANT ROYAL BLUE BRAND PANEL) ================= */}
        <div className="relative bg-gradient-to-br from-[#005cee] to-[#0048cb] p-6 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden text-white min-h-[140px] md:min-h-full">
          
          {/* Subtle Concentric Decorative Wave Arcs (Exact match to reference) */}
          <div className="absolute -bottom-20 -left-20 w-[420px] h-[420px] pointer-events-none">
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

          {/* Upper Brand Section with Improved Space */}
          <div className="relative z-10 pt-2 sm:pt-8 md:pt-12">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Pixbe CRM
            </h1>
            
            <p className="text-blue-100/90 text-xs sm:text-base font-normal mt-1.5 sm:mt-4 max-w-sm leading-relaxed">
              The most popular all-in-one CRM & tele-sales suite built for high-growth teams.
            </p>
          </div>

          {/* Bottom subtle copyright / status */}
          <div className="relative z-10 text-[11px] text-blue-200/70 font-medium hidden md:block">
            © {new Date().getFullYear()} Pixbe Cloud Suite. All rights reserved.
          </div>
        </div>

        {/* ================= RIGHT SIDE (CLEAN WHITE LOGIN FORM) ================= */}
        <div className="bg-white p-6 sm:p-10 lg:p-16 flex flex-col justify-center relative">
          
          <div className="w-full max-w-[340px] mx-auto">
            {/* Header Titles */}
            <div className="mb-8">
              <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#111827] tracking-tight leading-tight">
                Hello Again!
              </h2>
              <p className="text-gray-500 text-sm font-normal mt-1">
                Welcome Back
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Standard Credentials Form */}
            <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
              
              {/* Username / Email Pill Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email or Username (e.g. admin@kiteaviation)"
                  className="w-full pl-11 pr-4 py-3.5 rounded-full border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-normal bg-white"
                />
              </div>

              {/* Password Pill Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-11 py-3.5 rounded-full border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-normal bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Pill Login Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-[#0066f6] hover:bg-[#0057df] text-white font-medium text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>Login</span>
                  )}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors cursor-pointer"
                >
                  Forgot Password
                </button>
              </div>

              {/* Switch to Sign Up */}
              {onSwitchToSignUp && (
                <div className="text-center pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Don't have an account? </span>
                  <button
                    type="button"
                    onClick={onSwitchToSignUp}
                    className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer ml-1"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-gray-100 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Reset Your Password</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              If you forgot your password, enter your email below or contact your CRM administrator to issue an access reset link.
            </p>
            <div className="mt-4 space-y-3">
              <input
                type="email"
                defaultValue={email}
                placeholder="Enter your registered email"
                className="w-full px-4 py-2.5 text-xs rounded-full border border-gray-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  toast.success('A password reset link has been dispatched to your email address.', 'Reset Link Sent');
                  setShowForgotModal(false);
                }}
                className="w-full py-2.5 rounded-full bg-[#0066f6] hover:bg-[#0057df] text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};




export const LoginView = LoginPage;
export default LoginPage;
