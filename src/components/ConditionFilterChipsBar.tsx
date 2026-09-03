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
  FileText
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
  onClearAllConditions: () => void;
  optionsContext: DynamicOptionsContext;
}

export const ConditionFilterChipsBar: React.FC<ConditionFilterChipsBarProps> = ({
  activeConditions,
  onUpdateCondition,
  onRemoveCondition,
  onClearAllConditions,
  optionsContext
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
      return (
        <input
          type="date"
          value={cond.value}
          onChange={(e) => onUpdateCondition(cond.id, { value: e.target.value })}
          className="bg-purple-50/80 border border-purple-200 rounded-lg px-2 py-0.5 text-xs text-purple-900 font-medium focus:outline-none focus:ring-1 focus:ring-purple-400 w-32 shadow-2xs"
        />
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
    <div ref={dropdownContainerRef} className="flex items-center gap-2 flex-wrap pb-1 z-20">
      {activeConditions.map((cond) => {
        const isDropdownOpen = openOperatorDropdownId === cond.id;
        const allowedOperators = DATA_TYPE_OPERATOR_MAPPING[cond.dataType] || DATA_TYPE_OPERATOR_MAPPING.text;

        return (
          <div
            key={cond.id}
            className="relative inline-flex items-center bg-white border border-purple-300/80 rounded-xl px-3 py-1.5 text-xs shadow-xs text-slate-800 gap-2 font-medium animate-in fade-in zoom-in-95 group hover:border-purple-500 transition-all"
          >
            {/* Left Icon + Field Name */}
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 pr-2 border-r border-slate-200">
              {getConditionIcon(cond.iconType, cond.dataType)}
              <span className="whitespace-nowrap">{cond.fieldLabel}</span>
            </div>

            {/* Operator Dropdown (Populated strictly based on Field Data Type Mapping) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenOperatorDropdownId(isDropdownOpen ? null : cond.id)}
                className="flex items-center space-x-1 text-slate-700 hover:text-purple-700 font-medium px-1.5 py-0.5 rounded hover:bg-purple-50 transition-colors cursor-pointer"
              >
                <span className="whitespace-nowrap">{getOperatorLabel(cond.operator)}</span>
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
              className="w-4 h-4 rounded-full bg-purple-100 hover:bg-purple-600 text-purple-700 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ml-0.5 shadow-2xs"
              title="Remove condition"
            >
              <X className="w-2.5 h-2.5" />
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
