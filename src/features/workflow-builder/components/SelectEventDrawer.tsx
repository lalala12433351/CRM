import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Check
} from 'lucide-react';
import { 
  WORKFLOW_EVENT_ENTRIES, 
  WorkflowEventItem, 
  WorkflowEventEntry 
} from '../constants/workflowEvents';
import { EventIcon } from './EventIcons';

interface SelectEventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (event: WorkflowEventItem) => void;
}

export const SelectEventDrawer: React.FC<SelectEventDrawerProps> = ({
  isOpen,
  onClose,
  onSelectEvent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('on_whatsapp_received');
  
  // Track open/closed state for categories
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'cat-whatsapp': true,
    'cat-lead-field-change': false,
    'cat-ivr': true,
    'cat-call-activities': true,
    'cat-payment-activities': true,
    'cat-custom-action-creation': true,
    'cat-custom-action-updation': true
  });

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Find all items flat to get selected object
  const allEventItems = useMemo(() => {
    const list: WorkflowEventItem[] = [];
    WORKFLOW_EVENT_ENTRIES.forEach((entry) => {
      if (entry.type === 'item') {
        list.push(entry.data);
      } else {
        list.push(...entry.data.children);
      }
    });
    return list;
  }, []);

  const selectedEvent = useMemo(() => {
    return allEventItems.find((item) => item.id === selectedEventId) || allEventItems[0];
  }, [allEventItems, selectedEventId]);

  // Filter entries according to search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return WORKFLOW_EVENT_ENTRIES;
    const q = searchQuery.toLowerCase().trim();

    return WORKFLOW_EVENT_ENTRIES.map((entry) => {
      if (entry.type === 'item') {
        const matches = entry.data.name.toLowerCase().includes(q) ||
          (entry.data.badge && entry.data.badge.toLowerCase().includes(q)) ||
          (entry.data.description && entry.data.description.toLowerCase().includes(q));
        return matches ? entry : null;
      } else {
        const matchingChildren = entry.data.children.filter((child) =>
          child.name.toLowerCase().includes(q) ||
          (child.badge && child.badge.toLowerCase().includes(q)) ||
          (child.description && child.description.toLowerCase().includes(q))
        );

        if (entry.data.name.toLowerCase().includes(q) || matchingChildren.length > 0) {
          return {
            type: 'category' as const,
            data: {
              ...entry.data,
              children: matchingChildren.length > 0 ? matchingChildren : entry.data.children
            }
          };
        }
        return null;
      }
    }).filter(Boolean) as WorkflowEventEntry[];
  }, [searchQuery]);

  const handleNext = () => {
    if (selectedEvent) {
      onSelectEvent(selectedEvent);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Semi-transparent dark overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1.5px] transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel matching Image 4 */}
      <div className="relative w-full sm:w-[500px] md:w-[540px] bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 text-slate-900 font-sans">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Select event</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the event that will trigger the workflow
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 pt-3.5 pb-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for event e.g. facebook, payment completed, my_waca_template, etc"
              className="w-full bg-white border border-slate-200/90 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Scrollable Events Tree List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5 custom-scrollbar text-xs">
          {filteredEntries.map((entry) => {
            if (entry.type === 'item') {
              const item = entry.data;
              const isSelected = selectedEventId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedEventId(item.id)}
                  onDoubleClick={() => {
                    setSelectedEventId(item.id);
                    onSelectEvent(item);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-purple-50/90 border border-purple-200/80 text-purple-950 font-semibold shadow-2xs'
                      : 'hover:bg-slate-50/80 text-slate-700 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <EventIcon type={item.iconType} size={16} />
                    <span className="truncate text-xs">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 ${
                        item.badge === 'Published'
                          ? 'bg-[#EAFBF1] text-[#1E8A44] border-[#C6F3D7]'
                          : item.badge === 'Draft'
                          ? 'bg-[#F3EEFF] text-[#7C3AED] border-[#DDD6FE]'
                          : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            }

            // Accordion category
            const cat = entry.data;
            const isCategoryOpen = openCategories[cat.id] ?? true;

            return (
              <div key={cat.id} className="pt-1">
                {/* Accordion Toggle Header */}
                <div
                  onClick={() => toggleCategory(cat.id)}
                  className="flex items-center space-x-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors select-none text-slate-800 font-semibold text-xs"
                >
                  <span className="text-slate-400">
                    {isCategoryOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <EventIcon type={cat.iconType} size={16} />
                  <span className="tracking-tight">{cat.name}</span>
                </div>

                {/* Sub-items (expanded) */}
                {isCategoryOpen && (
                  <div className="pl-6 space-y-0.5 mt-0.5">
                    {cat.children.map((child) => {
                      const isSelected = selectedEventId === child.id;

                      return (
                        <div
                          key={child.id}
                          onClick={() => setSelectedEventId(child.id)}
                          onDoubleClick={() => {
                            setSelectedEventId(child.id);
                            onSelectEvent(child);
                            onClose();
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-purple-50/90 border border-purple-200/80 text-purple-950 font-semibold shadow-2xs'
                              : 'hover:bg-slate-50/80 text-slate-700 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <EventIcon type={child.iconType} size={15} />
                            <span className="truncate text-xs">{child.name}</span>
                          </div>

                          {child.badge && (
                            <span
                              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 ${
                                child.badge === 'Published'
                                  ? 'bg-[#EAFBF1] text-[#1E8A44] border-[#C6F3D7]'
                                  : child.badge === 'Draft'
                                  ? 'bg-[#F3EEFF] text-[#7C3AED] border-[#DDD6FE]'
                                  : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                              }`}
                            >
                              {child.badge}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer with Purple 'Next' Button */}
        <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-end bg-white">
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
          >
            <span>Next</span>
          </button>
        </div>
      </div>
    </div>
  );
};
