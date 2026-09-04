import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DynamicIcon } from '../DynamicIcon';
import { WorkflowNodeData } from '../../types/workflow.types';
import { PlayCircle, ArrowRight } from 'lucide-react';

export const ActionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const config = nodeData.config || {};

  const renderActionPreview = () => {
    switch (nodeData.catalogId) {
      case 'capi':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Meta CAPI:</span>
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
              {config.capiEventName || 'Lead'}
            </span>
          </div>
        );
      case 'call_api':
        return (
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                {config.method || 'POST'}
              </span>
              <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                {config.endpointUrl || 'https://api.domain.com'}
              </span>
            </div>
          </div>
        );
      case 'send_template':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">WA:</span>
            <span className="font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[160px]">
              {config.templateName || 'welcome_msg'}
            </span>
          </div>
        );
      case 'update_lead_status':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="text-purple-600 dark:text-purple-400 font-semibold">Stage:</span>
            <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 px-1.5 py-0.5 rounded text-[10px] font-medium">
              {config.targetStage || 'Contacted'}
            </span>
          </div>
        );
      case 'update_lead_assignee':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Assign:</span>
            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] capitalize">
              {config.assigneeType === 'round_robin' ? 'Round Robin' : config.assigneeAgentName || 'Specific Agent'}
            </span>
          </div>
        );
      case 'time_delay':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Wait:</span>
            <span className="font-mono bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded text-[10px] font-semibold">
              {config.delayValue || 15} {config.delayUnit || 'minutes'}
            </span>
          </div>
        );
      default:
        return (
          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {nodeData.description || 'Configured action step'}
          </div>
        );
    }
  };

  return (
    <div
      className={`relative min-w-[260px] max-w-[300px] rounded-xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-md ${
        selected
          ? 'border-slate-700 dark:border-slate-300 ring-2 ring-slate-400/20 shadow-slate-500/10 shadow-lg'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
      }`}
    >
      {/* Target Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3.5 !h-3.5 !bg-slate-600 !border-2 !border-white dark:!border-slate-900 hover:!scale-125 !transition-transform !shadow-sm !-left-2"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-xl">
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
          <PlayCircle className="w-3.5 h-3.5 text-slate-300" />
          <span>ACTION</span>
        </div>
        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono text-slate-300">
          Step
        </span>
      </div>

      {/* Node Body */}
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
            <DynamicIcon name={nodeData.iconName || 'PlayCircle'} className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
              {nodeData.label || 'Action Step'}
            </div>
            <div className="mt-1">
              {renderActionPreview()}
            </div>
          </div>
        </div>
      </div>

      {/* Source Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3.5 !h-3.5 !bg-slate-600 !border-2 !border-white dark:!border-slate-900 hover:!scale-125 !transition-transform !shadow-sm !-right-2"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
