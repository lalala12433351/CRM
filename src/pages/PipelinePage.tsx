import React, { useState } from 'react';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  GripVertical, 
  Check, 
  SlidersHorizontal,
  ArrowLeftRight
} from 'lucide-react';
import { PipelineStage, Lead } from '../types';
import { toast } from '../context/ToastContext';

interface PipelineViewProps {
  leads?: Lead[];
  stages?: PipelineStage[];
  onOpenLeadDetail?: (lead: Lead) => void;
  onUpdateStages?: (stages: PipelineStage[]) => void;
  [key: string]: any;
}

export interface LostReasonItem {
  id: string;
  reason: string;
  isDefault?: boolean;
}

export const STAGE_COLOR_PALETTE = [
  { label: 'Pink', bg: 'bg-pink-100/90 border-pink-200', text: 'text-slate-800', hex: '#fce7f3' },
  { label: 'Emerald', bg: 'bg-emerald-100/70 border-emerald-200', text: 'text-slate-800', hex: '#d1fae5' },
  { label: 'Green', bg: 'bg-green-100/90 border-green-200', text: 'text-slate-800', hex: '#dcfce7' },
  { label: 'Purple', bg: 'bg-purple-100/80 border-purple-200', text: 'text-slate-800', hex: '#f3e8ff' },
  { label: 'Blue', bg: 'bg-blue-100/80 border-blue-200', text: 'text-slate-800', hex: '#dbeafe' },
  { label: 'Indigo', bg: 'bg-indigo-100/80 border-indigo-200', text: 'text-slate-800', hex: '#e0e7ff' },
  { label: 'Cyan', bg: 'bg-cyan-100/80 border-cyan-200', text: 'text-slate-800', hex: '#cffafe' },
  { label: 'Teal', bg: 'bg-teal-100/70 border-teal-200', text: 'text-slate-800', hex: '#ccfbf1' },
  { label: 'Amber', bg: 'bg-amber-100/80 border-amber-200', text: 'text-slate-800', hex: '#fef3c7' },
  { label: 'Rose', bg: 'bg-rose-100/80 border-rose-200', text: 'text-slate-800', hex: '#ffe4e6' },
  { label: 'Slate', bg: 'bg-slate-200/80 border-slate-300', text: 'text-slate-800', hex: '#e2e8f0' },
];

