import React, { useState } from 'react';
import { 
  X, 
  CheckSquare, 
  Users, 
  Tag, 
  SlidersHorizontal, 
  Layers, 
  Check, 
  AlertTriangle,
  Trash2,
  PhoneCall
} from 'lucide-react';
import { Lead, LeadStatus, LeadSource, Agent } from '../types';

interface BulkEditModalProps {
  selectedLeadIds: string[];
  totalSelectedCount: number;
  agents: Agent[];
  onApplyBulkUpdates: (updates: {
    status?: LeadStatus;
    ownerAgentId?: string;
    ownerAgentName?: string;
    addTag?: string;
    source?: LeadSource;
  }) => void;
  onBulkDelete: () => void;
  onClose: () => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  selectedLeadIds,
  totalSelectedCount,
  agents,
  onApplyBulkUpdates,
  onBulkDelete,
  onClose
}) => {
  const [updateStatus, setUpdateStatus] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<LeadStatus>('Contacted');

  const [updateAgent, setUpdateAgent] = useState<boolean>(false);
  const [targetAgentId, setTargetAgentId] = useState<string>(agents[0]?.id || '');

  const [updateTag, setUpdateTag] = useState<boolean>(false);
  const [targetTag, setTargetTag] = useState<string>('');

  const [updateSource, setUpdateSource] = useState<boolean>(false);
  const [targetSource, setTargetSource] = useState<LeadSource>('Google Ads');

  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: any = {};
    if (updateStatus) updates.status = targetStatus;
    if (updateAgent) {
      updates.ownerAgentId = targetAgentId;
      const ag = agents.find(a => a.id === targetAgentId);
      if (ag) updates.ownerAgentName = ag.name;
    }
    if (updateTag && targetTag.trim()) updates.addTag = targetTag.trim();
    if (updateSource) updates.source = targetSource;

    onApplyBulkUpdates(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs font-sans">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Bulk Edit Leads</h3>
              <p className="text-xs text-slate-400">
                Updating <strong>{totalSelectedCount} selected leads</strong> simultaneously
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {/* Option 1: Update Lead Stage / Status */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span>Change Pipeline Stage / Status</span>
            </label>

            {updateStatus && (
              <div className="pl-6 animate-in fade-in">
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as LeadStatus)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  <option value="New Lead">New Lead / Fresh</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Demo Scheduled">Demo Scheduled</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Converted">Converted / Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
            )}
          </div>

          {/* Option 2: Reassign Owner Agent */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={updateAgent}
                onChange={(e) => setUpdateAgent(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span>Reassign Assigned Telecaller / Agent</span>
            </label>

            {updateAgent && (
              <div className="pl-6 animate-in fade-in">
                <select
                  value={targetAgentId}
                  onChange={(e) => setTargetAgentId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.role} • {ag.activeLeadsCount} leads)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Option 3: Add Tag */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={updateTag}
                onChange={(e) => setUpdateTag(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span>Add Campaign Tag</span>
            </label>

            {updateTag && (
              <div className="pl-6 animate-in fade-in">
                <input
                  type="text"
                  value={targetTag}
                  onChange={(e) => setTargetTag(e.target.value)}
                  placeholder="e.g. Q3 Webinar, Urgent Followup, VIP"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            )}
          </div>

          {/* Danger Zone: Bulk Delete */}
          <div className="pt-2">
            {!isConfirmingDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete {totalSelectedCount} selected leads</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs animate-in fade-in">
                <span className="text-rose-800 font-bold">Are you sure? This cannot be undone.</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2.5 py-1 rounded-md bg-white border border-rose-200 text-slate-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onBulkDelete();
                      onClose();
                    }}
                    className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!updateStatus && !updateAgent && !updateTag && !updateSource}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-40 transition-all"
            >
              Apply Updates ({totalSelectedCount})
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
