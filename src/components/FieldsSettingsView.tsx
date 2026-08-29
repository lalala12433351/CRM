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
  Layers
} from 'lucide-react';
import { CustomFieldDef, CustomFieldType, Agent, isAgentAdmin } from '../types';

interface FieldsSettingsViewProps {
  customFields: CustomFieldDef[];
  activeAgent?: Agent;
  onUpdateFields: (fields: CustomFieldDef[]) => void;
  onShowToast?: (message: string) => void;
  onBackToLeads?: () => void;
}

const FIELD_TYPE_CONFIG: Record<CustomFieldType, { label: string; icon: any; color: string; bg: string }> = {
  text: { label: 'Text', icon: null, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  phone: { label: 'Phone', icon: null, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  email: { label: 'Email', icon: null, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  number: { label: 'Number', icon: null, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  dropdown: { label: 'Dropdown', icon: null, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  multiselect: { label: 'Multi-Select', icon: null, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  date: { label: 'Date', icon: null, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  currency: { label: 'Currency', icon: null, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  textarea: { label: 'Textarea', icon: null, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  boolean: { label: 'Checkbox', icon: null, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  url: { label: 'URL', icon: null, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
};

export const FieldsSettingsView: React.FC<FieldsSettingsViewProps> = ({
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
  const [fieldType, setFieldType] = useState<CustomFieldType>('text');
  const [fieldCategory, setFieldCategory] = useState<'General' | 'Contact' | 'Academic/Career' | 'Custom'>('General');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldUnique, setFieldUnique] = useState(false);
  const [fieldShowInQuickAdd, setFieldShowInQuickAdd] = useState(true);
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
    setFieldPlaceholder('');
    setFieldDescription('');
    setFieldOptions(['Option 1', 'Option 2', 'Option 3']);
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

    if (editingField) {
      // Update existing
      const updatedList = customFields.map((f) => {
        if (f.id === editingField.id) {
          return {
            ...f,
            label: trimmedLabel,
            name: finalKey,
            type: fieldType,
            category: fieldCategory,
            required: fieldRequired,
            isUnique: fieldUnique,
            showInQuickAdd: fieldShowInQuickAdd,
            placeholder: fieldPlaceholder.trim(),
            description: fieldDescription.trim(),
            options: (fieldType === 'dropdown' || fieldType === 'multiselect') ? fieldOptions : undefined,
            lastModified: 'Just now',
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
        type: fieldType,
        category: fieldCategory,
        required: fieldRequired,
        isUnique: fieldUnique,
        showInQuickAdd: fieldShowInQuickAdd,
        placeholder: fieldPlaceholder.trim(),
        description: fieldDescription.trim(),
        options: (fieldType === 'dropdown' || fieldType === 'multiselect') ? fieldOptions : undefined,
        createdOn: 'Just now',
        lastModified: 'Just now',
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
    const updated = customFields.map((f) => {
      if (f.id === field.id) {
        const nextState = !f.isHidden;
        onShowToast(nextState ? `Field "${f.label}" hidden from CRM` : `Field "${f.label}" unhidden and active!`);
        return { ...f, isHidden: nextState, lastModified: 'Just now' };
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
    const updated = customFields.map((f) => {
      if (f.id === targetFieldId) {
        return { ...f, primarySlot: slot, isPrimary: true, isHidden: false, lastModified: 'Just now' };
      }
      if (f.primarySlot === slot && f.id !== targetFieldId) {
        return { ...f, primarySlot: null, isPrimary: false, lastModified: 'Just now' };
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

  const renderFieldIcon = (_type: CustomFieldType) => {
    return null;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-5 p-1 sm:p-2 md:p-4 font-sans text-slate-900 animate-in fade-in duration-200">
      
      {/* 1. TOP BAR / TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl md:text-3xl font-bold font-sans text-slate-900 tracking-tight flex items-center gap-2">
              <span>Fields Settings</span>
            </h1>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1 font-normal font-sans">
            <span>Lead Id</span>
            <a 
              href="#learn-more" 
              onClick={(e) => { e.preventDefault(); onShowToast('Lead ID represents the primary unique identifier key for deduplication and phone lookup.'); }} 
              className="text-slate-700 hover:text-slate-900 hover:underline font-normal"
            >
              Learn more
            </a>
          </div>
        </div>

        {/* Action Button: + Add Field */}
        <div className="flex items-center space-x-2.5 font-sans">
          {onBackToLeads && (
            <button
              onClick={onBackToLeads}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer"
            >
              Back to Leads
            </button>
          )}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs md:text-sm font-medium transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm shadow-blue-500/20"
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
          <h2 className="text-xs font-bold font-sans text-slate-900 uppercase tracking-wider">
            PRIMARY FIELDS (ASSIGN)
          </h2>
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
          <h2 className="text-xs font-bold font-sans text-slate-900 uppercase tracking-wider">
            OTHER FIELDS
          </h2>
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
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-normal uppercase tracking-wider text-[11px]">
                  <th 
                    onClick={() => toggleSort('label')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors select-none"
                  >
                    <span>Field Name</span>
                  </th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFields.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-400">
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
                        {/* Field Name */}
                        <td className="py-3 px-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-900 text-sm">
                                {field.label}
                              </span>
                              {field.required && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                  Required
                                </span>
                              )}
                              {field.isUnique && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                                  Unique
                                </span>
                              )}
                              {field.isHidden && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold">
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

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2 text-xs">
                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(field)}
                              className="font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Edit Field Configuration"
                            >
                              Edit
                            </button>

                            <span className="text-slate-300">|</span>

                            {/* Hide / Unhide */}
                            <button
                              onClick={() => handleToggleHideField(field)}
                              className={`font-semibold transition-colors cursor-pointer ${
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
                                    if (!isAdmin) {
                                      onShowToast('Access Restricted: Only Admin accounts can delete lead fields.');
                                      return;
                                    }
                                    setFieldToDelete(field);
                                  }}
                                  className="font-semibold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
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
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-5 md:p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
                  {editingField ? <Edit3 className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingField ? `Edit Field: ${editingField.label}` : 'Add a new Field'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define field attributes, data type, options, and validation rules
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveField} className="space-y-4">
              {/* Field Label & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Field Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Passport Expiry Date"
                    value={fieldName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    System Identifier Key
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. passport_expiry_date"
                    value={fieldKey}
                    onChange={(e) => setFieldKey(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Field Type Selection Grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Select Field Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(FIELD_TYPE_CONFIG) as CustomFieldType[]).map((typeKey) => {
                    const item = FIELD_TYPE_CONFIG[typeKey];
                    const ItemIcon = item.icon;
                    const isSelected = fieldType === typeKey;

                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => setFieldType(typeKey)}
                        className={`flex items-center space-x-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-bold ring-1 ring-indigo-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-medium'
                        }`}
                      >
                        <ItemIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dropdown Options Builder (if Dropdown or Multi-Select) */}
              {(fieldType === 'dropdown' || fieldType === 'multiselect') && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Dropdown Options List</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {fieldOptions.length} choices configured
                    </span>
                  </div>

                  {/* Add Option Input */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Add an option (e.g. Commercial Pilot)..."
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
                    >
                      Add
                    </button>
                  </div>

                  {/* Options Chips */}
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                    {fieldOptions.map((opt, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold shadow-2xs"
                      >
                        <span>{opt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-slate-400 hover:text-rose-600 ml-1 p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Category & Placeholder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={fieldCategory}
                    onChange={(e) => setFieldCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="General">General Information</option>
                    <option value="Contact">Contact Details</option>
                    <option value="Academic/Career">Academic Career</option>
                    <option value="Custom">Custom Extra</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Placeholder Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Enter valid passport number"
                    value={fieldPlaceholder}
                    onChange={(e) => setFieldPlaceholder(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Help Text</label>
                <input
                  type="text"
                  placeholder="e.g. As per government issued passport document"
                  value={fieldDescription}
                  onChange={(e) => setFieldDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Validation & Behavior Toggles */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-800 font-semibold">
                  <input
                    type="checkbox"
                    checked={fieldRequired}
                    onChange={(e) => setFieldRequired(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Required Field (Must be entered to save lead)</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-800 font-semibold">
                  <input
                    type="checkbox"
                    checked={fieldUnique}
                    onChange={(e) => setFieldUnique(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Unique Value Check (Prevent duplicate lead creation)</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-800 font-semibold">
                  <input
                    type="checkbox"
                    checked={fieldShowInQuickAdd}
                    onChange={(e) => setFieldShowInQuickAdd(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Display in Quick Add Lead Form</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5034a8] hover:bg-[#432993] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
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
