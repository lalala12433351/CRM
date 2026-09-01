import React, { useState } from 'react';
import { X, Building2, User, Mail, Phone, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { PlanTier } from '../types/superAdmin';

interface ProvisionTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTenant: any) => void;
}

export function ProvisionTenantModal({ isOpen, onClose, onSuccess }: ProvisionTenantModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('+91 ');
  const [businessType, setBusinessType] = useState('Education / EdTech');
  const [planTier, setPlanTier] = useState<PlanTier>('Growth');
  const [currency, setCurrency] = useState('INR');
  const [autoDialer, setAutoDialer] = useState(true);
  const [whatsappCrm, setWhatsappCrm] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !ownerName.trim() || !ownerEmail.trim()) {
      setErrorMsg('Please fill in Company Name, Admin Name, and Email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          ownerName: ownerName.trim(),
          ownerEmail: ownerEmail.trim().toLowerCase(),
          ownerPhone: ownerPhone.trim(),
          businessType,
          planTier,
          currency,
          autoDialer,
          whatsappCrm
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to provision tenant');
      }

      onSuccess(data.tenant);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error provisioning tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-poppins">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Provision New Tenant</h2>
              <p className="text-xs text-slate-500">Create a dedicated company workspace & master admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Logistics"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Industry / Category</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Education / EdTech">Education / EdTech</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Healthcare & Wellness">Healthcare & Wellness</option>
                <option value="Finance & Insurance">Finance & Insurance</option>
                <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                <option value="Travel & Hospitality">Travel & Hospitality</option>
                <option value="Logistics & Transport">Logistics & Transport</option>
                <option value="IT Services & SaaS">IT Services & SaaS</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@apexlogistics.in"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="AED">AED (AED) - UAE Dirham</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>
          </div>

          {/* Plan Tier Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Initial Subscription Tier</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'Starter', name: 'Starter', price: '₹1,999/mo', seats: '3 Agents' },
                { id: 'Growth', name: 'Growth', price: '₹4,999/mo', seats: '10 Agents' },
                { id: 'Enterprise', name: 'Enterprise', price: '₹14,999/mo', seats: '50 Agents' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPlanTier(p.id as PlanTier)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    planTier === p.id
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-sm'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                    {planTier === p.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 mt-1">{p.price}</div>
                  <div className="text-[10px] text-slate-500">{p.seats}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Features Toggles */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Enabled Platform Modules</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDialer}
                  onChange={(e) => setAutoDialer(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Auto Dialer & Audio Logs</span>
              </label>
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappCrm}
                  onChange={(e) => setWhatsappCrm(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>WhatsApp Cloud API</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Provisioning...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Create Tenant Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
