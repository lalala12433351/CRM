import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  RotateCw, 
  Save, 
  ChevronDown, 
  Calendar, 
  Clock, 
  ArrowUpDown, 
  SlidersHorizontal, 
  Sparkles, 
  Check, 
  Bookmark, 
  Trash2,
  Layers,
  BarChart3,
  List,
  Filter
} from 'lucide-react';
import { 
  FilterCondition, 
  FilterField, 
  FilterOperator, 
  SortConfig, 
  SavedViewDef, 
  Agent, 
  LeadStatus, 
  LeadSource, 
  AIRating 
} from '../types';

interface LeadsConditionFilterProps {
  conditions: FilterCondition[];
  onConditionsChange: (conditions: FilterCondition[]) => void;
  sortConfig: SortConfig;
  onSortChange: (sort: SortConfig) => void;
  currentViewName: string;
  onViewNameChange: (name: string) => void;
  savedViews: SavedViewDef[];
  onSelectSavedView: (view: SavedViewDef) => void;
  onSaveCurrentView: () => void;
  onDeleteSavedView?: (viewId: string) => void;
  onRefreshData: () => void;
  agents: Agent[];
  viewMode: 'table' | 'cards' | 'analytics';
  onViewModeChange: (mode: 'table' | 'cards' | 'analytics') => void;
  totalResultsCount: number;
}

