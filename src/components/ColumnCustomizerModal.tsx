import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  GripVertical, 
  Check, 
  Type, 
  ListFilter, 
  Star, 
  User, 
  Calendar, 
  Layers, 
  Phone, 
  Mail, 
  Hash, 
  DollarSign, 
  FileText, 
  CheckSquare, 
  Link as LinkIcon 
} from 'lucide-react';
import { CustomFieldDef, CustomFieldType } from '../types';

interface ColumnCustomizerModalProps {
  allFields: CustomFieldDef[];
  selectedFieldKeys: string[];
  onToggleField: (fieldKey: string) => void;
  onReorderFields?: (reorderedFields: CustomFieldDef[]) => void;
  onClose: () => void;
  maxFields?: number;
}

export const getFieldTypeIcon = (type?: CustomFieldType | string, name?: string) => {
  if (name === 'rating') return <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />;
  if (name === 'status') return <ListFilter className="w-3.5 h-3.5 text-indigo-500" />;
  if (name === 'assignee' || name === 'owner') return <User className="w-3.5 h-3.5 text-slate-500" />;
  if (name === 'source') return <Layers className="w-3.5 h-3.5 text-emerald-500" />;
  if (name === 'phone') return <Phone className="w-3.5 h-3.5 text-blue-500" />;
  if (name === 'email') return <Mail className="w-3.5 h-3.5 text-sky-500" />;
  if (name === 'deal_value' || name === 'dealValue') return <DollarSign className="w-3.5 h-3.5 text-amber-600" />;

  switch (type) {
    case 'number':
      return <Hash className="w-3.5 h-3.5 text-slate-500" />;
    case 'date':
      return <Calendar className="w-3.5 h-3.5 text-purple-500" />;
    case 'dropdown':
    case 'multiselect':
      return <ListFilter className="w-3.5 h-3.5 text-indigo-500" />;
    case 'phone':
      return <Phone className="w-3.5 h-3.5 text-blue-500" />;
    case 'email':
      return <Mail className="w-3.5 h-3.5 text-sky-500" />;
    case 'currency':
      return <DollarSign className="w-3.5 h-3.5 text-amber-600" />;
    case 'textarea':
      return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    case 'boolean':
      return <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />;
    case 'url':
      return <LinkIcon className="w-3.5 h-3.5 text-blue-400" />;
    case 'text':
    default:
      return <Type className="w-3.5 h-3.5 text-slate-600 font-bold" />;
  }
};

export const ColumnCustomizerModal: React.FC<ColumnCustomizerModalProps> = ({
  allFields,
  selectedFieldKeys,
  onToggleField,
  onReorderFields,
  onClose,
  maxFields = 12
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Filter fields based on search term
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return allFields;
    const q = searchQuery.toLowerCase().trim();
    return allFields.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q)
    );
  }, [allFields, searchQuery]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent or custom drag preview
    if (e.dataTransfer.setDragImage && e.currentTarget) {
      e.dataTransfer.setDragImage(e.currentTarget as Element, 20, 20);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const items = [...allFields];
    // Find the item in allFields corresponding to filteredFields[draggedIndex]
    const draggedItem = filteredFields[draggedIndex];
    const targetItem = filteredFields[targetIndex];

    const sourcePos = items.findIndex((f) => (f.name || f.id) === (draggedItem.name || draggedItem.id));
    const targetPos = items.findIndex((f) => (f.name || f.id) === (targetItem.name || targetItem.id));

    if (sourcePos !== -1 && targetPos !== -1) {
      const [moved] = items.splice(sourcePos, 1);
      items.splice(targetPos, 0, moved);
      if (onReorderFields) {
        onReorderFields(items);
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      className="absolute left-0 top-[calc(100%+6px)] w-64 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 p-3.5 space-y-3 font-sans animate-in fade-in zoom-in-95 text-xs select-none"
    >
      {/* Header */}
      <div className="space-y-0.5 border-b border-slate-100 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-[13px]">
            Customise view ({selectedFieldKeys.length}/{maxFields})
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 font-normal">
          Select at max {maxFields} fields & drag to reorder
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder=""
          className="w-full pl-8 pr-7 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-600 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Fields List with Drag and Drop Reordering */}
      <div className="max-h-64 overflow-y-auto space-y-1 pr-1 ios-scroll">
        {filteredFields.map((field, index) => {
          const isSelected = selectedFieldKeys.includes(field.name) || selectedFieldKeys.includes(field.id);
          const isNameField = field.name === 'name' || field.id === 'f-h1';
          const canSelectMore = selectedFieldKeys.length < maxFields || isSelected;
          const isDragging = draggedIndex === index;
          const isOver = dragOverIndex === index;

          return (
            <div
              key={field.id || field.name}
              draggable={!searchQuery}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => {
                if (isNameField) return; // Name is locked
                if (!isSelected && !canSelectMore) return;
                onToggleField(field.name || field.id);
              }}
              className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer group ${
                isDragging
                  ? 'opacity-40 border border-dashed border-indigo-400 bg-indigo-50/30'
                  : isOver
                  ? 'border-t-2 border-indigo-600 bg-indigo-50/60'
                  : isSelected
                  ? 'bg-purple-50/50 hover:bg-purple-50 text-slate-900 font-semibold'
                  : canSelectMore
                  ? 'hover:bg-slate-50 text-slate-700'
                  : 'opacity-50 cursor-not-allowed text-slate-400'
              }`}
            >
              {/* Drag Handle */}
              <div 
                className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-slate-300 group-hover:text-slate-500 hover:text-indigo-600 transition-colors shrink-0"
                title="Drag to rearrange position"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>

              {/* Purple Checkbox */}
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#5b21b6] border-[#5b21b6] text-white'
                    : 'border-slate-300 bg-white hover:border-[#5b21b6]'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>

              {/* Field Type Icon */}
              <div className="shrink-0 flex items-center justify-center w-4 h-4">
                {getFieldTypeIcon(field.type, field.name)}
              </div>

              {/* Field Label */}
              <span className="truncate text-xs font-medium text-slate-800 flex-1">
                {field.label}
              </span>
            </div>
          );
        })}

        {filteredFields.length === 0 && (
          <div className="text-center py-4 text-slate-400 text-xs">
            No fields match "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};
