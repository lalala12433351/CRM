import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DynamicIcon } from '../DynamicIcon';
import { WorkflowNodeData } from '../../types/workflow.types';
import { AlertCircle } from 'lucide-react';

export const ActionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const config = nodeData.config || {};

  const renderActionPreview = () => {
    switch (nodeData.catalogId) {
      case 'call_api':
        if (!config.apiTemplate && !config.endpointUrl) {
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-normal">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#DC2626]" />
                <span>Please select template</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-0.5 font-normal">
                No API selected
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium text-[11px] truncate">
              <span className="text-[#3a2088] truncate">{config.apiTemplate || 'Custom API'}</span>
            </div>
            {config.endpointUrl && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  {config.method || 'POST'}
                </span>
                <span className="font-mono text-[10px] text-slate-600 font-normal truncate max-w-[150px]">
                  {config.endpointUrl}
                </span>
              </div>
            )}
          </div>
        );
      case 'capi':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
            <span className="font-medium text-[#3a2088]">Meta CAPI:</span>
            <span className="font-mono bg-[#EDE9FE] text-[#3a2088] border border-[#DDD6FE] px-1.5 py-0.5 rounded text-[10px] font-normal">
              {config.capiEventName || 'Lead'}
            </span>
          </div>
        );
      case 'send_template':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
            <span className="text-emerald-700 font-medium">WA:</span>
            <span className="font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-normal truncate max-w-[160px]">
              {config.templateName || 'welcome_msg'}
            </span>
          </div>
        );
      case 'update_lead_status':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
            <span className="text-[#3a2088] font-medium">Stage:</span>
            <span className="bg-[#EDE9FE] text-[#3a2088] border border-[#DDD6FE] px-2 py-0.5 rounded text-[10px] font-normal">
              {config.targetStage || 'Contacted'}
            </span>
          </div>
        );
      case 'update_lead_assignee':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
            <span className="text-indigo-700 font-medium">Assign:</span>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-normal capitalize">
              {config.assigneeType === 'round_robin' ? 'Round Robin' : config.assigneeAgentName || 'Specific Agent'}
            </span>
          </div>
        );
      case 'time_delay':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
            <span className="text-amber-700 font-medium">Wait:</span>
            <span className="font-mono bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-normal">
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
      className={`relative min-w-[260px] max-w-[290px] rounded-lg bg-white border transition-all duration-150 shadow-xs ${
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
        style={{
          width: 14,
          height: 14,
          backgroundColor: '#475569',
          border: '2px solid #ffffff',
          borderRadius: '50%',
          cursor: 'crosshair',
          zIndex: 50
        }}
      />

      {/* Node Header (Solid Background, No Gradient, No Header Icon, No Badge) */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 text-white rounded-t-lg">
        <div className="text-[11px] font-medium tracking-wider uppercase">
          <span>ACTION STEP</span>
        </div>
      </div>

      {/* Node Body */}
      <div className="p-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            <DynamicIcon name={nodeData.iconName || 'PlayCircle'} className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-normal text-slate-800 truncate">
              {nodeData.label || 'Action Step'}
            </div>
            {preview && <div className="mt-1 font-normal">{preview}</div>}
          </div>
        </div>
      </div>

      {/* Source Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={true}
        style={{
          width: 14,
          height: 14,
          backgroundColor: '#475569',
          border: '2px solid #ffffff',
          borderRadius: '50%',
          cursor: 'crosshair',
          zIndex: 50
        }}
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';

