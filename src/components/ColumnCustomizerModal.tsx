import React from 'react';
import { Columns3, Check, RotateCcw, X } from 'lucide-react';

export interface ColumnVisibility {
  phone: boolean;
  email: boolean;
  company: boolean;
  city: boolean;
  source: boolean;
  status: boolean;
  dealValue: boolean;
  aiScore: boolean;
  owner: boolean;
  createdAt: boolean;
  actions: boolean;
}

interface ColumnCustomizerModalProps {
  columns: ColumnVisibility;
  onChange: (columns: ColumnVisibility) => void;
  onClose: () => void;
}

export const ColumnCustomizerModal: React.FC<ColumnCustomizerModalProps> = ({
  columns,
  onChange,
  onClose
}) => {
  const columnLabels: { key: keyof ColumnVisibility; label: string; desc: string }[] = [
    { key: 'phone', label: 'Phone Number', desc: 'Direct dial & copy phone' },
    { key: 'email', label: 'Email Address', desc: 'Contact email' },
    { key: 'company', label: 'Company / Org', desc: 'Business organization' },
    { key: 'city', label: 'City / Location', desc: 'Geographic location' },
    { key: 'source', label: 'Lead Source', desc: 'Campaign acquisition channel' },
    { key: 'status', label: 'Lead Stage / Status', desc: 'Pipeline status pill' },
    { key: 'dealValue', label: 'Deal Value (₹)', desc: 'Estimated pipeline revenue' },
    { key: 'aiScore', label: 'AI Score & Rating', desc: 'Lead-IQ conversion score' },
    { key: 'owner', label: 'Assigned Agent', desc: 'Telecaller / agent avatar' },
    { key: 'createdAt', label: 'Created Date', desc: 'Lead capture timestamp' },
  ];

  const handleToggle = (key: keyof ColumnVisibility) => {
    onChange({
      ...columns,
      [key]: !columns[key]
    });
  };

  const handleReset = () => {
    onChange({
      phone: true,
      email: true,
      company: true,
      city: true,
      source: true,
      status: true,
      dealValue: true,
      aiScore: true,
      owner: true,
      createdAt: true,
      actions: true
    });
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-40 p-3.5 space-y-3 font-sans animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs">
          <Columns3 className="w-4 h-4 text-indigo-600" />
          <span>Customize Columns</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 ios-scroll text-xs">
        {columnLabels.map((col) => (
          <label
            key={col.key}
            onClick={() => handleToggle(col.key)}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
              columns[col.key] ? 'bg-indigo-50/70 text-indigo-950 font-semibold' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div>
              <span className="block">{col.label}</span>
              <span className="text-[10px] text-slate-400 font-normal">{col.desc}</span>
            </div>
            <div
              className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                columns[col.key]
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {columns[col.key] && <Check className="w-3 h-3" />}
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
        <button
          onClick={handleReset}
          className="text-slate-500 hover:text-slate-800 flex items-center space-x-1 font-medium cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>

        <button
          onClick={onClose}
          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
