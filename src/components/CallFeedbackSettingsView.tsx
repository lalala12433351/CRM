import React, { useState, useEffect } from 'react';
import { 
  GripVertical, 
  MoreVertical, 
  PlusCircle, 
  ChevronDown, 
  Check, 
  X, 
  Edit3, 
  Archive, 
  Trash2, 
  RotateCcw,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { Agent } from '../types';

export interface CallFeedbackStatus {
  id: string;
  name: string;
  isDefault: boolean;
  isArchived: boolean;
  order: number;
  isSystem?: boolean;
}

const INITIAL_CALL_FEEDBACK_STATUSES: CallFeedbackStatus[] = [
  { id: 'cf-1', name: 'NUMBER BUSY', isDefault: false, isArchived: false, order: 1, isSystem: true },
  { id: 'cf-2', name: 'NO ANSWER', isDefault: false, isArchived: false, order: 2, isSystem: true },
  { id: 'cf-3', name: 'WRONG NUMBER', isDefault: false, isArchived: false, order: 3, isSystem: true },
  { id: 'cf-4', name: 'SWITCHED OFF', isDefault: false, isArchived: false, order: 4, isSystem: true },
  { id: 'cf-5', name: 'CONNECTED', isDefault: true, isArchived: false, order: 5, isSystem: true },
  { id: 'cf-6', name: 'CALL LATER', isDefault: false, isArchived: false, order: 6, isSystem: true },
  { id: 'cf-7', name: 'REDIALED', isDefault: false, isArchived: false, order: 7, isSystem: true },
];

interface CallFeedbackSettingsViewProps {
  activeAgent?: Agent;
  onShowToast?: (msg: string) => void;
}

export const CallFeedbackSettingsView: React.FC<CallFeedbackSettingsViewProps> = ({
  activeAgent,
  onShowToast
}) => {
  const [statuses, setStatuses] = useState<CallFeedbackStatus[]>(() => {
    try {
      const saved = localStorage.getItem('pixbe_call_feedback_statuses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load call feedback statuses:', e);
    }
    return INITIAL_CALL_FEEDBACK_STATUSES;
  });

  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const [activeMenuStatusId, setActiveMenuStatusId] = useState<string | null>(null);

  // Add Status Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit Status Modal State
  const [editingStatus, setEditingStatus] = useState<CallFeedbackStatus | null>(null);
  const [editStatusName, setEditStatusName] = useState('');
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editFormError, setEditFormError] = useState('');

  // Drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Save to localStorage whenever statuses change
  useEffect(() => {
    try {
      localStorage.setItem('pixbe_call_feedback_statuses', JSON.stringify(statuses));
    } catch (e) {
      console.warn('Failed to save call feedback statuses:', e);
    }
  }, [statuses]);

  const availableStatuses = statuses
    .filter((s) => !s.isArchived)
    .sort((a, b) => a.order - b.order);

  const archivedStatuses = statuses
    .filter((s) => s.isArchived)
    .sort((a, b) => a.order - b.order);

  const handleSetDefault = (id: string) => {
    setStatuses((prev) =>
      prev.map((s) => ({
        ...s,
        isDefault: s.id === id,
      }))
    );
    setActiveMenuStatusId(null);
    if (onShowToast) onShowToast('Default call feedback status updated');
  };

  const handleArchive = (id: string) => {
    setStatuses((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return { ...s, isArchived: true, isDefault: false };
        }
        return s;
      })
    );
    setActiveMenuStatusId(null);
    if (onShowToast) onShowToast('Status archived');
  };

  const handleRestore = (id: string) => {
    setStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isArchived: false } : s))
    );
    if (onShowToast) onShowToast('Status restored');
  };

  const handleDelete = (id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id));
    setActiveMenuStatusId(null);
    if (onShowToast) onShowToast('Status deleted permanently');
  };

  const handleCreateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newStatusName.trim().toUpperCase();
    if (!cleanName) {
      setFormError('Status name is required');
      return;
    }

    if (statuses.some((s) => s.name.toUpperCase() === cleanName && !s.isArchived)) {
      setFormError('A status with this name already exists');
      return;
    }

    const newStatus: CallFeedbackStatus = {
      id: `cf-${Date.now()}`,
      name: cleanName,
      isDefault: newIsDefault,
      isArchived: false,
      order: availableStatuses.length + 1,
      isSystem: false,
    };

    setStatuses((prev) => {
      let next = [...prev];
      if (newIsDefault) {
        next = next.map((s) => ({ ...s, isDefault: false }));
      }
      return [...next, newStatus];
    });

    setIsAddModalOpen(false);
    setNewStatusName('');
    setNewIsDefault(false);
    setFormError('');
    if (onShowToast) onShowToast(`Created status "${cleanName}"`);
  };

  const handleSaveEditStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatus) return;
    const cleanName = editStatusName.trim().toUpperCase();
    if (!cleanName) {
      setEditFormError('Status name is required');
      return;
    }

    setStatuses((prev) => {
      let next = [...prev];
      if (editIsDefault) {
        next = next.map((s) => ({ ...s, isDefault: false }));
      }
      return next.map((s) =>
        s.id === editingStatus.id
          ? { ...s, name: cleanName, isDefault: editIsDefault }
          : s
      );
    });

    setEditingStatus(null);
    setEditStatusName('');
    setEditIsDefault(false);
    setEditFormError('');
    if (onShowToast) onShowToast(`Updated status "${cleanName}"`);
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updated = [...availableStatuses];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    const reorderedAll = statuses.map((s) => {
      const foundIdx = updated.findIndex((u) => u.id === s.id);
      if (foundIdx >= 0) {
        return { ...s, order: foundIdx + 1 };
      }
      return s;
    });

    setStatuses(reorderedAll);
    if (onShowToast) onShowToast('Call feedback hierarchy updated');
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Set transparent drag ghost if needed
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      handleReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 font-sans text-slate-900 pb-24">
      {/* 1. Header Area matching Screenshot */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Call Feedback
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
          Automatically{' '}
          <span className="text-indigo-600 font-semibold cursor-pointer">default</span>{' '}
          status is assigned if call duration &gt; 0s. However you can update anytime.
        </p>
      </div>

      {/* 2. Available Status Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100/90 shadow-2xs space-y-4">
        {/* Card Top Title & Add Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 font-sans">
            Available status ({availableStatuses.length})
          </h2>

          <button
            onClick={() => {
              setNewStatusName('');
              setNewIsDefault(false);
              setFormError('');
              setIsAddModalOpen(true);
            }}
            title="Add New Call Feedback Status"
            className="text-indigo-600 hover:text-indigo-700 transition-transform active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Status Item List with Smooth Drag-and-Drop & Hierarchy Controls */}
        <div className="space-y-2">
          {availableStatuses.map((status, index) => {
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index && draggedIndex !== index;

            return (
              <div
                key={status.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`transition-all duration-150 rounded-xl px-4 py-3.5 flex items-center justify-between group relative cursor-grab active:cursor-grabbing select-none ${
                  isDragging 
                    ? 'opacity-40 scale-[0.98] border-2 border-dashed border-indigo-400 bg-indigo-50/50 shadow-inner' 
                    : isDragOver
                    ? 'bg-indigo-50/60 ring-2 ring-indigo-500 border border-indigo-300 shadow-sm'
                    : 'bg-slate-50/80 hover:bg-slate-100/80 border border-transparent'
                }`}
              >
                {/* Left Handle, Hierarchy Reorder Arrows & Name */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="flex items-center space-x-1">
                    <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
                    
                    {/* Quick Move Up/Down Arrow buttons on hover */}
                    <div className="hidden sm:flex flex-col -space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorder(index, index - 1);
                        }}
                        className="text-[10px] text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer p-0.5 leading-none"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={index === availableStatuses.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorder(index, index + 1);
                        }}
                        className="text-[10px] text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer p-0.5 leading-none"
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  <span className="font-semibold text-xs sm:text-sm text-slate-800 tracking-wide truncate uppercase">
                    {status.name}
                  </span>
                  {status.isDefault && (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold tracking-normal border border-indigo-100/60 shadow-2xs shrink-0">
                      default
                    </span>
                  )}
                </div>

                {/* Right 3-Dots Menu Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuStatusId(
                        activeMenuStatusId === status.id ? null : status.id
                      );
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu Popover (Exact match to screenshot) */}
                  {activeMenuStatusId === status.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setActiveMenuStatusId(null)}
                      />
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-slate-200/90 shadow-xl z-50 py-1 font-sans animate-in fade-in zoom-in-95 text-[13px]">
                        {/* 1. Set default */}
                        {status.isDefault ? (
                          <div className="px-4 py-2 text-slate-400 font-normal cursor-not-allowed select-none">
                            Set default
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(status.id)}
                            className="w-full text-left px-4 py-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 font-normal transition-colors cursor-pointer"
                          >
                            Set default
                          </button>
                        )}

                        {/* 2. Edit (with 'can't edit system generated' if system) */}
                        {status.isSystem ? (
                          <div className="px-4 py-1.5 text-left cursor-not-allowed select-none">
                            <span className="text-slate-400 font-normal block leading-tight">Edit</span>
                            <span className="text-[11px] text-slate-400 block mt-0.5 leading-tight font-normal">
                              can't edit system generated
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStatus(status);
                              setEditStatusName(status.name);
                              setEditIsDefault(status.isDefault);
                              setEditFormError('');
                              setActiveMenuStatusId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 font-normal transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        )}

                        {/* 3. Archive */}
                        <button
                          type="button"
                          onClick={() => handleArchive(status.id)}
                          className="w-full text-left px-4 py-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 font-normal transition-colors cursor-pointer"
                        >
                          Archive
                        </button>

                        {/* Custom status delete (optional if non-system & not default) */}
                        {!status.isSystem && !status.isDefault && (
                          <div className="border-t border-slate-100 my-1 pt-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(status.id)}
                              className="w-full text-left px-4 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-normal transition-colors cursor-pointer"
                            >
                              Delete permanently
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Archived Status Accordion Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100/90 shadow-2xs space-y-3">
        <button
          type="button"
          onClick={() => setIsArchivedOpen(!isArchivedOpen)}
          className="w-full flex items-center justify-between text-left cursor-pointer group select-none"
        >
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Archived status ({archivedStatuses.length})
          </h2>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
              isArchivedOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isArchivedOpen && (
          <div className="pt-2 space-y-2 animate-in fade-in">
            {archivedStatuses.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No archived statuses.
              </p>
            ) : (
              archivedStatuses.map((status) => (
                <div
                  key={status.id}
                  className="bg-slate-50/70 rounded-xl px-4 py-3 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-500 line-through uppercase">
                    {status.name}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRestore(status.id)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 text-[11px] font-medium cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => handleDelete(status.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL: Add New Status */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in text-xs font-normal">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <PhoneCall className="w-5 h-5 text-indigo-600" />
                <span>Add Call Feedback Status</span>
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStatus} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Status Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStatusName}
                  onChange={(e) => {
                    setNewStatusName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g. NOT INTERESTED"
                  className={`w-full px-3.5 py-2.5 rounded-xl border uppercase font-semibold text-xs focus:outline-none ${
                    formError
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-600 bg-white'
                  }`}
                  autoFocus
                />
                {formError && (
                  <p className="text-[11px] text-rose-600 mt-1">{formError}</p>
                )}
              </div>

              <div className="flex items-center space-x-2.5 pt-1">
                <input
                  type="checkbox"
                  id="newIsDefaultCheck"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="newIsDefaultCheck"
                  className="text-slate-700 font-medium cursor-pointer select-none"
                >
                  Set as default status for answered calls (&gt; 0s)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Status */}
      {editingStatus && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in text-xs font-normal">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>Edit Call Feedback Status</span>
              </h2>
              <button
                onClick={() => setEditingStatus(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStatus} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Status Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editStatusName}
                  onChange={(e) => {
                    setEditStatusName(e.target.value);
                    if (editFormError) setEditFormError('');
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border uppercase font-semibold text-xs focus:outline-none ${
                    editFormError
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-600 bg-white'
                  }`}
                  autoFocus
                />
                {editFormError && (
                  <p className="text-[11px] text-rose-600 mt-1">{editFormError}</p>
                )}
              </div>

              <div className="flex items-center space-x-2.5 pt-1">
                <input
                  type="checkbox"
                  id="editIsDefaultCheck"
                  checked={editIsDefault}
                  onChange={(e) => setEditIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="editIsDefaultCheck"
                  className="text-slate-700 font-medium cursor-pointer select-none"
                >
                  Set as default status for answered calls (&gt; 0s)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStatus(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
