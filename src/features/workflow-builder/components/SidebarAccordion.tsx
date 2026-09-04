import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { WORKFLOW_CATEGORIES, WORKFLOW_CATALOG } from '../constants/workflowCatalog';
import { CatalogItem, WorkflowCategory } from '../types/workflow.types';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<WorkflowCategory, boolean>>({
    events: true,
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

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return WORKFLOW_CATALOG;
    const query = searchQuery.toLowerCase();
    return WORKFLOW_CATALOG.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

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
      <div className="p-3 border-b border-slate-200/90 space-y-2">
        <div>
          <h2 className="text-xs font-semibold text-slate-900 tracking-tight">Workflow Elements</h2>
          <p className="text-[11px] text-slate-500 font-normal">Drag or click to insert node</p>
        </div>

        {/* Search Input (Clean, No Icon) */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search elements..."
            className="w-full px-2.5 py-1.5 text-xs font-normal rounded-md border border-slate-200/90 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3a2088] shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-normal"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Accordion Categories List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {WORKFLOW_CATEGORIES.map((cat) => {
          const items = filteredCatalog.filter((item) => item.category === cat.id);
          const isOpen = openCategories[cat.id] || searchQuery.trim().length > 0;
          const isCategoryDisabled = cat.id === 'events' && hasTrigger;

          if (searchQuery && items.length === 0) return null;

          return (
            <div
              key={cat.id}
              className="border border-slate-200/90 rounded-md overflow-hidden bg-white shadow-2xs transition-all duration-150"
            >
              {/* Category Accordion Header (No count badge) */}
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

              {/* Category Items (No Icons, No Badges, No Boldness) */}
              {isOpen && (
                <div className="p-1.5 space-y-1 bg-slate-50/50 border-t border-slate-100">
                  {items.length === 0 ? (
                    <div className="text-[11px] text-slate-400 py-2 text-center font-normal">
                      No elements
                    </div>
                  ) : (
                    items.map((item) => {
                      const isDisabled = item.category === 'events' && hasTrigger;

                      return (
                        <div
                          key={item.id}
                          draggable={!isDisabled}
                          onDragStart={(e) => onDragStart(e, item)}
                          onClick={() => {
                            if (!isDisabled) onItemClick?.(item);
                          }}
                          className={`flex items-center px-3 py-2 rounded-md border border-slate-200/90 bg-white transition-all select-none ${
                            isDisabled
                              ? 'opacity-40 cursor-not-allowed bg-slate-100'
                              : 'hover:border-[#3a2088] hover:shadow-2xs cursor-grab active:cursor-grabbing'
                          }`}
                          title={isDisabled ? 'Only 1 trigger event can be chosen per workflow' : undefined}
                        >
                          <span className="text-xs font-normal text-slate-800 hover:text-[#3a2088] truncate">
                            {item.name}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
