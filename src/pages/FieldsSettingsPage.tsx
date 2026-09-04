import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  RotateCcw, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Calendar, 
  Hash, 
  Type as TypeIcon, 
  ListFilter, 
  CheckSquare, 
  DollarSign, 
  Link as LinkIcon, 
  FileText, 
  Edit3, 
  Eye, 
  EyeOff, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  AlertCircle, 
  HelpCircle, 
  ShieldCheck, 
  Sparkles, 
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  FolderTree,
  ExternalLink,
  Lock,
  Layers,
  Save,
  Download,
  Info,
  ArrowLeftRight,
  CornerDownRight,
  IndianRupee
} from 'lucide-react';
import { CustomFieldDef, CustomFieldType, Agent, isAgentAdmin } from '../types';

const PurpleToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ease-in-out shrink-0 ${
      checked ? 'bg-[#5b21b6]' : 'bg-slate-300'
    }`}
  >
    <div
      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

interface FieldsSettingsViewProps {
  customFields: CustomFieldDef[];
  activeAgent?: Agent;
  onUpdateFields: (fields: CustomFieldDef[]) => void;
  onShowToast?: (message: string) => void;
  onBackToLeads?: () => void;
}

const FIELD_TYPE_CONFIG: Record<CustomFieldType, { label: string; icon: any; color: string; bg: string }> = {
  text:        { label: 'Text',        icon: TypeIcon,    color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  phone:       { label: 'Phone',       icon: Phone,       color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  email:       { label: 'Email',       icon: Mail,        color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  number:      { label: 'Number',      icon: Hash,        color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  dropdown:    { label: 'Dropdown',    icon: ListFilter,  color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  multiselect: { label: 'Multi-Select',icon: Layers,      color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  date:        { label: 'Date',        icon: Calendar,    color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  currency:    { label: 'Currency',    icon: DollarSign,  color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  textarea:    { label: 'Textarea',    icon: FileText,    color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  boolean:     { label: 'Checkbox',    icon: CheckSquare, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  url:         { label: 'URL',         icon: LinkIcon,    color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
};

export const FieldsSettingsPage: React.FC<FieldsSettingsViewProps> = ({
  customFields,
  activeAgent,
  onUpdateFields,
  onShowToast = (_msg: string) => {},
  onBackToLeads,
}) => {
  const isAdmin = activeAgent ? isAgentAdmin(activeAgent) : true;
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'active' | 'hidden' | 'all'>('active');
  const [sortField, setSortField] = useState<'label' | 'createdOn' | 'lastModified'>('label');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDef | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<CustomFieldDef | null>(null);
  const [showChangeIdModal, setShowChangeIdModal] = useState(false);
  const [selectedUniqueIdKey, setSelectedUniqueIdKey] = useState<string>('phone');
  const [showSlotAssignModal, setShowSlotAssignModal] = useState<'H1' | 'H2' | null>(null);

  // Form State for Add / Edit
  const [fieldName, setFieldName] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldType | ''>('text');
  const [fieldCategory, setFieldCategory] = useState<'General' | 'Contact' | 'Academic/Career' | 'Custom'>('General');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldUnique, setFieldUnique] = useState(false);
  const [fieldShowInQuickAdd, setFieldShowInQuickAdd] = useState(true);
  const [fieldShowInImport, setFieldShowInImport] = useState(true);
  const [fieldLockAfterCreate, setFieldLockAfterCreate] = useState(false);
  const [fieldCanUseVariable, setFieldCanUseVariable] = useState(true);
  const [fieldVariableDefaultValue, setFieldVariableDefaultValue] = useState('NA');
  const [fieldMinLength, setFieldMinLength] = useState<number | string>(1);
  const [fieldMaxLength, setFieldMaxLength] = useState<number | string>(102);
  const [fieldMinValue, setFieldMinValue] = useState<number | string>(0);
  const [fieldMaxValue, setFieldMaxValue] = useState<number | string>(10000000);
  const [fieldSearchable, setFieldSearchable] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldDescription, setFieldDescription] = useState('');
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState('');

  // Primary Fields H1 and H2
  const h1Field = customFields.find((f) => f.primarySlot === 'H1') || customFields.find((f) => f.name === 'name') || customFields[0];
  const h2Field = customFields.find((f) => f.primarySlot === 'H2') || customFields.find((f) => f.name === 'phone') || customFields[1];

  // Other Fields (excluding H1 and H2)
  const otherFields = useMemo(() => {
    return customFields.filter((f) => f.primarySlot !== 'H1' && f.primarySlot !== 'H2');
  }, [customFields]);

  // Filtered & Sorted Other Fields
  const filteredFields = useMemo(() => {
    return otherFields.filter((field) => {
      // Visibility Filter
      if (visibilityFilter === 'active' && field.isHidden) return false;
      if (visibilityFilter === 'hidden' && !field.isHidden) return false;

      // Type Filter
      if (typeFilter !== 'all' && field.type !== typeFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLabel = field.label.toLowerCase().includes(q);
        const matchesName = field.name.toLowerCase().includes(q);
        const matchesType = field.type.toLowerCase().includes(q);
        const matchesCat = (field.category || '').toLowerCase().includes(q);
        if (!matchesLabel && !matchesName && !matchesType && !matchesCat) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'label') {
        comparison = a.label.localeCompare(b.label);
      } else if (sortField === 'createdOn') {
        comparison = (a.createdOn || '').localeCompare(b.createdOn || '');
      } else if (sortField === 'lastModified') {
        comparison = (a.lastModified || '').localeCompare(b.lastModified || '');
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [otherFields, visibilityFilter, typeFilter, searchQuery, sortField, sortDirection]);

  // Handlers for Add / Edit Modal
  const handleOpenAddModal = () => {
    setFieldName('');
    setFieldKey('');
    setFieldType('text');
    setFieldCategory('General');
    setFieldRequired(false);
    setFieldUnique(false);
    setFieldShowInQuickAdd(true);
    setFieldShowInImport(true);
    setFieldLockAfterCreate(false);
    setFieldCanUseVariable(true);
    setFieldVariableDefaultValue('NA');
    setFieldMinLength(1);
    setFieldMaxLength(102);
    setFieldMinValue(0);
    setFieldMaxValue(10000000);
    setFieldSearchable(false);
    setIsPropertiesOpen(true);
    setFieldPlaceholder('');
    setFieldDescription('');
    setFieldOptions([]);
    setOptionInput('');
    setEditingField(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (field: CustomFieldDef) => {
    setEditingField(field);
    setFieldName(field.label);
    setFieldKey(field.name);
    setFieldType(field.type);
    setFieldCategory(field.category as any || 'General');
    setFieldRequired(!!field.required);
    setFieldUnique(!!field.isUnique);
    setFieldShowInQuickAdd(field.showInQuickAdd !== false);
    setFieldShowInImport(field.showInImport !== false);
    setFieldLockAfterCreate(!!field.lockAfterCreate);
    setFieldCanUseVariable(field.canUseVariable !== false);
    setFieldVariableDefaultValue(field.variableDefaultValue || 'NA');
    setFieldMinLength(field.minLength ?? 1);
    setFieldMaxLength(field.maxLength ?? 102);
    setFieldMinValue(field.minValue ?? 0);
    setFieldMaxValue(field.maxValue ?? 10000000);
    setFieldSearchable(!!field.isSearchable);
    setIsPropertiesOpen(true);
    setFieldPlaceholder(field.placeholder || '');
    setFieldDescription(field.description || '');
    setFieldOptions(field.options ? [...field.options] : []);
    setOptionInput('');
    setShowAddModal(true);
  };

  const handleNameChange = (val: string) => {
    setFieldName(val);
    if (!editingField) {
      // Auto-slugify
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      setFieldKey(slug);
    }
  };

  const handleAddOption = () => {
    if (!optionInput.trim()) return;
    if (fieldOptions.includes(optionInput.trim())) {
      onShowToast('Option already exists.');
      return;
    }
    setFieldOptions([...fieldOptions, optionInput.trim()]);
    setOptionInput('');
  };

  const handleRemoveOption = (index: number) => {
    setFieldOptions(fieldOptions.filter((_, i) => i !== index));
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onShowToast('Access Restricted: Only Admin accounts can modify Lead Field Settings.');
      return;
    }
    const trimmedLabel = fieldName.trim();
    if (!trimmedLabel) {
      onShowToast('Please enter a Field Name');
      return;
    }

    const finalKey = fieldKey.trim() || trimmedLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    // Duplicate Check: Disallow more than one field with the same name or key
    const isDuplicate = customFields.some(
      (f) =>
        (!editingField || f.id !== editingField.id) &&
        (f.label.toLowerCase() === trimmedLabel.toLowerCase() || f.name.toLowerCase() === finalKey.toLowerCase())
    );

    if (isDuplicate) {
      onShowToast(`Field with name "${trimmedLabel}" already exists.`);
      return;
    }

    const nowIso = new Date().toISOString();

    if (editingField) {
      // Update existing
      const updatedList = customFields.map((f) => {
        if (f.id === editingField.id) {
          return {
            ...f,
            label: trimmedLabel,
            name: finalKey,
            type: (fieldType || 'text') as CustomFieldType,
            category: fieldCategory,
            required: fieldRequired,
            isUnique: fieldUnique,
            showInQuickAdd: fieldShowInQuickAdd,
            showInImport: fieldShowInImport,
            lockAfterCreate: fieldLockAfterCreate,
            canUseVariable: fieldCanUseVariable,
            variableDefaultValue: fieldVariableDefaultValue.trim() || 'NA',
            minLength: Number(fieldMinLength) || 1,
            maxLength: Number(fieldMaxLength) || 102,
            minValue: fieldMinValue !== '' ? Number(fieldMinValue) : undefined,
            maxValue: fieldMaxValue !== '' ? Number(fieldMaxValue) : undefined,
            isSearchable: fieldSearchable,
            placeholder: fieldPlaceholder.trim(),
            description: fieldDescription.trim(),
            options: (fieldType === 'dropdown' || fieldType === 'multiselect') ? fieldOptions : undefined,
            lastModified: nowIso,
          };
        }
        return f;
      });
      onUpdateFields(updatedList);
      onShowToast(`Field "${trimmedLabel}" updated successfully!`);
    } else {
      // Create new
      const newField: CustomFieldDef = {
        id: `f-${Date.now()}`,
        name: finalKey,
        label: trimmedLabel,
        type: (fieldType || 'text') as CustomFieldType,
        category: fieldCategory,
        required: fieldRequired,
        isUnique: fieldUnique,
        showInQuickAdd: fieldShowInQuickAdd,
        showInImport: fieldShowInImport,
        lockAfterCreate: fieldLockAfterCreate,
        canUseVariable: fieldCanUseVariable,
        variableDefaultValue: fieldVariableDefaultValue.trim() || 'NA',
        minLength: Number(fieldMinLength) || 1,
        maxLength: Number(fieldMaxLength) || 102,
        minValue: fieldMinValue !== '' ? Number(fieldMinValue) : undefined,
        maxValue: fieldMaxValue !== '' ? Number(fieldMaxValue) : undefined,
        isSearchable: fieldSearchable,
        placeholder: fieldPlaceholder.trim(),
        description: fieldDescription.trim(),
        options: (fieldType === 'dropdown' || fieldType === 'multiselect') ? fieldOptions : undefined,
        createdOn: nowIso,
        lastModified: nowIso,
        isHidden: false,
      };
      onUpdateFields([...customFields, newField]);
      onShowToast(`New field "${trimmedLabel}" added successfully!`);
    }

    setShowAddModal(false);
  };

  const handleToggleHideField = (field: CustomFieldDef) => {
    if (!isAdmin) {
      onShowToast('Access Restricted: Only Admin accounts can change lead field status.');
      return;
    }
    const nowIso = new Date().toISOString();
    const updated = customFields.map((f) => {
      if (f.id === field.id) {
        const nextState = !f.isHidden;
        onShowToast(nextState ? `Field "${f.label}" hidden from CRM` : `Field "${f.label}" unhidden and active!`);
        return { ...f, isHidden: nextState, lastModified: nowIso };
      }
      return f;
    });
    onUpdateFields(updated);
  };

  const handleDeleteField = () => {
    if (!isAdmin) {
      onShowToast('Access Restricted: Only Admin accounts can delete lead fields.');
      return;
    }
    if (!fieldToDelete) return;
    const updated = customFields.filter((f) => f.id !== fieldToDelete.id);
    onUpdateFields(updated);
    onShowToast(`Field "${fieldToDelete.label}" deleted.`);
    setFieldToDelete(null);
  };

  const handleAssignSlot = (slot: 'H1' | 'H2', targetFieldId: string) => {
    const nowIso = new Date().toISOString();
    const updated = customFields.map((f) => {
      if (f.id === targetFieldId) {
        return { ...f, primarySlot: slot, isPrimary: true, isHidden: false, lastModified: nowIso };
      }
      if (f.primarySlot === slot && f.id !== targetFieldId) {
        return { ...f, primarySlot: null, isPrimary: false, lastModified: nowIso };
      }
      return f;
    });
    onUpdateFields(updated);
    onShowToast(`Slot ${slot} reassigned successfully!`);
    setShowSlotAssignModal(null);
  };

  const toggleSort = (col: 'label' | 'createdOn' | 'lastModified') => {
    if (sortField === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(col);
      setSortDirection('asc');
    }
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '—';
    if (dateStr.includes('ago') || dateStr === 'Just now') return dateStr;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderFieldIcon = (_type: CustomFieldType) => {
    return null;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-5 p-1 sm:p-2 md:p-4 font-sans text-slate-900 animate-in fade-in duration-200">
      
      {/* 1. TOP BAR / TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg md:text-xl font-bold font-sans text-slate-900 tracking-tight">
            Fields Settings
          </h2>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5 font-normal font-sans">
            <span>Lead Id configuration & custom field definitions for your CRM workspace.</span>
            <span>•</span>
            <button 
              type="button"
              onClick={() => onShowToast('Lead ID represents the primary unique identifier key for deduplication and phone lookup.')} 
              className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium cursor-pointer"
            >
              Learn more
            </button>
          </div>
        </div>

        {/* Action Button: + Add Field */}
        <div className="flex items-center space-x-2.5 font-sans">
          {onBackToLeads && (
            <button
              onClick={onBackToLeads}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer"
            >
              Back to Leads
            </button>
          )}
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Add Field</span>
          </button>
        </div>
      </div>

      {/* 2. UNIQUE IDENTIFIER BANNER CARD */}
      <div className="bg-[#f8fafc] rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between gap-3 font-sans">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {selectedUniqueIdKey === 'phone' ? 'Phone' : selectedUniqueIdKey === 'email' ? 'Email' : 'Lead ID'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563eb] border border-blue-100 text-[10px] font-bold">
              Unique
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            {selectedUniqueIdKey === 'phone' ? '9876543210' : 'contact@client.com'}
          </p>
        </div>

        <button
          onClick={() => setShowChangeIdModal(true)}
          className="text-xs font-medium text-[#2563eb] hover:text-[#1d4ed8] hover:underline px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all cursor-pointer"
        >
          Change
        </button>
      </div>

      {/* 3. PRIMARY FIELDS (ASSIGN) */}
      <div className="space-y-2 font-sans">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Primary Fields (Assign)
          </h3>
          <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">Header slot previews shown on lead card header</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* H1 SLOT */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all">
            <div className="flex items-center space-x-3 min-w-0">
              <span className="text-xs font-normal text-indigo-600 font-mono bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shrink-0">
                H1
              </span>
              <span className="text-sm font-normal text-slate-900 truncate">
                {h1Field ? h1Field.label : 'Name'}
              </span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => h1Field && handleOpenEditModal(h1Field)}
                className="text-xs font-normal text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Edit Field"
              >
                Edit
              </button>
              <button
                onClick={() => setShowSlotAssignModal('H1')}
                className="text-xs font-normal text-indigo-600 hover:text-indigo-800 cursor-pointer"
                title="Change Slot H1 Field"
              >
                Change
              </button>
            </div>
          </div>

          {/* H2 SLOT */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all">
            <div className="flex items-center space-x-3 min-w-0">
              <span className="text-xs font-normal text-indigo-600 font-mono bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shrink-0">
                H2
              </span>
              <span className="text-sm font-normal text-slate-900 truncate">
                {h2Field ? h2Field.label : 'Phone'}
              </span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => h2Field && handleOpenEditModal(h2Field)}
                className="text-xs font-normal text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Edit Field"
              >
                Edit
              </button>
              <button
                onClick={() => setShowSlotAssignModal('H2')}
                className="text-xs font-normal text-indigo-600 hover:text-indigo-800 cursor-pointer"
                title="Change Slot H2 Field"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. OTHER FIELDS */}
      <div className="space-y-2.5 pt-1 font-sans">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Other Fields
          </h3>
          <span className="text-xs font-normal text-slate-500">
            {filteredFields.length} results found
          </span>
        </div>

        {/* Filter Controls Row */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search fields by name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all"
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter by Field Type Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="text">Text</option>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="number">Number</option>
              <option value="dropdown">Dropdown</option>
              <option value="multiselect">Multi-Select</option>
              <option value="date">Date</option>
              <option value="currency">Currency</option>
              <option value="textarea">Textarea</option>
              <option value="boolean">Checkbox</option>
              <option value="url">URL</option>
            </select>

            {/* Visibility Status Dropdown */}
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="active">Active Fields</option>
              <option value="hidden">Hidden Fields</option>
              <option value="all">All Fields</option>
            </select>
          </div>
        </div>

        {/* 5. DATA TABLE */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden font-sans">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th 
                    onClick={() => toggleSort('label')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors select-none font-medium"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Field Name</span>
                      {sortField === 'label' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th 
                    onClick={() => toggleSort('createdOn')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors select-none font-medium whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Creation Date</span>
                      {sortField === 'createdOn' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleSort('lastModified')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors select-none font-medium whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Modified</span>
                      {sortField === 'lastModified' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFields.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-2">
                        <p className="text-sm font-semibold text-slate-700">No matching fields found</p>
                        <p className="text-xs text-slate-400">Try adjusting your search query or filter criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFields.map((field) => {
                    const typeConfig = FIELD_TYPE_CONFIG[field.type] || FIELD_TYPE_CONFIG.text;
                    const isSystemField = field.primarySlot === 'H1' || field.primarySlot === 'H2' || field.name === 'name' || field.name === 'phone';

                    return (
                      <tr 
                        key={field.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${field.isHidden ? 'opacity-60 bg-slate-50/40' : ''}`}
                      >
                        {/* Field Name (Non-bold, clean styling) */}
                        <td className="py-3 px-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-normal text-slate-800 text-sm">
                                {field.label}
                              </span>
                              {field.required && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium">
                                  Required
                                </span>
                              )}
                              {field.isUnique && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-medium">
                                  Unique
                                </span>
                              )}
                              {field.isHidden && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                                  Hidden
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              key: {field.name}
                            </span>
                          </div>
                        </td>

                        {/* Type Column */}
                        <td className="py-3 px-4">
                          <span className="text-slate-700 text-xs font-normal">
                            {typeConfig.label}
                            {field.options && field.options.length > 0 && (
                              <span className="ml-1 text-[10px] text-slate-400">
                                ({field.options.length} options)
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Creation Date Column */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-slate-600 text-xs font-normal">
                            {formatDateDisplay(field.createdOn)}
                          </span>
                        </td>

                        {/* Last Modified Column */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-slate-600 text-xs font-normal">
                            {formatDateDisplay(field.lastModified)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2 text-xs">
                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(field)}
                              className="font-medium text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Edit Field Configuration"
                            >
                              Edit
                            </button>

                            <span className="text-slate-300">|</span>

                            {/* Hide / Unhide */}
                            <button
                              onClick={() => handleToggleHideField(field)}
                              className={`font-medium transition-colors cursor-pointer ${
                                field.isHidden
                                  ? 'text-indigo-600 hover:text-indigo-800'
                                  : 'text-slate-700 hover:text-rose-600'
                              }`}
                              title={field.isHidden ? 'Unhide Field in CRM' : 'Hide Field from CRM Views'}
                            >
                              {field.isHidden ? 'Unhide' : 'Hide'}
                            </button>

                            {/* Delete */}
                            {!isSystemField && (
                              <>
                                <span className="text-slate-300">|</span>
                                <button
                                  onClick={() => {
                                    setFieldToDelete(field);
                                  }}
                                  className="font-medium text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                                  title="Delete Field"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT FIELD                                 */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* MODAL 1: CREATE / EDIT FIELD MODAL (MATCHING TELECRM DESIGN) */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 md:p-6 overflow-y-auto font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {editingField ? `Edit Field` : 'Create Field'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveField} className="space-y-4">
              {/* Row 1: Name and Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    placeholder=""
                    value={fieldName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] transition-all"
                  />
                  <p className="text-rose-500 text-[11px] mt-1 font-normal">
                    Name can be 1 to 40 letters in length.
                  </p>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      value={fieldType}
                      onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 pr-8 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] appearance-none cursor-pointer"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="multiselect">Multi-Select</option>
                      <option value="date">Date</option>
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="currency">Currency</option>
                      <option value="textarea">Textarea</option>
                      <option value="boolean">Checkbox</option>
                      <option value="url">URL</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-rose-500 text-[11px] mt-1 font-normal">
                    Please select a field type.
                  </p>
                </div>
              </div>

              {/* Options Builder if Dropdown / Multi-Select */}
              {(fieldType === 'dropdown' || fieldType === 'multiselect') && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <ListFilter className="w-3.5 h-3.5 text-[#5b21b6]" />
                      <span>Dropdown Choices</span>
                    </label>
                    <span className="text-[10px] text-slate-500">{fieldOptions.length} options</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Add an option..."
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                      className="flex-1 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#5b21b6]"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-1.5 bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-xs font-bold rounded-md cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {fieldOptions.map((opt, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold"
                      >
                        <span>{opt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 2: Description Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={fieldDescription}
                  onChange={(e) => setFieldDescription(e.target.value)}
                  placeholder=""
                  className="w-full bg-white border border-slate-300 rounded-md p-3 text-xs font-normal text-slate-800 focus:outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] resize-none"
                />
              </div>

              {/* Row 3: Properties Section */}
              <div className="border-t border-slate-100 pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
                  className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  <span>Properties</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isPropertiesOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPropertiesOpen && (
                  <div className="space-y-3.5 pt-1 text-xs">
                    {/* 1. Show in import */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                        <Download className="w-4 h-4 text-slate-500 stroke-[2]" />
                        <span>Show in import</span>
                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Allow this field in CSV / Excel bulk lead import" />
                      </div>
                      <PurpleToggleSwitch checked={fieldShowInImport} onChange={setFieldShowInImport} />
                    </div>

                    {/* 2. Show in quick add */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                        <span>Show in quick add</span>
                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Display this field in the Quick Add Lead drawer" />
                      </div>
                      <PurpleToggleSwitch checked={fieldShowInQuickAdd} onChange={setFieldShowInQuickAdd} />
                    </div>

                    {/* 3. Lock after create */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                        <span>Lock after create</span>
                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Value cannot be edited once lead record is created" />
                      </div>
                      <PurpleToggleSwitch checked={fieldLockAfterCreate} onChange={setFieldLockAfterCreate} />
                    </div>

                    {/* 4. Can use variable */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                          <span className="font-mono text-slate-500 font-bold text-sm leading-none">{'{ }'}</span>
                          <span>Can use variable</span>
                          <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Allow dynamic variable injection in WhatsApp & SMS templates" />
                        </div>
                        <PurpleToggleSwitch checked={fieldCanUseVariable} onChange={setFieldCanUseVariable} />
                      </div>

                      {/* Sub-item: Variable default value */}
                      {fieldCanUseVariable && (
                        <div className="flex items-center justify-between pl-3 animate-in fade-in">
                          <div className="flex items-center space-x-1.5 text-slate-600 font-bold text-xs">
                            <CornerDownRight className="w-4 h-4 text-slate-400" />
                            <span>Variable default value</span>
                          </div>
                          <input
                            type="text"
                            value={fieldVariableDefaultValue}
                            onChange={(e) => setFieldVariableDefaultValue(e.target.value)}
                            placeholder="NA"
                            className="w-44 bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#5b21b6]"
                          />
                        </div>
                      )}
                    </div>

                    {/* 5. Length Range (Text/Textarea/URL/Phone) */}
                    {(fieldType === 'text' || fieldType === 'textarea' || fieldType === 'url' || fieldType === 'phone') && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                          <ArrowLeftRight className="w-4 h-4 text-slate-500 stroke-[2]" />
                          <span>Length Range</span>
                          <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Character count minimum and maximum constraints" />
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                          <span>From</span>
                          <input
                            type="number"
                            value={fieldMinLength}
                            onChange={(e) => setFieldMinLength(e.target.value)}
                            className="w-14 bg-white border border-slate-300 rounded-md px-2 py-1 text-center text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5b21b6]"
                          />
                          <span>To</span>
                          <input
                            type="number"
                            value={fieldMaxLength}
                            onChange={(e) => setFieldMaxLength(e.target.value)}
                            className="w-16 bg-white border border-slate-300 rounded-md px-2 py-1 text-center text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5b21b6]"
                          />
                        </div>
                      </div>
                    )}

                    {/* 5B. Value Range (Currency/Number) */}
                    {(fieldType === 'currency' || fieldType === 'number') && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                          <IndianRupee className="w-4 h-4 text-slate-500 stroke-[2]" />
                          <span>Value Range</span>
                          <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Minimum and maximum numerical limits" />
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                          <span>Min</span>
                          <input
                            type="number"
                            value={fieldMinValue}
                            onChange={(e) => setFieldMinValue(e.target.value)}
                            className="w-20 bg-white border border-slate-300 rounded-md px-2 py-1 text-center text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5b21b6]"
                          />
                          <span>Max</span>
                          <input
                            type="number"
                            value={fieldMaxValue}
                            onChange={(e) => setFieldMaxValue(e.target.value)}
                            className="w-28 bg-white border border-slate-300 rounded-md px-2 py-1 text-center text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5b21b6]"
                          />
                        </div>
                      </div>
                    )}

                    {/* 6. Searchable */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                        <Search className="w-4 h-4 text-slate-500 stroke-[2]" />
                        <span>Searchable</span>
                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Make this custom field searchable in global lead search queries" />
                      </div>
                      <PurpleToggleSwitch checked={fieldSearchable} onChange={setFieldSearchable} />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {editingField ? 'Save Changes' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CHANGE PRIMARY UNIQUE IDENTIFIER                */}
      {/* ========================================================= */}
      {showChangeIdModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Change Primary Lead Identifier</h3>
              </div>
              <button
                onClick={() => setShowChangeIdModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Choose Primary Key:</label>
              <div className="space-y-2">
                {[
                  { key: 'phone', label: 'Phone Number' },
                  { key: 'email', label: 'Email Address' },
                  { key: 'pan', label: 'PAN Tax ID' },
                  { key: 'custom_id', label: 'Custom Lead ID' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedUniqueIdKey(opt.key)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedUniqueIdKey === opt.key
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-1 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {selectedUniqueIdKey === opt.key && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowChangeIdModal(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowChangeIdModal(false);
                  onShowToast(`Primary Lead Identifier changed to "${selectedUniqueIdKey.toUpperCase()}"`);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Save Identifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: SLOT ASSIGN (H1 / H2)                            */}
      {/* ========================================================= */}
      {showSlotAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold font-mono">
                  {showSlotAssignModal}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Assign Field to Header Slot {showSlotAssignModal}
                  </h3>
                  <p className="text-[11px] text-slate-500">Pick which field displays in this top prominent slot</p>
                </div>
              </div>
              <button
                onClick={() => setShowSlotAssignModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {customFields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleAssignSlot(showSlotAssignModal, f.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    f.primarySlot === showSlotAssignModal
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {renderFieldIcon(f.type)}
                    <div>
                      <p className="font-semibold text-slate-900">{f.label}</p>
                      <p className="text-[10px] text-slate-400 font-mono">key: {f.name}</p>
                    </div>
                  </div>
                  {f.primarySlot === showSlotAssignModal && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSlotAssignModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: DELETE FIELD CONFIRMATION                         */}
      {/* ========================================================= */}
      {fieldToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Delete Field?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete <strong className="text-slate-800 font-bold">"{fieldToDelete.label}"</strong>? This will remove it from all CRM views and forms.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2.5 pt-2">
              <button
                onClick={() => setFieldToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteField}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Delete Field
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


export const FieldsSettingsView = FieldsSettingsPage;
export default FieldsSettingsPage;
