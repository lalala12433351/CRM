import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DynamicIcon } from '../DynamicIcon';
import { WorkflowNodeData } from '../../types/workflow.types';

export const ActionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const config = nodeData.config || {};

  const renderActionPreview = () => {
    switch (nodeData.catalogId) {
      case 'capi':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
            <span className="font-bold text-[#3a2088]">Meta CAPI:</span>
            <span className="font-mono bg-[#EDE9FE] text-[#3a2088] border border-[#DDD6FE] px-1.5 py-0.5 rounded text-[10px] font-bold">
              {config.capiEventName || 'Lead'}
            </span>
          </div>
        );
      case 'call_api':
        return (
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                {config.method || 'POST'}
              </span>
              <span className="font-mono text-[10px] text-slate-700 font-semibold truncate max-w-[150px]">
                {config.endpointUrl || 'https://api.domain.com'}
              </span>
            </div>
          </div>
        );
      case 'send_template':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
            <span className="text-emerald-700 font-bold">WA:</span>
            <span className="font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold truncate max-w-[160px]">
              {config.templateName || 'welcome_msg'}
            </span>
          </div>
        );
      case 'update_lead_status':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
            <span className="text-[#3a2088] font-bold">Stage:</span>
            <span className="bg-[#EDE9FE] text-[#3a2088] border border-[#DDD6FE] px-2 py-0.5 rounded text-[10px] font-bold">
              {config.targetStage || 'Contacted'}
            </span>
          </div>
        );
      case 'update_lead_assignee':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
            <span className="text-indigo-700 font-bold">Assign:</span>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold capitalize">
              {config.assigneeType === 'round_robin' ? 'Round Robin' : config.assigneeAgentName || 'Specific Agent'}
            </span>
          </div>
        );
      case 'time_delay':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
            <span className="text-amber-700 font-bold">Wait:</span>
            <span className="font-mono bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {config.delayValue || 15} {config.delayUnit || 'minutes'}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  const preview = renderActionPreview();

  return (
    <div
      className={`relative min-w-[260px] max-w-[290px] rounded-lg bg-white border transition-all duration-200 shadow-xs ${
        selected
          ? 'border-slate-800 ring-2 ring-slate-400/20 shadow-md'
          : 'border-slate-200/90 hover:border-slate-400'
      }`}
    >
      {/* Target Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={true}
        className="!w-4 !h-4 !bg-slate-700 !border-2 !border-white hover:!scale-125 !transition-transform !shadow-sm !-left-2 z-50 cursor-crosshair"
      />

      {/* Node Header (Solid Background, No Gradient, No Header Icon) */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 text-white rounded-t-lg">
        <div className="text-[11px] font-bold tracking-wider uppercase">
          <span>ACTION STEP</span>
        </div>
        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-slate-200">
          Step
        </span>
      </div>

      {/* Node Body */}
      <div className="p-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            <DynamicIcon name={nodeData.iconName || 'PlayCircle'} className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {nodeData.label || 'Action Step'}
            </div>
            {preview && <div className="mt-1">{preview}</div>}
          </div>
        </div>
      </div>

      {/* Source Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={true}
        className="!w-4 !h-4 !bg-slate-700 !border-2 !border-white hover:!scale-125 !transition-transform !shadow-sm !-right-2 z-50 cursor-crosshair"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';