export const LeadsConditionFilter: React.FC<LeadsConditionFilterProps> = ({
  conditions,
  onConditionsChange,
  sortConfig,
  onSortChange,
  currentViewName,
  onViewNameChange,
  savedViews,
  onSelectSavedView,
  onSaveCurrentView,
  onDeleteSavedView,
  onRefreshData,
  agents,
  viewMode,
  onViewModeChange,
  totalResultsCount
}) => {
  const [isSavedViewsDropdownOpen, setIsSavedViewsDropdownOpen] = useState(false);
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSaveView = () => {
    onSaveCurrentView();
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  const handleAddCondition = () => {
    const newCondition: FilterCondition = {
      id: `cond-${Date.now()}`,
      field: 'createdAt',
      operator: 'any',
      value: 'any'
    };
    onConditionsChange([...conditions, newCondition]);
  };

  const handleRemoveCondition = (id: string) => {
    onConditionsChange(conditions.filter(c => c.id !== id));
  };

  const handleUpdateCondition = (id: string, updates: Partial<FilterCondition>) => {
    onConditionsChange(
      conditions.map(c => {
        if (c.id !== id) return c;
        const updated = { ...c, ...updates };
        // If field changed, reset operator & value to defaults
        if (updates.field && updates.field !== c.field) {
          if (updates.field === 'createdAt') {
            updated.operator = 'any';
            updated.value = 'any';
          } else if (updates.field === 'status') {
            updated.operator = 'is';
            updated.value = 'New Lead';
          } else if (updates.field === 'source') {
            updated.operator = 'is';
            updated.value = 'Google Ads';
          } else if (updates.field === 'aiRating') {
            updated.operator = 'is';
            updated.value = 'Hot';
          } else if (updates.field === 'ownerAgentId') {
            updated.operator = 'is';
            updated.value = agents[0]?.id || '';
          } else if (updates.field === 'dealValue') {
            updated.operator = 'greater_than';
            updated.value = '50000';
          } else {
            updated.operator = 'contains';
            updated.value = '';
          }
        }
        return updated;
      })
    );
  };

  const availableStatuses: LeadStatus[] = ['New Lead', 'Contacted', 'Follow Up', 'Demo Scheduled', 'Proposal Sent', 'Converted', 'Lost'];
  const availableSources: LeadSource[] = ['Google Ads', 'Facebook Ads', 'IndiaMart', 'JustDial', 'WhatsApp', 'Website Form', '99acres', 'Sulekha', 'Google Sheets', 'Manual / Bulk CSV'];
  const availableRatings: AIRating[] = ['Hot', 'Warm', 'Cold'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3 sm:p-4 space-y-3 font-sans transition-all">
      
      {/* 1. Header: "Current view", Refresh Icon, View Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5">
            <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Current view</span>
            <button
              onClick={handleRefresh}
              title="Refresh Leads Table"
              className="p-1 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-all cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            ({totalResultsCount} records found)
          </span>
        </div>

        {/* View Mode Toggle Switcher (List/Table vs Charts/Analytics vs Cards) */}
        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => onViewModeChange('analytics')}
            title="Analytics View"
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center transition-all cursor-pointer ${
              viewMode === 'analytics'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => onViewModeChange('table')}
            title="Data Grid Table View"
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Filter & View Bar Container matching screenshot layout */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 sm:p-3.5 space-y-3">
        
        {/* Row A: View Name Box & Saved Views Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            {/* View Selector / Dropdown Pill */}
            <div className="relative flex-1">
              <div className="flex items-center rounded-lg border border-slate-300 bg-white shadow-2xs overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <button
                  onClick={() => setIsSavedViewsDropdownOpen(!isSavedViewsDropdownOpen)}
                  title="Switch Saved Views"
                  className="px-2.5 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border-r border-slate-200 transition-colors cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>

                <input
                  type="text"
                  value={currentViewName}
                  onChange={(e) => onViewNameChange(e.target.value)}
                  placeholder="View Name (e.g. All Leads)"
                  className="w-full px-3 py-1.5 text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
                />

                <button
                  onClick={handleSaveView}
                  title="Save View"
                  className={`px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1 shrink-0 ${
                    isSavedFeedback ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                  }`}
                >
                  {isSavedFeedback ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isSavedFeedback ? 'Saved' : 'Save'}</span>
                </button>
              </div>

              {/* Saved Views Dropdown Menu */}
              {isSavedViewsDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Saved Views & Presets
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5 ios-scroll">
                    {savedViews.map((sv) => (
                      <div
                        key={sv.id}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-medium text-slate-700 hover:text-indigo-900 group cursor-pointer transition-colors"
                        onClick={() => {
                          onSelectSavedView(sv);
                          setIsSavedViewsDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          <span className="truncate">{sv.name}</span>
                          {sv.isPreset && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                              Preset
                            </span>
                          )}
                        </div>
                        
                        {!sv.isPreset && onDeleteSavedView && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSavedView(sv.id);
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Saved View"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick preset views pill chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            {savedViews.slice(0, 3).map((sv) => (
              <button
                key={sv.id}
                onClick={() => onSelectSavedView(sv)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  currentViewName === sv.name
                    ? 'bg-indigo-100/80 border-indigo-300 text-indigo-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {sv.name}
              </button>
            ))}
          </div>
        </div>

        {/* Row B: Condition Chips Area & "+ Add a Condition" Button */}
        <div className="min-h-[48px] flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/70">
          
          {/* Active Filter Condition Pills (Styled exactly like Screenshot) */}
          {conditions.map((cond) => {
            return (
              <div
                key={cond.id}
                className="inline-flex items-center bg-purple-50/90 border border-purple-200/80 hover:border-purple-300 rounded-lg text-xs text-purple-950 font-medium p-1 shadow-2xs transition-all animate-in fade-in"
              >
                {/* 1. Field Selector */}
                <div className="flex items-center space-x-1 px-1.5 py-0.5 text-purple-900 font-semibold">
                  {cond.field === 'createdAt' && <Calendar className="w-3 h-3 text-purple-600" />}
                  <select
                    value={cond.field}
                    onChange={(e) => handleUpdateCondition(cond.id, { field: e.target.value as FilterField })}
                    className="bg-transparent text-purple-950 text-xs font-bold focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="createdAt">📅 Created On</option>
                    <option value="status">📊 Lead Status</option>
                    <option value="source">📡 Lead Source</option>
                    <option value="aiRating">🎯 AI Rating</option>
                    <option value="ownerAgentId">👤 Assigned Agent</option>
                    <option value="dealValue">💰 Deal Value</option>
                    <option value="city">📍 City / Location</option>
                    <option value="name">Customer Name</option>
                    <option value="phone">Phone Number</option>
                  </select>
                </div>

                <div className="w-[1px] h-3.5 bg-purple-200 mx-0.5" />

                {/* 2. Operator Selector */}
                <div className="flex items-center px-1.5 py-0.5">
                  <select
                    value={cond.operator}
                    onChange={(e) => handleUpdateCondition(cond.id, { operator: e.target.value as FilterOperator })}
                    className="bg-transparent text-purple-800 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                  >
                    {cond.field === 'createdAt' ? (
                      <>
                        <option value="any">Is Any</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                      </>
                    ) : cond.field === 'dealValue' ? (
                      <>
                        <option value="greater_than">Greater than (&gt;)</option>
                        <option value="less_than">Less than (&lt;)</option>
                        <option value="is">Equals (=)</option>
                      </>
                    ) : cond.field === 'name' || cond.field === 'phone' || cond.field === 'city' ? (
                      <>
                        <option value="contains">Contains</option>
                        <option value="is">Is Exactly</option>
                      </>
                    ) : (
                      <>
                        <option value="is">Is</option>
                        <option value="is_not">Is Not</option>
                        <option value="any">Any</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="w-[1px] h-3.5 bg-purple-200 mx-0.5" />

                {/* 3. Value Selector */}
                <div className="flex items-center px-1.5 py-0.5">
                  {cond.field === 'createdAt' ? (
                    <div className="flex items-center space-x-1 text-purple-800 font-semibold">
                      <Clock className="w-3 h-3 text-purple-600" />
                      <select
                        value={cond.value}
                        onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                        className="bg-transparent text-purple-900 text-xs font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="any">Any Time</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                      </select>
                    </div>
                  ) : cond.field === 'status' ? (
                    <select
                      value={cond.value}
                      onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                      className="bg-transparent text-purple-900 text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      {availableStatuses.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  ) : cond.field === 'source' ? (
                    <select
                      value={cond.value}
                      onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                      className="bg-transparent text-purple-900 text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      {availableSources.map(src => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  ) : cond.field === 'aiRating' ? (
                    <select
                      value={cond.value}
                      onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                      className="bg-transparent text-purple-900 text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      {availableRatings.map(rt => (
                        <option key={rt} value={rt}>{rt}</option>
                      ))}
                    </select>
                  ) : cond.field === 'ownerAgentId' ? (
                    <select
                      value={cond.value}
                      onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                      className="bg-transparent text-purple-900 text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="all">Any Agent</option>
                      {agents.map(ag => (
                        <option key={ag.id} value={ag.id}>{ag.name}</option>
                      ))}
                    </select>
                  ) : cond.field === 'dealValue' ? (
                    <div className="flex items-center space-x-1">
                      <span className="text-purple-700 font-mono">₹</span>
                      <input
                        type="number"
                        value={cond.value}
                        onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                        placeholder="50000"
                        className="w-20 bg-white/70 border border-purple-200 rounded px-1.5 py-0.5 text-xs text-purple-950 font-mono font-bold focus:outline-none"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={cond.value}
                      onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                      placeholder="Value..."
                      className="w-28 bg-white/70 border border-purple-200 rounded px-1.5 py-0.5 text-xs text-purple-950 font-semibold focus:outline-none"
                    />
                  )}
                </div>

                {/* Remove Condition Pill Button (Purple circular X matching screenshot) */}
                <button
                  onClick={() => handleRemoveCondition(cond.id)}
                  title="Remove Condition"
                  className="w-4 h-4 rounded-full bg-purple-200/80 hover:bg-purple-300 text-purple-800 flex items-center justify-center ml-1 cursor-pointer transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}

          {/* "+ Add a Condition" Button (Matching screenshot center/left position) */}
          <button
            onClick={handleAddCondition}
            className="inline-flex items-center space-x-1 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-lg px-3 py-1.5 cursor-pointer transition-all shadow-2xs hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add a Condition</span>
          </button>

          {conditions.length > 0 && (
            <button
              onClick={() => onConditionsChange([])}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-medium ml-auto px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Clear all filters ({conditions.length})
            </button>
          )}
        </div>

        {/* Row C: "Sort by:" Options Row (Matching screenshot format) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
          <span className="text-slate-600 font-bold flex items-center space-x-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Sort by:</span>
          </span>

          {/* Sort Field Selector */}
          <div className="relative inline-flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-semibold shadow-2xs">
            <select
              value={sortConfig.field}
              onChange={(e) => onSortChange({ ...sortConfig, field: e.target.value as any })}
              className="bg-transparent focus:outline-none cursor-pointer pr-4 appearance-none text-xs"
            >
              <option value="createdAt">📅 Created On</option>
              <option value="name">👤 Customer Name</option>
              <option value="dealValue">💰 Deal Value</option>
              <option value="aiScore">⚡ AI Score</option>
              <option value="updatedAt">⏱ Last Activity</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Sort Direction Selector */}
          <div className="relative inline-flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-semibold shadow-2xs">
            <select
              value={sortConfig.direction}
              onChange={(e) => onSortChange({ ...sortConfig, direction: e.target.value as any })}
              className="bg-transparent focus:outline-none cursor-pointer pr-4 appearance-none text-xs font-mono"
            >
              {sortConfig.field === 'createdAt' || sortConfig.field === 'updatedAt' ? (
                <>
                  <option value="newest">⇋ Newest First</option>
                  <option value="oldest">⇋ Oldest First</option>
                </>
              ) : sortConfig.field === 'dealValue' || sortConfig.field === 'aiScore' ? (
                <>
                  <option value="highest">⇋ Highest First</option>
                  <option value="lowest">⇋ Lowest First</option>
                </>
              ) : (
                <>
                  <option value="asc">⇋ A → Z</option>
                  <option value="desc">⇋ Z → A</option>
                </>
              )}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        </div>

      </div>

    </div>
  );
};
