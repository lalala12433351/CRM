import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { WORKFLOW_CATEGORIES, WORKFLOW_CATALOG } from '../constants/workflowCatalog';
import { CatalogItem, WorkflowCategory } from '../types/workflow.types';
import { WorkflowIcon } from './WorkflowIcons';

interface SidebarAccordionProps {
  onItemClick?: (item: CatalogItem) => void;
  hasTrigger?: boolean;
  className?: string;
}

export const SidebarAccordion: React.FC<SidebarAccordionProps> = ({
  onItemClick,
  hasTrigger = false,
  className = ''
}) => {
  const [openCategories, setOpenCategories] = useState<Record<WorkflowCategory, boolean>>({
    events: false,
    actions: true,
    lead_conditions: true,
    event_conditions: true
  });

  const toggleCategory = (catId: WorkflowCategory) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const catalogItems = useMemo(() => {
    return WORKFLOW_CATALOG.filter((item) => item.category !== 'events');
  }, []);

  const onDragStart = (event: React.DragEvent, item: CatalogItem) => {
    if (item.category === 'events' && hasTrigger) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`w-72 flex flex-col bg-white border-r border-slate-200/90 select-none h-full shadow-2xs font-sans ${className}`}>
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-200/90">
        <h2 className="text-xs font-bold text-slate-900 tracking-tight">Workflow Elements</h2>
      </div>

      {/* Accordion Categories List (Events omitted in editor) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {WORKFLOW_CATEGORIES.filter((cat) => cat.id !== 'events').map((cat) => {
          const items = catalogItems.filter((item) => item.category === cat.id);
          const isOpen = openCategories[cat.id];
          const isCategoryDisabled = cat.id === 'events' && hasTrigger;

          if (items.length === 0) return null;

          return (
            <div
              key={cat.id}
              className="border border-slate-200/90 rounded-md overflow-hidden bg-white shadow-2xs transition-all duration-150"
            >
              {/* Category Accordion Header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-900">
                    {cat.name}
                  </span>
                  {isCategoryDisabled && (
                    <span className="ml-2 text-[10px] text-slate-400 font-normal">
                      (1 active)
                    </span>
                  )}
                </div>

                <div className="flex items-center">
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Items List Inside Category */}
              {isOpen && (
                <div className="p-1.5 space-y-1 bg-slate-50/50 border-t border-slate-100">
                  {items.map((item) => {
                    const disabled = isCategoryDisabled;

                    return (
                      <div
                        key={item.id}
                        draggable={!disabled}
                        onDragStart={(e) => onDragStart(e, item)}
                        onClick={() => {
                          if (!disabled && onItemClick) {
                            onItemClick(item);
                          }
                        }}
                        className={`p-2 rounded border border-slate-200/80 bg-white transition-all text-xs flex items-center space-x-2 ${
                          disabled
                            ? 'opacity-40 cursor-not-allowed border-dashed'
                            : 'hover:border-[#3a2088] hover:shadow-xs cursor-grab active:cursor-grabbing hover:bg-purple-50/20'
                        }`}
                      >
                        <div className="p-1 rounded bg-slate-100 text-slate-700 shrink-0">
                          <WorkflowIcon id={item.id} size={14} className="text-[#3a2088]" />
                        </div>

                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <span className="font-medium text-slate-900 text-xs truncate">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-[#3a2088] font-mono border border-purple-200 font-normal shrink-0 ml-1.5">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
