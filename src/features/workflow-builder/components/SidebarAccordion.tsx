import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Zap,
  PlayCircle,
  Filter,
  GitBranch,
  Sparkles,
  Layers
} from 'lucide-react';
import { WORKFLOW_CATEGORIES, WORKFLOW_CATALOG } from '../constants/workflowCatalog';
import { CatalogItem, WorkflowCategory } from '../types/workflow.types';
import { DynamicIcon } from './DynamicIcon';

interface SidebarAccordionProps {
  onItemClick?: (item: CatalogItem) => void;
  className?: string;
}

const CATEGORY_ICONS: Record<WorkflowCategory, React.FC<{ className?: string }>> = {
  events: Zap,
  actions: PlayCircle,
  lead_conditions: Filter,
  event_conditions: GitBranch
};

const CATEGORY_COLORS: Record<WorkflowCategory, { bg: string; text: string; border: string; activeBadge: string }> = {
  events: {
    bg: 'bg-purple-50',
    text: 'text-[#3a2088]',
    border: 'border-purple-200/80',
    activeBadge: 'bg-[#EDE9FE] text-[#3a2088] border border-[#DDD6FE]'
  },
  actions: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    activeBadge: 'bg-slate-100 text-slate-700 border border-slate-200'
  },
  lead_conditions: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200/80',
    activeBadge: 'bg-indigo-50 text-indigo-700 border border-indigo-200'
  },
  event_conditions: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200/80',
    activeBadge: 'bg-blue-50 text-blue-700 border border-blue-200'
  }
};

export const SidebarAccordion: React.FC<SidebarAccordionProps> = ({ onItemClick, className = '' }) => {
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

  const expandAll = () => {
    setOpenCategories({
      events: true,
      actions: true,
      lead_conditions: true,
      event_conditions: true
    });
  };

  const collapseAll = () => {
    setOpenCategories({
      events: false,
      actions: false,
      lead_conditions: false,
      event_conditions: false
    });
  };

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return WORKFLOW_CATALOG;
    const query = searchQuery.toLowerCase();
    return WORKFLOW_CATALOG.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const onDragStart = (event: React.DragEvent, item: CatalogItem) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`w-80 flex flex-col bg-white border-r border-slate-200/90 select-none h-full shadow-2xs font-sans ${className}`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-[#3a2088]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Workflow Elements</h2>
              <p className="text-[11px] text-slate-500">Drag or click to insert node</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#3a2088]">
            <button
              type="button"
              onClick={expandAll}
              className="hover:underline text-[10px] font-bold cursor-pointer"
            >
              Expand
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              onClick={collapseAll}
              className="hover:underline text-[10px] font-bold cursor-pointer"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Search Input (Matching CRM input styles) */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search triggers, actions, filters..."
            className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200/90 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3a2088] shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Accordion Categories List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {WORKFLOW_CATEGORIES.map((cat) => {
          const items = filteredCatalog.filter((item) => item.category === cat.id);
          const isOpen = openCategories[cat.id] || searchQuery.trim().length > 0;
          const CategoryIcon = CATEGORY_ICONS[cat.id] || Zap;
          const styling = CATEGORY_COLORS[cat.id];

          if (searchQuery && items.length === 0) return null;

          return (
            <div
              key={cat.id}
              className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all duration-150"
            >
              {/* Category Accordion Header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${styling.border} ${styling.bg} ${styling.text}`}>
                    <CategoryIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      {cat.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${styling.activeBadge}`}>
                    {items.length}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Category Items */}
              {isOpen && (
                <div className="p-2 space-y-2 bg-slate-50/50 border-t border-slate-100">
                  {items.length === 0 ? (
                    <div className="text-[11px] text-slate-400 py-3 text-center">
                      No matching elements
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        onClick={() => onItemClick?.(item)}
                        className="group flex items-start gap-2.5 p-3 rounded-xl border border-slate-200/90 hover:border-[#3a2088] bg-white hover:shadow-xs cursor-grab active:cursor-grabbing transition-all select-none"
                      >
                        <div className="text-slate-300 group-hover:text-[#3a2088] pt-0.5 transition-colors">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        <div className={`p-2 rounded-xl border ${styling.border} ${styling.bg} ${styling.text} shrink-0`}>
                          <DynamicIcon name={item.iconName} className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-[#3a2088] truncate">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] bg-purple-50 text-[#3a2088] border border-purple-200 px-1.5 py-0.2 rounded font-bold shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-slate-200/90 bg-white">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-[#3a2088] shrink-0" />
          <span>Tip: Drag an item onto the canvas or click to add it.</span>
        </div>
      </div>
    </div>
  );
};
