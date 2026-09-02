import React, { useState, useEffect } from 'react';
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
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Briefcase, 
  Share2, 
  Building,
  GraduationCap,
  Landmark,
  HeartPulse,
  Laptop,
  ShoppingBag,
  Plane,
  Compass,
  Search,
  Users,
  Tv,
  Megaphone,
  X,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Agent, RegisterPayload } from '../types';
import { registerClientAccount, sendVerificationOtp, verifyRegistrationOtp } from '../lib/auth';

interface SignUpViewProps {
  onSignUpSuccess: (user: Agent, tenantId?: string) => void;
  onSwitchToLogin: () => void;
}

const BUSINESS_TYPE_OPTIONS = [
  { id: 'Real Estate & Property', label: 'Real Estate & Property', icon: Building },
  { id: 'Education & EdTech', label: 'Education & EdTech', icon: GraduationCap },
  { id: 'Financial Services & Lending', label: 'Financial Services & Lending', icon: Landmark },
  { id: 'Healthcare & Clinics', label: 'Healthcare & Clinics', icon: HeartPulse },
  { id: 'IT, SaaS & Tech Services', label: 'IT, SaaS & Tech Services', icon: Laptop },
  { id: 'E-Commerce & Retail', label: 'E-Commerce & Retail', icon: ShoppingBag },
  { id: 'Travel, Visa & Immigration', label: 'Travel, Visa & Immigration', icon: Plane },
  { id: 'Agency & Consulting', label: 'Agency & Consulting', icon: Briefcase },
  { id: 'Other', label: 'Other Business Type', icon: Compass }
];

const REFERRAL_SOURCE_OPTIONS = [
  { id: 'Google Search', label: 'Google Search', icon: Search },
  { id: 'Social Media (LinkedIn/Meta)', label: 'Social Media (LinkedIn / Instagram / Meta)', icon: Share2 },
  { id: 'Friend or Colleague', label: 'Friend or Colleague Recommendation', icon: Users },
  { id: 'YouTube / Webinar', label: 'YouTube / Webinar / Podcast', icon: Tv },
  { id: 'Online Advertisement', label: 'Online Advertisement', icon: Megaphone },
  { id: 'Other', label: 'Other Referral Source', icon: Compass }
];

