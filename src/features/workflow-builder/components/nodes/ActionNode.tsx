import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { WorkflowNodeData } from '../../types/workflow.types';
import { AlertCircle, MoreVertical } from 'lucide-react';
import { WorkflowIcon } from '../WorkflowIcons';

export const ActionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const config = nodeData.config || {};

  const renderActionPreview = () => {
    switch (nodeData.catalogId) {
      case 'call_api':
        if (!config.apiTemplate) {
          return (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-normal">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#DC2626]" />
                <span>Please select template</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-0.5 font-normal">
                No template selected
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-1 text-[11px] mt-2">
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

      case 'create_custom_action':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="text-indigo-700 font-medium">Action:</span>
            <span className="font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-normal truncate max-w-[160px]">
              {config.customActionName || 'Custom Logic'}
            </span>
          </div>
        );

      case 'notification_team_member': {
        const headerText = config.header || config.notificationTitle || '';
        const bodyText = config.body || config.notificationMessage || '';
        const target = config.teamMember || config.targetTeamMember || 'Assignee';

        if (!headerText && !bodyText) {
          return (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-normal">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#DC2626]" />
                <span>No template added</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-0.5 font-normal">
                Target: {target}
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-1 text-[11px] mt-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium text-[11px] truncate">
              <span className="text-[#3a2088] font-bold truncate">
                {headerText || 'Push Notification'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="px-1.5 py-0.2 rounded bg-purple-50 text-[#3a2088] border border-purple-200 font-medium shrink-0">
                {target}
              </span>
              {bodyText && (
                <span className="truncate max-w-[140px] text-slate-600 font-normal">
                  {bodyText}
                </span>
              )}
            </div>
          </div>
        );
      }

      case 'update_lead_assignee': {
        const selectedMembers: string[] = Array.isArray(config.selectedTeamMembers)
          ? config.selectedTeamMembers
          : (config.assigneeAgentName ? [config.assigneeAgentName] : []);
        const selectedCount = selectedMembers.length;

        if (selectedCount === 0) {
          return (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#DC2626]" />
              <span>No Option Selected</span>
            </div>
          );
        }

        const pctText = selectedCount > 0
          ? (selectedCount <= 2 || 100 % selectedCount === 0
              ? `${100 / selectedCount}%`
              : `${(100 / selectedCount).toFixed(1)}%`)
          : '0%';

        return (
          <div className="flex items-center justify-center gap-3 py-1">
            {selectedMembers.map((member) => {
              const initials = member
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <div
                  key={member}
                  className="w-14 h-14 bg-white rounded-xl shadow-xs border border-slate-100 flex flex-col items-center justify-center gap-1 hover:shadow-sm transition-all"
                  title={`${member} (${pctText})`}
                >
                  <div className="w-6 h-6 rounded-full bg-[#E0E7FF] text-[#4338CA] font-bold text-[10px] flex items-center justify-center">
                    {initials}
                  </div>
                  <div className="text-xs font-bold text-slate-700 leading-none">
                    {pctText}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'update_lead_fields':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="text-slate-600 font-medium">Field:</span>
            <span className="font-mono bg-slate-100 text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-normal">
              {config.fieldName || 'company'} = "{config.fieldValue || '...'}"
            </span>
          </div>
        );

      case 'update_lead_rating':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="text-amber-600 font-medium">Rating:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              config.targetRating === 'Hot' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
              config.targetRating === 'Warm' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {config.targetRating || 'Hot'}
            </span>
          </div>
        );

      case 'update_lead_status':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="text-[#3a2088] font-medium">Stage:</span>
            <span className="bg-[#EDE9FE] text-[#3a2088] border border-[#DDD6FE] px-2 py-0.5 rounded text-[10px] font-normal">
              {config.targetStage || 'Contacted'}
            </span>
          </div>
        );

      case 'time_delay':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="text-amber-700 font-medium">Wait:</span>
            <span className="font-mono bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-normal">
              {config.delayValue || 15} {config.delayUnit || 'minutes'}
            </span>
          </div>
        );

      case 'send_template':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="text-emerald-700 font-medium">Template:</span>
            <span className="font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-normal truncate max-w-[160px]">
              {config.templateName || 'welcome_msg'}
            </span>
          </div>
        );

      case 'add_in_list':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="text-emerald-700 font-medium">+ List:</span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-normal truncate max-w-[160px]">
              {config.listName || 'Campaign Audience'}
            </span>
          </div>
        );

      case 'remove_from_list':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="text-rose-700 font-medium">- List:</span>
            <span className="bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-normal truncate max-w-[160px]">
              {config.removeListName || 'Cold List'}
            </span>
          </div>
        );

      case 'add_task':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="text-blue-700 font-medium">Task:</span>
            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-normal truncate max-w-[160px]">
              {config.taskTitle || 'Follow up'}
            </span>
          </div>
        );

      case 'cancel_tasks':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="text-rose-700 font-medium">Cancel:</span>
            <span className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-normal">
              {config.cancelScope === 'all' ? 'All Open Tasks' : 'Overdue Tasks'}
            </span>
          </div>
        );

      case 'add_payment':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="text-emerald-700 font-medium">Payment:</span>
            <span className="font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
              ₹{(config.paymentAmount || 5000).toLocaleString()}
            </span>
          </div>
        );

      case 'add_ivr_action':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="text-cyan-700 font-medium">IVR Call:</span>
            <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 px-1.5 py-0.5 rounded text-[10px] font-normal truncate max-w-[160px]">
              {config.ivrCampaignName || 'Voice Bot Script'}
            </span>
          </div>
        );

      case 'capi':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 mt-2">
            <span className="font-medium text-[#3a2088]">Meta CAPI:</span>
            <span className="font-mono bg-[#EDE9FE] text-[#3a2088] border border-[#DDD6FE] px-1.5 py-0.5 rounded text-[10px] font-normal">
              {config.capiEventName || 'Lead'}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  const preview = renderActionPreview();
  const isUpdateAssignee = nodeData.catalogId === 'update_lead_assignee';

  if (isUpdateAssignee) {
    return (
      <div
        className={`relative min-w-[240px] max-w-[280px] rounded-2xl bg-white border font-sans transition-all duration-150 shadow-xs ${
          selected
            ? 'border-red-600 ring-2 ring-red-400/20 shadow-md'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        {/* Target Input Handle (Left - White ring from Image 3) */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="!w-4 !h-4 !bg-white !border-2 !border-slate-300 !rounded-full !cursor-crosshair shadow-xs"
        />

        {/* Node Header (Solid Vibrant Red from Image 3) */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#EF0024] text-white rounded-t-2xl">
          <span className="text-xs font-bold tracking-tight text-white">
            {nodeData.label || 'Update Lead Assignee'}
          </span>
          <button type="button" className="text-white/90 hover:text-white p-0.5 rounded">
            <MoreVertical className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Node Body (White background with assignee tiles) */}
        <div className="p-3 bg-white rounded-b-2xl min-h-[64px] flex items-center justify-center">
          {preview}
        </div>

        {/* Source Output Handle (Right - White ring from Image 3) */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="!w-4 !h-4 !bg-white !border-2 !border-slate-300 !rounded-full !cursor-crosshair shadow-xs"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative min-w-[270px] max-w-[300px] rounded-lg bg-white border font-sans transition-all duration-150 shadow-xs ${
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
        className="!w-3.5 !h-3.5 !bg-[#475569] !border-2 !border-white !rounded-full !cursor-crosshair shadow-sm"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 text-white rounded-t-lg">
        <div className="flex items-center gap-2 text-[11px] font-medium tracking-wider uppercase">
          <WorkflowIcon id={nodeData.catalogId || 'call_api'} size={13} className="text-slate-300" />
          <span>ACTION STEP</span>
        </div>
      </div>

      {/* Node Body */}
      <div className="p-4">
        <div className="text-xs font-normal text-slate-800 truncate">
          {nodeData.catalogId === 'call_api' ? 'Call API' : (nodeData.label || 'Action Step')}
        </div>
        {preview}
      </div>

      {/* Source Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3.5 !h-3.5 !bg-[#475569] !border-2 !border-white !rounded-full !cursor-crosshair shadow-sm"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
