import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Lock, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Bot, 
  ArrowRight, 
  Check,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Agent, RegisterPayload } from '../types';
import { registerClientAccount, sendVerificationOtp, verifyRegistrationOtp } from '../lib/auth';

interface SignUpViewProps {
  onSignUpSuccess: (user: Agent, tenantId?: string) => void;
  onSwitchToLogin: () => void;
}

export const SignUpView: React.FC<SignUpViewProps> = ({ onSignUpSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2-Step Verification OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoOtpCode, setDemoOtpCode] = useState<string | undefined>(undefined);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMessage('Please agree to the User Agreement & Privacy Policy to proceed.');
      return;
    }
    setErrorMessage(null);

    const targetEmail = email.trim().toLowerCase();
    if (!name.trim() || !targetEmail || !companyName.trim()) {
      setErrorMessage('Please fill in all required fields (Name, Email, Phone, Company).');
      return;
    }

    setIsLoading(true);
    const otpResult = await sendVerificationOtp(targetEmail, phone.trim());
    setIsLoading(false);

    if (otpResult.success) {
      setDemoOtpCode(otpResult.demoOtp);
      setShowOtpModal(true);
    } else {
      setErrorMessage(otpResult.error || 'Failed to send SMS/Email verification code.');
    }
  };

  const handleVerifyOtpAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError('Please enter the valid 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    const verifyRes = await verifyRegistrationOtp(email.trim().toLowerCase(), phone.trim(), otpCode.trim());
    
    if (!verifyRes.success) {
      setIsVerifyingOtp(false);
      setOtpError(verifyRes.error || 'Invalid verification code. Please try again.');
      return;
    }

    const payload: RegisterPayload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      companyName: companyName.trim(),
      password,
    };

    const result = await registerClientAccount(payload);
    setIsVerifyingOtp(false);

    if (result.success && result.user) {
      setShowOtpModal(false);
      onSignUpSuccess(result.user, result.tenantId);
    } else {
      setOtpError(result.error || 'Failed to finalize account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100 flex items-center justify-center p-3 md:p-8 select-none relative overflow-hidden font-sans">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-400/15 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Main Glass Canvas Card */}
      <div className="w-full max-w-5xl h-auto min-h-[660px] bg-gradient-to-b from-sky-100/90 via-blue-50/85 to-indigo-100/90 backdrop-blur-2xl border border-white/60 rounded-[36px] shadow-2xl shadow-blue-900/30 p-6 md:p-10 relative overflow-hidden flex flex-col justify-between">
        
        {/* Background Wave Vector */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="absolute -bottom-10 left-0 w-full h-[380px] opacity-40" viewBox="0 0 1200 400" fill="none">
            <path d="M0 250C300 150 600 350 900 200C1050 125 1150 180 1200 200V400H0V250Z" fill="url(#signup-wave-gradient)" />
            <defs>
              <linearGradient id="signup-wave-gradient" x1="0" y1="0" x2="1200" y2="400" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60A5FA" stopOpacity="0.4" />
                <stop offset="0.5" stopColor="#818CF8" stopOpacity="0.3" />
                <stop offset="1" stopColor="#C084FC" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* TOP BAR - Logo */}
        <div className="relative z-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={onSwitchToLogin}>
            {/* Logo Badge */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-900/10 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4H14C16.7614 4 19 6.23858 19 9C19 11.7614 16.7614 14 14 14H11V20H7V4Z" fill="url(#p-signup-icon-grad)" />
                  <circle cx="14" cy="9" r="2" fill="#38BDF8" />
                  <path d="M7 4H12C14.2091 4 16 5.79086 16 8C16 10.2091 14.2091 12 12 12H7V4Z" fill="white" fillOpacity="0.3" />
                  <defs>
                    <linearGradient id="p-signup-icon-grad" x1="7" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
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
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Multi-Tenant Enterprise Provisioning</span>
          </div>
        </div>

        {/* MIDDLE SECTION */}
        <div className="relative z-20 my-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT SIDE - Branding & Benefits */}
          <div className="lg:col-span-5 space-y-5 pl-2 md:pl-4">
            
            {/* Floating Info Cards */}
            <div className="space-y-2.5 max-w-sm">
              <div className="bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl p-2.5 px-3.5 shadow-sm text-slate-700 text-xs font-medium flex items-center space-x-2.5 transform -rotate-1">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>Isolated Client Database Namespace</span>
              </div>

              <div className="bg-white/80 backdrop-blur-md border border-white/90 rounded-2xl p-2.5 px-3.5 shadow-sm text-slate-700 text-xs font-medium flex items-center space-x-2.5 translate-x-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span>Pre-configured AI Automations & Meta API</span>
              </div>
            </div>

            {/* Title */}
            <div className="pt-2">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none my-1 font-sans">
                Create Your Account
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-md font-medium">
              Provision a dedicated CRM workspace for your business. Manage leads, WhatsApp automation, call logs, and team permissions in one unified cloud system.
            </p>
          </div>

          {/* RIGHT SIDE - Registration Form */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-white rounded-3xl shadow-xl shadow-blue-900/10 p-6 md:p-7 space-y-4">
              
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Register Company Workspace
                </h3>
                <p className="text-xs text-amber-600 font-semibold mt-1">
                  *This will be admin account
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-xs font-medium flex items-start space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-3">
                {/* Full Name & Phone Number Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Libin Johnson"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@yourcompany.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Company / Organization Name */}
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Kite Institute of Aviation"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                    I agree to the{' '}
                    <span className="text-blue-600 hover:underline cursor-pointer">User Agreement</span> and{' '}
                    <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switch Link */}
              <div className="text-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-blue-600 font-bold hover:underline cursor-pointer ml-1"
                  >
                    Log In
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM Footer Note */}
        <div className="relative z-20 flex justify-between items-center text-[11px] text-slate-500">
          <span>© 2026 Pixbe CRM. All rights reserved.</span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="hover:text-blue-600 font-semibold cursor-pointer"
          >
            ← Back to Login
          </button>
        </div>
      </div>

      {/* 2-STEP SMS & EMAIL OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-5 font-sans">
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">2-Step Verification Required</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                We sent a 6-digit verification code to <span className="font-semibold text-slate-900">{email}</span> and <span className="font-semibold text-slate-900">{phone}</span>.
              </p>
            </div>

            {demoOtpCode && (
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs text-center font-sans font-semibold">
                <span>🔐 Live Verification Code: </span>
                <span className="font-black text-indigo-700 tracking-widest text-sm ml-1">{demoOtpCode}</span>
              </div>
            )}

            {otpError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndCreate} className="space-y-4">
              <div>
                <label className="block text-slate-600 text-xs font-semibold mb-1 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] text-lg font-bold py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code & Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code & Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={async () => {
                  setOtpError(null);
                  const res = await sendVerificationOtp(email, phone);
                  if (res.demoOtp) setDemoOtpCode(res.demoOtp);
                }}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel / Edit Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
