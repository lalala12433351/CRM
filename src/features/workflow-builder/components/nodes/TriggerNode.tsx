import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { WorkflowNodeData } from '../../types/workflow.types';
import { EventIcon } from '../EventIcons';

export const TriggerNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;

  const getBottomLabel = (label?: string, catalogId?: string) => {
    if (!label) return 'Lead Status';
    if (label.toLowerCase().includes('lead status') || catalogId === 'on_lead_status_change') {
      return 'Lead Status';
    }
    // Remove starting "On " and trailing " Change" if present
    let clean = label.replace(/^On\s+/i, '');
    if (clean.toLowerCase().endsWith(' change')) {
      clean = clean.substring(0, clean.length - 7);
    }
    return clean;
  };

  const getIconType = (catalogId?: string, label?: string) => {
    if (catalogId === 'on_lead_status_change' || label?.toLowerCase().includes('lead status')) {
      return 'lead_status';
    }
    const id = (catalogId || '').toLowerCase();
    const l = (label || '').toLowerCase();

    if (id.includes('whatsapp') || l.includes('whatsapp')) return 'whatsapp';
    if (id.includes('facebook') || l.includes('facebook')) return 'facebook';
    if (id.includes('website') || l.includes('website')) return 'globe';
    if (id.includes('justdial') || l.includes('justdial')) return 'justdial';
    if (id.includes('woocommerce') || l.includes('woocommerce')) return 'woocommerce';
    if (id.includes('excel') || l.includes('excel')) return 'excel';
    if (id.includes('call') || id.includes('missed') || l.includes('call')) return 'phone';
    if (id.includes('payment') || l.includes('payment')) return 'payment';
    if (id.includes('recapture') || l.includes('recapture')) return 'lead_recapture';
    if (id.includes('ivr') || l.includes('ivr')) return 'ivr';
    if (id.includes('location') || l.includes('location')) return 'location';
    if (id.includes('note') || l.includes('note')) return 'file_text';
    if (id.includes('rating') || l.includes('rating')) return 'star';
    if (id.includes('assignment') || l.includes('assignment')) return 'user';
    return 'lead_status';
  };

  const bottomLabel = getBottomLabel(nodeData.label, nodeData.catalogId);
  const iconType = getIconType(nodeData.catalogId, nodeData.label);

  return (
    <div
      className={`relative min-w-[240px] max-w-[280px] font-sans select-none filter drop-shadow-sm transition-all ${
        selected ? 'ring-2 ring-[#45278d]/60 rounded-xl' : ''
      }`}
    >
      {/* Top Left 'EVENT' Tab matching screenshot */}
      <div className="flex items-end">
        <div className="bg-[#45278d] text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-t-[6px]">
          EVENT
        </div>
      </div>

      {/* Main Container */}
      <div className="overflow-visible rounded-tr-xl rounded-b-xl shadow-md border border-slate-200/90 bg-white">
        {/* Deep Purple Header */}
        <div className="bg-[#45278d] text-white px-5 py-3.5 rounded-tr-xl">
          <h3 className="text-sm sm:text-[15px] font-bold text-white tracking-tight leading-snug">
            {nodeData.label || 'On Lead Status Change'}
          </h3>
        </div>

        {/* White Card Body with Funnel/Event Icon & Label */}
        <div className="bg-white px-5 py-3.5 rounded-b-xl flex items-center justify-center relative min-h-[50px]">
          <div className="flex items-center gap-2.5 text-slate-700 font-medium text-xs sm:text-sm">
            <EventIcon type={iconType} size={18} />
            <span>{bottomLabel}</span>
          </div>

          {/* Right Handle: Circular White Node Output */}
          <Handle
            type="source"
            position={Position.Right}
            id="output"
            className="!w-3.5 !h-3.5 !bg-white !border !border-slate-300 !rounded-full shadow-2xs hover:scale-110 transition-transform !-right-[7px] cursor-crosshair"
          />
        </div>
      </div>
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';
