import React, { useState } from 'react';
import {
  X,
  ChevronDown,
  ListFilter,
  Download,
  Info,
  CornerDownRight,
  ArrowLeftRight,
  IndianRupee,
  Search
} from 'lucide-react';
import { CustomFieldDef, CustomFieldType } from '../types';

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

export interface LeadFieldEditorModalProps {
  customFields: CustomFieldDef[];
  editingField?: CustomFieldDef | null;
  isAdmin?: boolean;
  onClose: () => void;
  onUpdateFields: (fields: CustomFieldDef[]) => void;
  onShowToast?: (message: string) => void;
  onFieldSaved?: (field: CustomFieldDef) => void;
}

export const LeadFieldEditorModal: React.FC<LeadFieldEditorModalProps> = ({
  customFields,
  editingField = null,
  isAdmin = true,
  onClose,
  onUpdateFields,
  onShowToast = (_message: string) => {},
  onFieldSaved
}) => {
  const [fieldName, setFieldName] = useState(editingField?.label || '');
  const [fieldKey, setFieldKey] = useState(editingField?.name || '');
  const [fieldType, setFieldType] = useState<CustomFieldType | ''>(editingField?.type || 'text');
  const [fieldCategory, setFieldCategory] = useState<'General' | 'Contact' | 'Academic/Career' | 'Custom'>(
    (editingField?.category as 'General' | 'Contact' | 'Academic/Career' | 'Custom') || 'General'
  );
  const [fieldRequired, setFieldRequired] = useState(!!editingField?.required);
  const [fieldUnique, setFieldUnique] = useState(!!editingField?.isUnique);
  const [fieldShowInQuickAdd, setFieldShowInQuickAdd] = useState(editingField ? editingField.showInQuickAdd !== false : true);
  const [fieldShowInImport, setFieldShowInImport] = useState(editingField ? editingField.showInImport !== false : true);
  const [fieldLockAfterCreate, setFieldLockAfterCreate] = useState(!!editingField?.lockAfterCreate);
  const [fieldCanUseVariable, setFieldCanUseVariable] = useState(editingField ? editingField.canUseVariable !== false : true);
  const [fieldVariableDefaultValue, setFieldVariableDefaultValue] = useState(editingField?.variableDefaultValue || 'NA');
  const [fieldMinLength, setFieldMinLength] = useState<number | string>(editingField?.minLength ?? 1);
  const [fieldMaxLength, setFieldMaxLength] = useState<number | string>(editingField?.maxLength ?? 102);
  const [fieldMinValue, setFieldMinValue] = useState<number | string>(editingField?.minValue ?? 0);
  const [fieldMaxValue, setFieldMaxValue] = useState<number | string>(editingField?.maxValue ?? 10000000);
  const [fieldSearchable, setFieldSearchable] = useState(!!editingField?.isSearchable);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [fieldPlaceholder, setFieldPlaceholder] = useState(editingField?.placeholder || '');
  const [fieldDescription, setFieldDescription] = useState(editingField?.description || '');
  const [fieldOptions, setFieldOptions] = useState<string[]>(editingField?.options ? [...editingField.options] : []);
  const [optionInput, setOptionInput] = useState('');

  const handleNameChange = (val: string) => {
    setFieldName(val);
    if (!editingField) {
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
    const shared = {
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
      lastModified: nowIso
    };

    if (editingField) {
      const updatedField: CustomFieldDef = { ...editingField, ...shared };
      onUpdateFields(customFields.map((f) => (f.id === editingField.id ? updatedField : f)));
      onShowToast(`Field "${trimmedLabel}" updated successfully!`);
      onFieldSaved?.(updatedField);
    } else {
      const newField: CustomFieldDef = {
        id: `f-${Date.now()}`,
        ...shared,
        createdOn: nowIso,
        isHidden: false
      };
      onUpdateFields([...customFields, newField]);
      onShowToast(`New field "${trimmedLabel}" added successfully!`);
      onFieldSaved?.(newField);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 md:p-6 overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 my-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {editingField ? 'Edit Field' : 'Create Field'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveField} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Name</label>
              <input
                type="text"
                required
                maxLength={40}
                value={fieldName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] transition-all"
              />
              <p className="text-rose-500 text-[11px] mt-1 font-normal">Name can be 1 to 40 letters in length.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
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
              <p className="text-rose-500 text-[11px] mt-1 font-normal">Please select a field type.</p>
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={fieldDescription}
              onChange={(e) => setFieldDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md p-3 text-xs font-normal text-slate-800 focus:outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] resize-none"
            />
          </div>

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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                    <Download className="w-4 h-4 text-slate-500 stroke-[2]" />
                    <span>Show in import</span>
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Allow this field in CSV / Excel bulk lead import" />
                  </div>
                  <PurpleToggleSwitch checked={fieldShowInImport} onChange={setFieldShowInImport} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                    <span>Show in quick add</span>
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Display this field in the Quick Add Lead drawer" />
                  </div>
                  <PurpleToggleSwitch checked={fieldShowInQuickAdd} onChange={setFieldShowInQuickAdd} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                    <span>Lock after create</span>
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Value cannot be edited once lead record is created" />
                  </div>
                  <PurpleToggleSwitch checked={fieldLockAfterCreate} onChange={setFieldLockAfterCreate} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                      <span className="font-mono text-slate-500 font-bold text-sm leading-none">{'{ }'}</span>
                      <span>Can use variable</span>
                      <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Allow dynamic variable injection in WhatsApp & SMS templates" />
                    </div>
                    <PurpleToggleSwitch checked={fieldCanUseVariable} onChange={setFieldCanUseVariable} />
                  </div>
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

          <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
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
  );
};