export const PipelinePage: React.FC<PipelineViewProps> = () => {
  // Active stage list state matching screenshot default pastel palette
  const [activeStagesList, setActiveStagesList] = useState<{ id: string; name: string; bg: string; text: string }[]>([
    { id: 'st-rnr', name: 'RNR', bg: 'bg-pink-100/90 border-pink-200', text: 'text-slate-800' },
    { id: 'st-interested', name: 'Interested', bg: 'bg-emerald-100/70 border-emerald-200', text: 'text-slate-800' },
    { id: 'st-warm', name: 'Warm', bg: 'bg-green-100/90 border-green-200', text: 'text-slate-800' },
    { id: 'st-iata', name: 'IATA', bg: 'bg-purple-100/80 border-purple-200', text: 'text-slate-800' },
    { id: 'st-next-batch', name: 'Next Batch', bg: 'bg-stone-200/70 border-stone-300', text: 'text-slate-800' },
    { id: 'st-next-year', name: 'Next Year', bg: 'bg-blue-100/80 border-blue-200', text: 'text-slate-800' },
    { id: 'st-visit-sched', name: 'Visit Scheduled', bg: 'bg-indigo-100/80 border-indigo-200', text: 'text-slate-800' },
    { id: 'st-visited', name: 'Visited', bg: 'bg-purple-100/80 border-purple-200', text: 'text-slate-800' },
    { id: 'st-open', name: 'Open', bg: 'bg-cyan-100/80 border-cyan-200', text: 'text-slate-800' },
    { id: 'st-cpl', name: 'CPL', bg: 'bg-[#E5E7EB] border-slate-300', text: 'text-slate-800' },
    { id: 'st-any-course', name: 'Any other Course', bg: 'bg-teal-100/70 border-teal-200', text: 'text-slate-800' },
    { id: 'st-existing', name: 'Existing', bg: 'bg-emerald-100/60 border-emerald-200', text: 'text-slate-800' },
    { id: 'st-job-enquiry', name: 'Job enquiry', bg: 'bg-stone-200/80 border-stone-300', text: 'text-slate-800' },
  ]);

  // Lost reasons state matching screenshot
  const [lostReasons, setLostReasons] = useState<LostReasonItem[]>([
    { id: 'lr-1', reason: 'No Need' },
    { id: 'lr-2', reason: 'Unable to Connect' },
    { id: 'lr-3', reason: 'Budget Issues' },
    { id: 'lr-4', reason: 'Product does not fit need' },
    { id: 'lr-5', reason: 'Lost to competitor' },
    { id: 'lr-6', reason: 'Unknown Reason' },
    { id: 'lr-7', reason: 'Not eligible' },
    { id: 'lr-8', reason: 'Junk' },
  ]);

  // Modal / Inline Edit States
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editStageName, setEditStageName] = useState<string>('');
  const [editStageBg, setEditStageBg] = useState<string>('bg-pink-100/90 border-pink-200');
  
  const [showAddStageModal, setShowAddStageModal] = useState<boolean>(false);
  const [newStageName, setNewStageName] = useState<string>('');
  const [newStageBg, setNewStageBg] = useState<string>(STAGE_COLOR_PALETTE[0].bg);

  const [editingReasonId, setEditingReasonId] = useState<string | null>(null);
  const [editReasonText, setEditReasonText] = useState<string>('');

  const [showAddReasonModal, setShowAddReasonModal] = useState<boolean>(false);
  const [newReasonText, setNewReasonText] = useState<string>('');

  // Initial stage default name
  const [initialStageName, setInitialStageName] = useState('Fresh');
  const [editingInitial, setEditingInitial] = useState(false);

  // Won stage default name
  const [wonStageName, setWonStageName] = useState('Converted');
  const [editingWon, setEditingWon] = useState(false);

  // Lost stage default name
  const [lostStageName, setLostStageName] = useState('Lost');
  const [editingLost, setEditingLost] = useState(false);

  // Stage CRUD operations
  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const newStage = {
      id: `st-${Date.now()}`,
      name: newStageName.trim(),
      bg: newStageBg || STAGE_COLOR_PALETTE[0].bg,
      text: 'text-slate-800'
    };
    setActiveStagesList([...activeStagesList, newStage]);
    setNewStageName('');
    setShowAddStageModal(false);
  };

  const handleSaveStageEdit = (id: string) => {
    if (!editStageName.trim()) return;
    setActiveStagesList(activeStagesList.map(st => st.id === id ? { ...st, name: editStageName.trim(), bg: editStageBg } : st));
    setEditingStageId(null);
  };

  const handleChangeStageColor = (id: string, newBg: string) => {
    setActiveStagesList(activeStagesList.map(st => st.id === id ? { ...st, bg: newBg } : st));
  };

  const handleDeleteStage = (id: string) => {
    setActiveStagesList(activeStagesList.filter(st => st.id !== id));
  };

  // Lost Reason CRUD
  const handleAddLostReason = () => {
    if (!newReasonText.trim()) return;
    setLostReasons([...lostReasons, { id: `lr-${Date.now()}`, reason: newReasonText.trim() }]);
    setNewReasonText('');
    setShowAddReasonModal(false);
  };

  const handleSaveReasonEdit = (id: string) => {
    if (!editReasonText.trim()) return;
    setLostReasons(lostReasons.map(r => r.id === id ? { ...r, reason: editReasonText.trim() } : r));
    setEditingReasonId(null);
  };

  const handleDeleteReason = (id: string) => {
    setLostReasons(lostReasons.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-900 font-sans p-3 md:p-6 space-y-4">
      {/* View Switcher Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Lead stages</h1>
              <span className="text-xs text-slate-400 font-medium">|</span>
              <span className="text-xs text-slate-600 font-medium">Configure Your Sales Pipeline</span>
              <button 
                type="button"
                onClick={() => toast.info('Customize stage titles, reorder with up/down controls, set win/loss categories, and manage lost reasons.', 'Pipeline Guide')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1 cursor-pointer"
              >
                <span>How to use</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize initial, active, won and lost pipeline stages & configure standard reasons for lost leads.
            </p>
          </div>
        </div>
      </div>

      {/* Lead Stages Pipeline Configuration Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        
        {/* COLUMN 1: Initial stage */}
        <div className="space-y-2">
          {/* Chevron Badge Banner Header */}
          <div className="relative">
            <div className="bg-[#E5E7EB] text-slate-700 font-semibold text-center text-sm py-2 px-4 rounded-t-lg shadow-xs border border-slate-300 border-b-0 flex items-center justify-center">
              <span>Initial stage</span>
            </div>
          </div>

          {/* Container Box */}
          <div className="bg-white border border-slate-200/90 rounded-b-xl rounded-t-none p-3 shadow-sm min-h-[300px] space-y-3">
            {editingInitial ? (
              <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-lg border border-slate-300">
                <input
                  type="text"
                  value={initialStageName}
                  onChange={(e) => setInitialStageName(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                />
                <button onClick={() => setEditingInitial(false)} className="p-1 rounded bg-indigo-600 text-white">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="bg-[#E5E7EB]/80 border border-slate-300 rounded-lg p-2.5 flex items-center justify-between hover:border-slate-400 transition-all">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-800">{initialStageName}</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">Default</span>
                </div>
                <button
                  onClick={() => setEditingInitial(true)}
                  className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                  title="Edit initial stage name"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-slate-700">Initial Stage Behavior:</p>
              <p className="text-[11px]">
                New incoming leads from Facebook, IndiaMart, Website forms or API imports are automatically placed in this default stage.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Active stage */}
        <div className="space-y-2">
          {/* Header Banner */}
          <div className="relative">
            <div className="bg-[#D1FAE5] text-emerald-800 font-semibold text-center text-sm py-2 px-4 rounded-t-lg shadow-xs border border-emerald-300 border-b-0 flex items-center justify-center">
              <span>Active stage</span>
            </div>
          </div>

          {/* Container Box */}
          <div className="bg-white border border-slate-200/90 rounded-b-xl rounded-t-none p-3 shadow-sm min-h-[300px] space-y-2">
            {/* + Add Stage Button */}
            <button
              onClick={() => setShowAddStageModal(true)}
              className="w-full py-2 border border-dashed border-slate-300 hover:border-emerald-500 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            {/* List of Active Stages */}
            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
              {activeStagesList.map((stage) => (
                <div key={stage.id} className="relative">
                  {editingStageId === stage.id ? (
                    <div className="bg-white p-2.5 rounded-lg border-2 border-indigo-500 shadow-md space-y-2">
                      <input
                        type="text"
                        value={editStageName}
                        onChange={(e) => setEditStageName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                      />
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        {STAGE_COLOR_PALETTE.map((col) => (
                          <button
                            key={col.label}
                            type="button"
                            onClick={() => setEditStageBg(col.bg)}
                            className={`w-4 h-4 rounded-full border cursor-pointer transition-transform ${
                              editStageBg === col.bg ? 'ring-2 ring-indigo-600 scale-110 border-slate-900' : 'border-slate-300 hover:scale-110'
                            }`}
                            style={{ backgroundColor: col.hex }}
                            title={col.label}
                          />
                        ))}
                      </div>
                      <div className="flex justify-end space-x-1.5 pt-1">
                        <button
                          onClick={() => setEditingStageId(null)}
                          className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveStageEdit(stage.id)}
                          className="px-2.5 py-0.5 text-xs bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`${stage.bg} rounded-lg p-2 flex items-center justify-between border shadow-2xs group hover:brightness-95 transition-all`}>
                      <div className="flex items-center space-x-2">
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 cursor-grab" />
                        <span className="text-xs font-semibold text-slate-800">{stage.name}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        {/* Quick Color Palette Picker on Hover/Click */}
                        <div className="relative group/palette">
                          <button 
                            type="button" 
                            className="w-3.5 h-3.5 rounded-full border border-slate-400/80 cursor-pointer bg-white/60 hover:scale-110 transition-transform" 
                            title="Change Color"
                          />
                          <div className="hidden group-hover/palette:flex absolute right-0 top-full mt-1 bg-white p-1.5 rounded-lg shadow-xl border border-slate-200 z-50 items-center space-x-1">
                            {STAGE_COLOR_PALETTE.slice(0, 7).map((col) => (
                              <button
                                key={col.label}
                                type="button"
                                onClick={() => handleChangeStageColor(stage.id, col.bg)}
                                className="w-3.5 h-3.5 rounded-full border border-slate-300 hover:scale-125 transition-transform"
                                style={{ backgroundColor: col.hex }}
                                title={col.label}
                              />
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setEditingStageId(stage.id);
                            setEditStageName(stage.name);
                            setEditStageBg(stage.bg);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Edit Stage"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStage(stage.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Stage"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 3: Closed stage */}
        <div className="space-y-3">
          {/* Header Banner */}
          <div className="relative">
            <div className="bg-[#D1FAE5] text-emerald-800 font-semibold text-center text-sm py-2 px-4 rounded-t-lg shadow-xs border border-emerald-300 border-b-0 flex items-center justify-center">
              <span>Closed stage</span>
            </div>
          </div>

          {/* Sub-container Box */}
          <div className="bg-white border border-slate-200/90 rounded-b-xl rounded-t-none p-3 shadow-sm min-h-[300px] space-y-4">
            
            {/* WON Section */}
            <div className="border border-emerald-300 rounded-xl p-3 space-y-2 bg-emerald-50/20">
              <span className="text-[11px] font-bold text-emerald-700 tracking-wider">WON</span>
              
              {editingWon ? (
                <div className="flex items-center space-x-2 bg-emerald-100/50 p-2 rounded-lg border border-emerald-300">
                  <input
                    type="text"
                    value={wonStageName}
                    onChange={(e) => setWonStageName(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                  />
                  <button onClick={() => setEditingWon(false)} className="p-1 rounded bg-emerald-600 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-100/70 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">{wonStageName}</span>
                  <button
                    onClick={() => setEditingWon(true)}
                    className="p-1 text-slate-500 hover:text-emerald-800 cursor-pointer transition-colors"
                    title="Edit won stage name"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* LOST Section */}
            <div className="border border-rose-300 rounded-xl p-3 space-y-2 bg-rose-50/20">
              <span className="text-[11px] font-bold text-rose-600 tracking-wider">LOST</span>
              
              {editingLost ? (
                <div className="flex items-center space-x-2 bg-pink-100/50 p-2 rounded-lg border border-pink-300">
                  <input
                    type="text"
                    value={lostStageName}
                    onChange={(e) => setLostStageName(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                  />
                  <button onClick={() => setEditingLost(false)} className="p-1 rounded bg-rose-600 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="bg-pink-100/90 border border-pink-200 rounded-lg p-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">{lostStageName}</span>
                  <button
                    onClick={() => setEditingLost(true)}
                    className="p-1 text-slate-500 hover:text-rose-800 cursor-pointer transition-colors"
                    title="Edit lost stage name"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Reasons for Lost Leads Sub-Header with + Add */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Reason for Lost leads ({lostReasons.length} / 25)
                  </span>
                  <button
                    onClick={() => setShowAddReasonModal(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* List of Lost Reasons */}
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {lostReasons.map((reasonItem) => (
                    <div key={reasonItem.id}>
                      {editingReasonId === reasonItem.id ? (
                        <div className="bg-white p-2 rounded-lg border-2 border-indigo-500 shadow-md space-y-1.5">
                          <input
                            type="text"
                            value={editReasonText}
                            onChange={(e) => setEditReasonText(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 px-2 py-1 rounded text-xs text-slate-900 focus:outline-none"
                          />
                          <div className="flex justify-end space-x-1.5">
                            <button onClick={() => setEditingReasonId(null)} className="px-2 py-0.5 text-xs text-slate-500">Cancel</button>
                            <button onClick={() => handleSaveReasonEdit(reasonItem.id)} className="px-2.5 py-0.5 text-xs bg-indigo-600 text-white font-medium rounded">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-100/90 border border-slate-200/80 rounded-lg p-2 flex items-center justify-between group hover:bg-slate-200/60 transition-all">
                          <div className="flex items-center space-x-2">
                            <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 cursor-grab" />
                            <span className="text-xs font-medium text-slate-800">{reasonItem.reason}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setEditingReasonId(reasonItem.id);
                                setEditReasonText(reasonItem.reason);
                              }}
                              className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Edit Reason"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReason(reasonItem.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Reason"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add New Active Stage */}
      {showAddStageModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-xl p-4 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add New Active Pipeline Stage</h3>
              <button onClick={() => setShowAddStageModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stage Name</label>
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="e.g. Visit Scheduled, Proposal Sent, Negotiation"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Select Stage Color</label>
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
                {STAGE_COLOR_PALETTE.map((col) => (
                  <button
                    key={col.label}
                    type="button"
                    onClick={() => setNewStageBg(col.bg)}
                    className={`w-6 h-6 rounded-full border cursor-pointer transition-transform ${
                      newStageBg === col.bg ? 'ring-2 ring-indigo-600 scale-110 border-slate-900' : 'border-slate-300 hover:scale-110'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowAddStageModal(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={handleAddStage} disabled={!newStageName.trim()} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50 cursor-pointer">Add Stage</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Reason for Lost Leads */}
      {showAddReasonModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-xl p-4 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add Reason for Lost Leads</h3>
              <button onClick={() => setShowAddReasonModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reason Description</label>
              <input
                type="text"
                value={newReasonText}
                onChange={(e) => setNewReasonText(e.target.value)}
                placeholder="e.g. Price too high, Went to competitor, Not interested"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddReasonModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLostReason}
                disabled={!newReasonText.trim()}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50 cursor-pointer"
              >
                Add Reason
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PipelineView = PipelinePage;
export default PipelinePage;
