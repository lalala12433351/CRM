import React, { useRef, useState, useEffect } from 'react';
import { 
  ChevronDown, 
  X, 
  Check, 
  Phone, 
  Mail, 
  Building2, 
  User, 
  Layers, 
  Star, 
  IndianRupee, 
  MapPin, 
  Globe, 
  Sliders, 
  Calendar, 
  Tag, 
  AlertCircle,
  ToggleLeft,
  FileText,
  Clock
} from 'lucide-react';
import { 
  DynamicCondition, 
  ConditionOperator, 
  FieldDataType, 
  DATA_TYPE_OPERATOR_MAPPING, 
  getOperatorLabel, 
  isUnaryOperator,
  getDynamicFieldOptions,
  DynamicOptionsContext
} from '../utils/conditionFilterEngine';

interface ConditionFilterChipsBarProps {
  activeConditions: DynamicCondition[];
  onUpdateCondition: (id: string, updates: Partial<DynamicCondition>) => void;
  onRemoveCondition: (id: string) => void;
  onClearAllConditions?: () => void;
  optionsContext?: DynamicOptionsContext;
  className?: string;
  pillClassName?: string;
}

export const ConditionFilterChipsBar: React.FC<ConditionFilterChipsBarProps> = ({
  activeConditions,
  onUpdateCondition,
  onRemoveCondition,
  onClearAllConditions,
  optionsContext = {},
  className = '',
  pillClassName = ''
}) => {
  const [openOperatorDropdownId, setOpenOperatorDropdownId] = useState<string | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(e.target as Node)) {
        setOpenOperatorDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeConditions || activeConditions.length === 0) {
    return null;
  }

  const getConditionIcon = (iconType: string, dataType: FieldDataType) => {
    switch (iconType) {
      case 'phone': return <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'email': return <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'company': return <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'name': return <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'status': return <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'rating': return <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'dealValue': return <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'city': return <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'source': return <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      case 'lostReason': return <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
      case 'tags': return <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'createdOn':
      case 'createdAt': return <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'call_duration_seconds': return <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      default:
        if (dataType === 'phone') return <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
        if (dataType === 'number') return <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
        if (dataType === 'date') return <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
        if (dataType === 'boolean') return <ToggleLeft className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
        if (dataType === 'user') return <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
        if (dataType === 'lost_reason') return <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
        if (dataType === 'select') return <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
        return <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
    }
  };

  const renderValueInput = (cond: DynamicCondition) => {
    // Automatically hide/disable value input for unary operators
    if (isUnaryOperator(cond.operator)) {
      return null;
    }

    // 1. Phone input
    if (cond.dataType === 'phone') {
      return (
        <input
          type="text"
          value={cond.value}
          onChange={(e) => onUpdateCondition(cond.id, { value: e.target.value })}
          placeholder="e.g. +91 9888..."
          className="bg-purple-50/70 border border-purple-200 rounded-lg px-2 py-0.5 text-xs text-purple-900 placeholder-purple-400 font-medium focus:outline-none focus:ring-1 focus:ring-purple-400 w-32 shadow-2xs transition-all"
        />
      );
    }

    // 2. Number / Currency input
    if (cond.dataType === 'number') {
      return (
        <input
          type="number"
          value={cond.value}
          onChange={(e) => onUpdateCondition(cond.id, { value: e.target.value })}
          placeholder="Enter number..."
          className="bg-purple-50/70 border border-purple-200 rounded-lg px-2 py-0.5 text-xs text-purple-900 placeholder-purple-400 font-medium focus:outline-none focus:ring-1 focus:ring-purple-400 w-28 shadow-2xs transition-all"
        />
      );
    }

    // 3. Date input
    if (cond.dataType === 'date') {
      const datePresets = ['Any', 'Today', 'Yesterday', 'This Week', 'This Month', 'Last 7 Days', 'Last 30 Days', 'Custom Date'];
      const isCustomDate = cond.value && !datePresets.includes(cond.value);
      const isDateSelected = Boolean(cond.value && cond.value !== 'Any');
      const fromHour = cond.fromHour !== undefined ? cond.fromHour : '0';
      const toHour = cond.toHour !== undefined ? cond.toHour : '23';

      return (
        <div className="flex items-center gap-1.5 flex-nowrap">
          <div className={`flex items-center gap-1 bg-transparent text-purple-900 px-1 py-0.5 text-xs font-semibold ${isDateSelected ? 'pr-1.5 border-r border-purple-200' : ''}`}>
            <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <select
              value={isCustomDate ? 'Custom Date' : (cond.value || 'Any')}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Custom Date') {
                  onUpdateCondition(cond.id, { 
                    value: new Date().toISOString().split('T')[0],
                    fromHour: cond.fromHour || '0',
                    toHour: cond.toHour || '23'
                  });
                } else {
                  onUpdateCondition(cond.id, { 
                    value: val,
                    fromHour: val !== 'Any' ? (cond.fromHour || '0') : cond.fromHour,
                    toHour: val !== 'Any' ? (cond.toHour || '23') : cond.toHour
                  });
                }
              }}
              className="bg-transparent text-purple-900 font-medium focus:outline-none cursor-pointer pr-0.5"
            >
              {datePresets.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {isCustomDate && (
            <div className={`flex items-center ${isDateSelected ? 'pr-1.5 border-r border-purple-200' : ''}`}>
              <input
                type="date"
                value={cond.value}
                onChange={(e) => onUpdateCondition(cond.id, { value: e.target.value })}
                className="bg-purple-100/70 border border-purple-200 rounded-lg px-1.5 py-0.5 text-xs text-purple-900 font-medium focus:outline-none focus:ring-1 focus:ring-purple-400 w-28 shadow-2xs"
              />
            </div>
          )}

          {/* Time Selection Range: Opens after date is selected (matching exact screenshot) */}
          {isDateSelected && (
            <div className="flex items-center gap-1 text-xs text-slate-700 animate-in fade-in duration-150 whitespace-nowrap pl-0.5">
              <span className="text-slate-600 font-normal">from:</span>
              <input
                type="text"
                value={fromHour}
                onChange={(e) => onUpdateCondition(cond.id, { fromHour: e.target.value })}
                className="w-8 sm:w-9 border-b border-slate-700 bg-transparent text-left pl-0.5 font-normal text-xs text-slate-900 focus:outline-none focus:border-purple-600 transition-colors"
                placeholder="0"
              />
              <span className="text-slate-700 font-normal">:00 h</span>

              <span className="text-slate-600 font-normal ml-1.5">to:</span>
              <input
                type="text"
                value={toHour}
                onChange={(e) => onUpdateCondition(cond.id, { toHour: e.target.value })}
                className="w-8 sm:w-9 border-b border-slate-700 bg-transparent text-left pl-0.5 font-normal text-xs text-slate-900 focus:outline-none focus:border-purple-600 transition-colors"
                placeholder="23"
              />
              <span className="text-slate-700 font-normal">:59 h</span>
            </div>
          )}
        </div>
      );
    }

    // 4. Categorical / Enum / Stage / Lost Reason / User dropdown
    if (
      cond.dataType === 'select' || 
      cond.dataType === 'lost_reason' || 
      cond.dataType === 'user'
    ) {
      const availableOptions = getDynamicFieldOptions(cond.fieldId, cond.dataType, optionsContext);

      return (
        <select
          value={cond.value}
          onChange={(e) => onUpdateCondition(cond.id, { value: e.target.value })}
          className="bg-purple-50/90 text-purple-900 border border-purple-200 rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer max-w-[150px] shadow-2xs"
        >
          <option value="" disabled className="text-slate-400">Select option...</option>
          {availableOptions.map((opt) => (
            <option key={opt} value={opt} className="bg-white text-slate-800">
              {opt}
            </option>
          ))}
        </select>
      );
    }

    // 5. Default Text / Email input
    return (
      <input
        type="text"
        value={cond.value}
        onChange={(e) => onUpdateCondition(cond.id, { value: e.target.value })}
        placeholder="Enter Text..."
        className="bg-purple-50/70 border border-purple-200 rounded-lg px-2 py-0.5 text-xs text-purple-900 placeholder-purple-400 font-medium focus:outline-none focus:ring-1 focus:ring-purple-400 w-28 sm:w-36 shadow-2xs transition-all"
      />
    );
  };

  return (
    <div ref={dropdownContainerRef} className={`flex items-center gap-2 flex-wrap pb-1 z-20 ${className}`}>
      {activeConditions.map((cond) => {
        const isDropdownOpen = openOperatorDropdownId === cond.id;
        const allowedOperators = DATA_TYPE_OPERATOR_MAPPING[cond.dataType] || DATA_TYPE_OPERATOR_MAPPING.text;

        return (
          <div
            key={cond.id}
            className={`relative inline-flex items-center bg-[#EDE9FE] border border-purple-200/80 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs text-slate-800 gap-1.5 font-medium animate-in fade-in zoom-in-95 group hover:border-purple-400 transition-all ${pillClassName}`}
          >
            {/* Left Icon + Field Name */}
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 pr-1.5 border-r border-purple-200">
              {getConditionIcon(cond.iconType, cond.dataType)}
              <span className="whitespace-nowrap">{cond.fieldLabel}</span>
            </div>

            {/* Operator Dropdown (Populated strictly based on Field Data Type Mapping) */}
            <div className="relative pr-1.5 border-r border-purple-200">
              <button
                type="button"
                onClick={() => setOpenOperatorDropdownId(isDropdownOpen ? null : cond.id)}
                className="flex items-center space-x-0.5 text-slate-700 hover:text-purple-700 font-medium px-1 py-0.5 rounded hover:bg-purple-100/60 transition-colors cursor-pointer"
              >
                <span className="whitespace-nowrap capitalize">{getOperatorLabel(cond.operator)}</span>
                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180 text-purple-700' : ''}`} />
              </button>

              {/* Operator Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 min-w-[160px] bg-white border border-slate-200 rounded-xl shadow-2xl z-[99999] py-1 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-0.5">
                    {cond.dataType.replace('_', ' ')} operations
                  </div>
                  {allowedOperators.map((op) => {
                    const isSelected = cond.operator === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => {
                          onUpdateCondition(cond.id, { operator: op.id as ConditionOperator });
                          setOpenOperatorDropdownId(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white font-semibold'
                            : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                        }`}
                      >
                        <span>{op.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dynamic Value Input Control */}
            {renderValueInput(cond)}

            {/* Floating Purple (X) Close / Remove Button */}
            <button
              type="button"
              onClick={() => onRemoveCondition(cond.id)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#C084FC] hover:bg-[#7C3AED] text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs z-10"
              title="Remove condition"
            >
              <X className="w-2.5 h-2.5 stroke-[3]" />
            </button>
          </div>
        );
      })}

      {/* Standalone Clear All Button */}
      {activeConditions.length > 0 && (
        <button
          type="button"
          onClick={onClearAllConditions}
          className="text-xs text-purple-600 hover:text-purple-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer flex items-center space-x-1"
        >
          <span>Clear All</span>
          {activeConditions.length > 1 && (
            <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {activeConditions.length}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
