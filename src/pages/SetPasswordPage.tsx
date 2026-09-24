import React, { useMemo, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { confirmPasswordChangeWithCode } from '../lib/auth';

interface SetPasswordPageProps {
  onDone?: () => void;
}

function readQueryParams() {
  if (typeof window === 'undefined') return { email: '', code: '' };
  const params = new URLSearchParams(window.location.search);
  return {
    email: (params.get('email') || '').trim().toLowerCase(),
    code: (params.get('code') || '').trim()
  };
}

export const SetPasswordPage: React.FC<SetPasswordPageProps> = ({ onDone }) => {
  const initial = useMemo(() => readQueryParams(), []);
  const [email, setEmail] = useState(initial.email);
  const [code, setCode] = useState(initial.code);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Email is required.');
      return;
    }
    if (!code.trim()) {
      setErrorMessage('Confirmation code from your email is required.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const result = await confirmPasswordChangeWithCode({
      email,
      code,
      newPassword
    });
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Password updated. You can sign in with your new password.');
      setNewPassword('');
      setConfirmPassword('');
      return;
    }
    setErrorMessage(result.error || 'Failed to update password.');
  };

  return (
    <div className="min-h-screen w-full bg-[#d6e3f0] flex items-center justify-center p-4 md:p-8 font-sans antialiased">
      <div className="w-full max-w-md bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,40,120,0.14)] p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-[#005cee]" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">Set new password</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Use the confirmation from your admin email to choose a new password.
        </p>

        {successMessage ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-3 text-sm text-emerald-800">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onDone) onDone();
                else if (typeof window !== 'undefined') window.location.href = '/login';
              }}
              className="w-full h-11 rounded-full bg-[#005cee] text-white font-semibold text-sm hover:bg-[#0048cb] transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-3 text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#005cee]"
                  placeholder="admin@company.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirmation code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#005cee] tracking-widest"
                placeholder="Code from email"
                autoComplete="one-time-code"
                required
              />
              {!initial.code && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Paste the code from your email if the link did not include it.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#005cee]"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm new password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#005cee]"
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-full bg-[#005cee] text-white font-semibold text-sm hover:bg-[#0048cb] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating…
                </>
              ) : (
                'Update password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SetPasswordPage;
