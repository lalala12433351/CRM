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
  Layers,
  HelpCircle
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
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800/50',
    activeBadge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
  },
  actions: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    activeBadge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
  },
  lead_conditions: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800/50',
    activeBadge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
  },
  event_conditions: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/50',
    activeBadge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
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
    <div className={`w-80 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none h-full ${className}`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Workflow Elements</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Drag & drop nodes into canvas</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400">
            <button
              type="button"
              onClick={expandAll}
              className="hover:underline text-[10px] font-medium"
            >
              Expand
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              onClick={collapseAll}
              className="hover:underline text-[10px] font-medium"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search triggers, actions, filters..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
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
              className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 transition-all duration-150"
            >
              {/* Category Accordion Header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${styling.bg} ${styling.text}`}>
                    <CategoryIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${styling.activeBadge}`}>
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
                <div className="p-2 space-y-1.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
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
                        className="group flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500/80 bg-white dark:bg-slate-800/70 hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none"
                      >
                        <div className="text-slate-300 dark:text-slate-600 group-hover:text-purple-500 pt-0.5 transition-colors">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        <div className={`p-1.5 rounded-md ${styling.bg} ${styling.text} shrink-0 mt-0.5`}>
                          <DynamicIcon name={item.iconName} className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-medium shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
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
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span>Tip: Drag an item onto the canvas or click to add it automatically.</span>
        </div>
      </div>
    </div>
  );
};
