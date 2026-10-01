import React, { useState, useEffect } from 'react';
import { Ban, Zap } from 'lucide-react';
import { fetchWithTenantAuth, readApiJson } from '../lib/auth';

interface ApiToken {
  id: string;
  name: string;
  recapturePreference: string;
  apiType: string;
  createdAt: string;
  createdBy?: string;
}

interface ApiTokensTableProps {
  onOpenCreate: () => void;
  onEditToken: (token: ApiToken) => void;
  refreshTrigger: number;
}

export const ApiTokensTable: React.FC<ApiTokensTableProps> = ({ onOpenCreate, onEditToken, refreshTrigger }) => {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithTenantAuth('/api/workspace/api-tokens');
      const data = await readApiJson<{ success: boolean; tokens: ApiToken[] }>(res);
      if (data.success && data.tokens) {
        setTokens(data.tokens);
      } else {
        setError('Failed to load tokens.');
      }
    } catch (err) {
      setError('Error loading tokens.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [refreshTrigger]);

  const handleRevoke = async (tokenId: string) => {
    if (!window.confirm('Are you sure you want to revoke this token? This cannot be undone.')) return;
    try {
      const res = await fetchWithTenantAuth(`/api/workspace/api-tokens/${tokenId}`, { method: 'DELETE' });
      const data = await readApiJson(res);
      if (data.success) {
        fetchTokens();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const maxTokens = 6;
  const isLimitReached = tokens.length >= maxTokens;

  return (
    <div className="mt-6 w-full font-sans select-none animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">
          Access Tokens ({tokens.length}/{maxTokens})
        </h3>
        <button
          onClick={onOpenCreate}
          disabled={isLimitReached}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
            isLimitReached 
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
              : 'bg-[#5b38d3] hover:bg-[#4a2eb3] text-white cursor-pointer'
          }`}
        >
          + Create new token
        </button>
      </div>

      <div className="w-full rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {isLoading && tokens.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">Loading tokens...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-500 font-medium">{error}</div>
        ) : tokens.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">No tokens created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcfcff] border-b border-slate-100">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 w-[30%]">Token Details</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">Created by</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">Recapture Preferences</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Token Details */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#f9f5ff] text-[#5b38d3] flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 fill-current" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-[13px] font-bold text-slate-900 truncate">{token.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">Created {formatDate(token.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Created by */}
                    <td className="px-5 py-4">
                      <span className="text-[13px] font-medium text-slate-700">{token.createdBy || 'Unknown User'}</span>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#5b38d3]/30 bg-white">
                        <Zap className="w-3.5 h-3.5 text-[#5b38d3] fill-current" />
                        <span className="text-[11px] font-bold text-[#5b38d3] capitalize">{token.apiType}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full border border-emerald-200 bg-white">
                        <span className="text-[11px] font-bold text-emerald-600">Active</span>
                      </div>
                    </td>

                    {/* Recapture Preferences */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-slate-800">{token.recapturePreference}</span>
                        <svg onClick={() => onEditToken(token)} className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleRevoke(token.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">Revoke</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