export const SignUpPage: React.FC<SignUpViewProps> = ({ onSignUpSuccess, onSwitchToLogin }) => {
  // Active Step State: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Page 1: Personal / Account Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Page 2: Company Details
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [companyDescription, setCompanyDescription] = useState('');

  // Page 3: Business Type
  const [businessType, setBusinessType] = useState('');
  const [businessTypeOther, setBusinessTypeOther] = useState('');

  // Page 4: Referral Source
  const [referralSource, setReferralSource] = useState('');
  const [referralSourceOther, setReferralSourceOther] = useState('');

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoOtpCode, setDemoOtpCode] = useState<string | undefined>(undefined);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Error handling
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Email validation helper
  const isEmailValid = (val: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim());
  };

  // Step Validation Helper
  const validateCurrentStep = (step: number): boolean => {
    setErrorMessage(null);

    if (step === 1) {
      if (!name.trim() || name.trim().length < 2) {
        setErrorMessage('Please enter your full name (minimum 2 characters).');
        return false;
      }
      const cleanedPhone = phone.replace(/[^0-9]/g, '');
      if (cleanedPhone.length !== 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return false;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return false;
      }
      if (!confirmPassword) {
        setErrorMessage('Please confirm your password.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please ensure both passwords match.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!companyName.trim() || companyName.trim().length < 2) {
        setErrorMessage('Please enter your company or business name.');
        return false;
      }
      if (!email.trim() || !isEmailValid(email)) {
        setErrorMessage('Please enter a valid official work email address (e.g. name@company.com).');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!businessType) {
        setErrorMessage('Please select what type of business you are in, or choose "Other".');
        return false;
      }
      if (businessType === 'Other' && !businessTypeOther.trim()) {
        setErrorMessage('Please describe your business type in the text area provided.');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!referralSource) {
        setErrorMessage('Please select where you heard about Pixbe CRM / TeleCRM.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep(currentStep)) {
      setErrorMessage(null);
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Step 4: Dispatch OTP and open Verification Component
  const handleInitiateOtpVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateCurrentStep(4)) return;

    setIsSendingOtp(true);
    setErrorMessage(null);
    setOtpError(null);

    const targetEmail = email.trim().toLowerCase();
    const targetPhone = phone.trim();

    try {
      const otpResult = await sendVerificationOtp(targetEmail, targetPhone);
      setIsSendingOtp(false);

      if (otpResult.success) {
        setDemoOtpCode(otpResult.demoOtp);
        setOtpCode('');
        setShowOtpModal(true);
        setResendTimer(30);
      } else {
        setErrorMessage(otpResult.error || 'Failed to dispatch verification code. Please check your contact details.');
      }
    } catch (err: any) {
      setIsSendingOtp(false);
      setErrorMessage(err.message || 'Error communicating with verification service.');
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setOtpError(null);
    const targetEmail = email.trim().toLowerCase();
    const targetPhone = phone.trim();

    const otpResult = await sendVerificationOtp(targetEmail, targetPhone);
    if (otpResult.success) {
      setDemoOtpCode(otpResult.demoOtp);
      setResendTimer(30);
    } else {
      setOtpError(otpResult.error || 'Failed to resend verification code.');
    }
  };

  // Verify OTP and Complete Account Creation
  const handleVerifyOtpAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    const targetEmail = email.trim().toLowerCase();
    const targetPhone = phone.trim();

    const verifyRes = await verifyRegistrationOtp(targetEmail, targetPhone, cleanOtp);
    if (!verifyRes.success) {
      setIsVerifyingOtp(false);
      setOtpError(verifyRes.error || 'Invalid verification code. Please check and try again.');
      return;
    }

    // OTP verified successfully -> Provision account
    const payload: RegisterPayload = {
      name: name.trim(),
      email: targetEmail,
      phone: targetPhone,
      companyName: companyName.trim(),
      password,
      companyDescription: companyDescription.trim(),
      businessType,
      businessTypeOther: businessTypeOther.trim(),
      referralSource,
      referralSourceOther: referralSourceOther.trim()
    };

    try {
      const result = await registerClientAccount(payload);
      setIsVerifyingOtp(false);

      if (result.success && result.user) {
        setShowOtpModal(false);
        onSignUpSuccess(result.user, result.tenantId);
      } else {
        setOtpError(result.error || 'Failed to finalize account setup. Please try again.');
      }
    } catch (err: any) {
      setIsVerifyingOtp(false);
      setOtpError(err.message || 'An unexpected error occurred during account creation.');
    }
  };

  // Step Context Content for the Left Blue Panel (without any sparkle badges)
  const stepContextMap = [
    {
      step: 1,
      title: 'Administrator Identity',
      desc: 'Set up your primary credentials as workspace owner. You will have full access to team permissions, pipelines, and dialer tools.'
    },
    {
      step: 2,
      title: 'Organization Profile',
      desc: 'Provision a dedicated multi-tenant database collection for your company. All team members and lead data remain completely private.'
    },
    {
      step: 3,
      title: 'Business Architecture',
      desc: 'Tell us your industry so TeleCRM can pre-populate recommended sales stages, auto-dialer queues, and automation templates.'
    },
    {
      step: 4,
      title: 'Discovery & Verification',
      desc: 'You are one step away from launching your intelligent tele-sales automation workspace. Verify your contact details to proceed.'
    }
  ];

  const activeContext = stepContextMap[currentStep - 1];

  return (
    <div className="min-h-screen w-full bg-[#d6e3f0] flex items-center justify-center p-3 md:p-6 lg:p-10 font-sans select-none antialiased">
      {/* Outer Split-Screen Card Container */}
      <div className="w-full max-w-[1080px] min-h-[620px] bg-white rounded-[32px] md:rounded-[40px] shadow-[0_20px_50px_rgba(0,40,120,0.14)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">
        
        {/* ================= LEFT SIDE (VIBRANT ROYAL BLUE BRAND PANEL) ================= */}
        <div className="lg:col-span-5 relative bg-gradient-to-br from-[#005cee] to-[#0048cb] p-8 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden text-white min-h-[300px] lg:min-h-full">
          
          {/* Subtle Concentric Decorative Wave Arcs (Exact match to theme) */}
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

          {/* Top Brand Header */}
          <div className="relative z-10 pt-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              TeleCRM
            </h1>
            <p className="text-blue-100/80 text-xs font-semibold uppercase tracking-wider mt-1">
              By Pixbe Cloud Suite
            </p>
          </div>

          {/* Clean Guidance for Current Step (Badges removed) */}
          <div className="relative z-10 my-auto py-6 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activeContext.title}
            </h2>

            <p className="text-blue-100/90 text-xs sm:text-sm font-normal leading-relaxed max-w-sm">
              {activeContext.desc}
            </p>

            {/* Visual Step Indicator Dots */}
            <div className="flex items-center space-x-2 pt-3">
              {[1, 2, 3, 4].map((stepNum) => (
                <div 
                  key={stepNum}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    stepNum === currentStep 
                      ? 'w-8 bg-white' 
                      : stepNum < currentStep 
                        ? 'w-4 bg-sky-300/80' 
                        : 'w-2.5 bg-white/25'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="relative z-10 text-[11px] text-blue-200/70 font-medium">
            © {new Date().getFullYear()} Pixbe Cloud Suite. All rights reserved.
          </div>
        </div>

        {/* ================= RIGHT SIDE (MULTI-STEP FORM PANEL) ================= */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-y-auto max-h-[92vh] lg:max-h-none">
          
          <div className="w-full max-w-[460px] mx-auto">
            
            {/* Top Stepper Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
                <span className="text-blue-600 font-extrabold">Step {currentStep} of 4</span>
                <span className="text-gray-400">
                  {currentStep === 1 && 'Account Setup'}
                  {currentStep === 2 && 'Company Identity'}
                  {currentStep === 3 && 'Industry Type'}
                  {currentStep === 4 && 'Discovery & Verification'}
                </span>
              </div>
              
              {/* Stepper Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#0066f6] h-full rounded-full transition-all duration-400 ease-out"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ================= PAGE 1: NAME, PHONE (MAX 10 DIGITS), PASSWORD ================= */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-2">
                  <h3 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                    Admin Profile
                  </h3>
                  <p className="text-gray-500 text-xs font-normal mt-0.5">
                    Enter your personal contact details to create your admin account.
                  </p>
                </div>

                {/* Full Name Input */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1 ml-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-11 pr-4 py-3.5 rounded-full border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-normal bg-white"
                    />
                  </div>
                </div>

                {/* Phone Number Input (STRICTLY MAXIMUM 10 DIGITS) */}
                <div>
                  <div className="flex items-center justify-between mb-1 ml-1">
                    <label className="text-gray-700 text-xs font-semibold">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-medium text-gray-400">
                      {phone.length}/10 digits
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        // Strictly allow maximum 10 numeric digits only
                        const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                        setPhone(digits);
                      }}
                      placeholder="10-digit mobile number (e.g. 9845011223)"
                      className="w-full pl-11 pr-4 py-3.5 rounded-full border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-normal bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 ml-2">
                    Must be exactly 10 digits. Used for OTP verification and caller ID.
                  </p>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1 ml-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-11 pr-11 py-3.5 rounded-full border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-normal bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1 ml-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className={`w-full pl-11 pr-11 py-3.5 rounded-full border text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all font-normal bg-white ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                          : confirmPassword && password === confirmPassword
                          ? 'border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] text-rose-500 mt-1 ml-2 font-medium flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Passwords do not match</span>
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-[11px] text-emerald-600 mt-1 ml-2 font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Passwords match</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ================= PAGE 2: COMPANY NAME, OFFICIAL EMAIL (STRICT VALIDATION), DESCRIPTION ================= */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-2">
                  <h3 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                    Company Information
                  </h3>
                  <p className="text-gray-500 text-xs font-normal mt-0.5">
                    Provide your official organization profile to configure your database tenant.
                  </p>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1 ml-1">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corporation"
                      className="w-full pl-11 pr-4 py-3.5 rounded-full border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-normal bg-white"
                    />
                  </div>
                </div>

                {/* Official Work Email with Strict Validation */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1 ml-1">
                    Official Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onBlur={() => setEmailTouched(true)}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (!emailTouched) setEmailTouched(true);
                      }}
                      placeholder="e.g. admin@acme.com"
                      className={`w-full pl-11 pr-4 py-3.5 rounded-full border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all font-normal bg-white ${
                        emailTouched && email.trim() && !isEmailValid(email)
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                    />
                  </div>
                  {emailTouched && email.trim() && !isEmailValid(email) ? (
                    <p className="text-[11px] text-rose-500 font-medium mt-1 ml-2">
                      Please enter a valid official email address (e.g. name@domain.com)
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-400 mt-1 ml-2">
                      Verification code and login credentials will be linked to this email
                    </p>
                  )}
                </div>

                {/* Company Description */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1 ml-1">
                    Company Description
                  </label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      placeholder="Brief overview of your services, sales operations, or team size..."
                      className="w-full p-3.5 rounded-2xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-normal bg-white resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= PAGE 3: WHAT TYPE OF BUSINESS ARE YOU IN ================= */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-2">
                  <h3 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                    What Type of Business Are You In?
                  </h3>
                  <p className="text-gray-500 text-xs font-normal mt-0.5">
                    Select your primary industry to unlock tailored pipeline stages and automation rules.
                  </p>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {BUSINESS_TYPE_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = businessType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setBusinessType(opt.id);
                          setErrorMessage(null);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-blue-50/90 border-[#0066f6] ring-2 ring-blue-100 text-blue-900 shadow-xs'
                            : 'bg-white border-gray-200/90 hover:border-blue-200 text-gray-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                        </div>
                        <span className="text-xs font-semibold leading-snug">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Text Area for Other Options / Specific Details */}
                <div className="pt-1">
                  <label className="block text-gray-700 text-xs font-semibold mb-1 ml-1">
                    {businessType === 'Other' 
                      ? 'Please specify your business type / sector *' 
                      : 'Additional details or specific business model (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={businessTypeOther}
                    onChange={(e) => setBusinessTypeOther(e.target.value)}
                    placeholder={
                      businessType === 'Other'
                        ? 'Describe your business operations, industry or vertical...'
                        : 'e.g. B2B tele-sales for enterprise coaching programs...'
                    }
                    className={`w-full p-3 rounded-2xl border text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-normal bg-white resize-none ${
                      businessType === 'Other' && !businessTypeOther.trim()
                        ? 'border-amber-300'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* ================= PAGE 4: WHERE DID YOU HEAR ABOUT US ================= */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-2">
                  <h3 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                    Where Did You Hear About Us?
                  </h3>
                  <p className="text-gray-500 text-xs font-normal mt-0.5">
                    Help us know how you discovered TeleCRM & Pixbe Cloud.
                  </p>
                </div>

                {/* Referral Source Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {REFERRAL_SOURCE_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = referralSource === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setReferralSource(opt.id);
                          setErrorMessage(null);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-3 ${
                          isSelected
                            ? 'bg-blue-50/90 border-[#0066f6] ring-2 ring-blue-100 text-blue-900 shadow-xs'
                            : 'bg-white border-gray-200 hover:border-blue-200 text-gray-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold leading-snug flex-1">
                          {opt.label}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Text Area for Additional Referral Details */}
                <div className="pt-1">
                  <label className="block text-gray-700 text-xs font-semibold mb-1 ml-1">
                    Referral notes or promo code (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={referralSourceOther}
                    onChange={(e) => setReferralSourceOther(e.target.value)}
                    placeholder="e.g. Recommended by colleague / LinkedIn post..."
                    className="w-full p-3 rounded-2xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-normal bg-white resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ================= BOTTOM NAVIGATION (PREVIOUS & NEXT / VERIFY OTP) ================= */}
          <div className="w-full max-w-[460px] mx-auto pt-6 mt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center space-x-3">
              {/* Previous Button */}
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 px-5 rounded-full border border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 active:scale-[0.99]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              )}

              {/* Next / Submit Button (No Sparkles Icon Badge) */}
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-3.5 px-6 rounded-full bg-[#0066f6] hover:bg-[#0057df] text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center space-x-1.5 active:scale-[0.99]"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSendingOtp}
                  onClick={() => handleInitiateOtpVerification()}
                  className="flex-1 py-3.5 px-6 rounded-full bg-[#0066f6] hover:bg-[#0057df] text-white font-medium text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-60"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <span>Create Account & Verify</span>
                  )}
                </button>
              )}
            </div>

            {/* Switch to Login Link */}
            <div className="text-center pt-1">
              <span className="text-xs text-gray-500">Already have an account? </span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer ml-1"
              >
                Log In
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ================= OTP VERIFICATION MODAL COMPONENT ================= */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-gray-100 relative text-center space-y-4">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Icon */}
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[1.8]" />
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Enter Verification Code
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                A 6-digit verification code has been dispatched to{' '}
                <span className="font-semibold text-gray-800">+91 {phone}</span> and{' '}
                <span className="font-semibold text-gray-800">{email}</span>.
              </p>
            </div>

            {/* Demo Code Auto-fill Notice (for testing) */}
            {demoOtpCode && (
              <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between text-xs">
                <span className="text-blue-800 font-medium">Demo Code: <strong>{demoOtpCode}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpCode(demoOtpCode)}
                  className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Auto Fill
                </button>
              </div>
            )}

            {/* Error Message */}
            {otpError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-center space-x-1.5 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerifyOtpAndCreate} className="space-y-4 pt-1">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtpCode(val);
                  }}
                  placeholder="••••••"
                  className="w-full text-center font-mono font-bold text-2xl tracking-[0.5em] py-3.5 px-4 rounded-full border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-slate-50/50"
                />
              </div>

              {/* Submit Verification Button */}
              <button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="w-full py-3.5 rounded-full bg-[#0066f6] hover:bg-[#0057df] text-white font-medium text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify & Launch Workspace</span>
                )}
              </button>

              {/* Resend Code Button */}
              <div className="flex items-center justify-center space-x-2 pt-1 text-xs">
                <span className="text-gray-500">Didn't receive code?</span>
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={handleResendOtp}
                  className={`font-semibold transition-colors ${
                    resendTimer > 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:underline cursor-pointer'
                  }`}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export const SignUpView = SignUpPage;
export default SignUpPage;
