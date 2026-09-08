import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { WorkflowNodeData } from '../../types/workflow.types';
import { AlertCircle, MoreVertical, ChevronDown } from 'lucide-react';
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

      case 'update_lead_fields': {
        const fieldUpdates: Array<{
          fieldName: string;
          fieldLabel?: string;
          operation?: string;
          valueMode?: string;
          variableLabel?: string;
          variableKey?: string;
          customValue?: string;
        }> = Array.isArray(config.fieldUpdates) && config.fieldUpdates.length > 0
          ? config.fieldUpdates
          : config.fieldName
          ? [{
              fieldName: config.fieldName,
              fieldLabel: config.fieldLabel,
              operation: config.fieldUpdateMode === 'clear' ? 'empty' : 'replace',
              variableLabel: config.variableLabel,
              variableKey: config.variableKey,
              customValue: config.customValue || config.fieldValue
            }]
          : [];

        if (fieldUpdates.length === 0 || !fieldUpdates[0]?.fieldName) {
          return (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-normal">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#DC2626]" />
                <span>Complete Field Selection</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-0.5 font-normal">
                No field selected
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-1 text-[11px] mt-2">
            {fieldUpdates.slice(0, 3).map((item, idx) => {
              const valText = item.operation === 'empty'
                ? 'Set as empty'
                : (item.variableLabel || item.variableKey || item.customValue || 'No value');
              return (
                <div key={idx} className="flex items-center gap-1.5 text-slate-700">
                  <span className="text-slate-600 font-semibold truncate max-w-[80px]">
                    {item.fieldLabel || item.fieldName}:
                  </span>
                  <span className="font-mono bg-purple-50 text-[#3a2088] border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-normal truncate max-w-[130px]">
                    {valText}
                  </span>
                </div>
              );
            })}
            {fieldUpdates.length > 3 && (
              <div className="text-[10px] text-slate-400 italic">
                +{fieldUpdates.length - 3} more fields
              </div>
            )}
          </div>
        );
      }

      case 'update_lead_rating': {
        const op = config.ratingOperation || 'replace';
        const val = config.ratingValue;
        const isConfigured = val !== undefined && val !== '';

        if (!isConfigured) {
          return (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-normal">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#DC2626]" />
                <span>Select Rating</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-0.5 font-normal flex items-center gap-1">
                <span>⭐</span>
                <span>Rating</span>
              </div>
            </div>
          );
        }

        const opLabel = op === 'increment' ? 'Increment by' : op === 'decrement' ? 'Decrement by' : 'Replace with';

        return (
          <div className="space-y-1 text-[11px] mt-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium text-[11px] truncate">
              <span className="text-amber-500 font-bold">⭐</span>
              <span className="text-slate-700 font-semibold">{opLabel}:</span>
              <span className="font-mono bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-normal truncate max-w-[120px]">
                {val}
              </span>
            </div>
          </div>
        );
      }

      case 'update_lead_status': {
        const stageName = config.stageName || config.targetStage || config.status;
        const stageColor = config.stageColor || '#4A705E';
        const isConfigured = !!stageName;

        if (!isConfigured) {
          return (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-normal">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#DC2626]" />
                <span>No Status Selected</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-0.5 font-normal">
                Stage
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-1 text-[11px] mt-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium text-[11px] truncate">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: stageColor }}
              />
              <span className="font-semibold text-slate-800 truncate">{stageName}</span>
            </div>
          </div>
        );
      }

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

      case 'add_in_list': {
        const isConfigured = !!config.listName;
        if (!isConfigured) {
          return (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-normal">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#DC2626]" />
                <span>No List Selected</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-0.5 font-normal">
                List
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-1 text-[11px] mt-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium text-[11px] truncate">
              <span className="text-emerald-600 font-bold">📋</span>
              <span className="font-semibold text-slate-800 truncate">{config.listName}</span>
            </div>
          </div>
        );
      }

      case 'remove_from_list': {
        const isConfigured = !!config.removeListName;
        if (!isConfigured) {
          return (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-normal">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#DC2626]" />
                <span>No List Selected</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-0.5 font-normal">
                Labels
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-1 text-[11px] mt-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium text-[11px] truncate">
              <span className="text-rose-600 font-bold">✕</span>
              <span className="font-semibold text-slate-800 truncate">{config.removeListName}</span>
            </div>
          </div>
        );
      }

      case 'add_task': {
        const isConfigured = !!config.taskType;
        if (!isConfigured) {
          return (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-normal">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#DC2626]" />
                <span>Select Task Type</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-0.5 font-normal">
                Task
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-1 text-[11px] mt-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium text-[11px] truncate">
              <span>{config.taskType === 'Call Followup' ? '⏰' : '☑'}</span>
              <span className="font-semibold text-slate-800 truncate">{config.taskType}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-normal truncate">
              {config.deadlineValue || 15} {config.deadlineUnit || 'Minute'} {config.deadlineDirection || 'After'} • {config.assignTo || 'Lead Assignee'}
            </div>
          </div>
        );
      }

      case 'cancel_tasks': {
        const selected = Array.isArray(config.selectedTaskTypes) && config.selectedTaskTypes.length > 0
          ? config.selectedTaskTypes
          : (config.cancelTaskType ? [config.cancelTaskType] : []);
        const isConfigured = selected.length > 0;
        if (!isConfigured) {
          return (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-normal">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#DC2626]" />
                <span>Select Task Types</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-0.5 font-normal">
                Cancel
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-1 text-[11px] mt-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium text-[11px] truncate">
              <span className="text-rose-600 font-bold">✕</span>
              <span className="font-semibold text-slate-800 truncate">{selected.join(', ')}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-normal truncate">
              {selected.length === 1 ? '1 task type to cancel' : `${selected.length} task types to cancel`}
            </div>
          </div>
        );
      }

      case 'add_payment': {
        const hasAmount =
          (config.paymentAmount !== undefined && Number(config.paymentAmount) > 0) ||
          !!config.amountVariable;
        if (!hasAmount) {
          return (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-normal">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#DC2626]" />
                <span>Amount &gt; 0 required</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-0.5 font-normal">
                Payment
              </div>
            </div>
          );
        }
        const currSym = config.paymentCurrency === 'USD' ? '$' : config.paymentCurrency === 'EUR' ? '€' : config.paymentCurrency === 'AED' ? 'AED ' : '₹';
        const displayVal = config.amountMode === 'variable' && config.amountVariable
          ? config.amountVariable
          : `${currSym} ${(Number(config.paymentAmount) || 0).toLocaleString()}`;
        return (
          <div className="space-y-1 text-[11px] mt-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium text-[11px] truncate">
              <span className="text-emerald-600 font-bold">💳</span>
              <span className="font-semibold text-slate-800 truncate">{displayVal}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-normal truncate">
              {config.paymentStatus || 'PENDING'}
            </div>
          </div>
        );
      }

      case 'add_ivr_action': {
        const isConfigured = !!config.ivrActionType;
        if (!isConfigured) {
          return (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[#DC2626] text-[10px] font-normal">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#DC2626]" />
                <span>Select an IVR Action Type</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-0.5 font-normal">
                IVR Action
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-1 text-[11px] mt-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium text-[11px] truncate">
              <span className="text-cyan-600 font-bold">📞</span>
              <span className="font-semibold text-slate-800 truncate">{config.ivrActionType}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-normal truncate">
              {Object.keys(config.fieldMappings || {}).length > 0
                ? `${Object.keys(config.fieldMappings).length} fields mapped`
                : 'Default mapping'}
            </div>
          </div>
        );
      }

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
  const isSendWhatsapp = nodeData.catalogId === 'send_template' || nodeData.catalogId === 'send_list' || nodeData.catalogId === 'send_non_template' || nodeData.catalogId === 'send_interactive';
  const isTimeDelay = nodeData.catalogId === 'time_delay';

  if (isSendWhatsapp) {
    const waAccount = config.whatsappAccount;
    const isList = nodeData.catalogId === 'send_list';
    const isNonTemplate = nodeData.catalogId === 'send_non_template';
    const isInteractive = nodeData.catalogId === 'send_interactive';

    const headerTitle = isList
      ? 'Send Waca List To Lead'
      : isNonTemplate
      ? 'Send Non Template message'
      : isInteractive
      ? 'Send Waca Interactive To Lead'
      : 'Send Whatsapp To Lead';

    let subText = config.templateName || 'Select Template';
    if (isList) {
      const rowCount = (config.sections || []).reduce((acc: number, s: any) => acc + (s.rows?.length || 0), 0);
      subText = config.whatsappAccount
        ? `${config.buttonText || 'Select Option'} (${rowCount} options)`
        : 'Select Account';
    } else if (isNonTemplate) {
      const msgType = (config.messageType || 'text').toUpperCase();
      subText = config.whatsappAccount
        ? `${msgType}: ${config.messageText ? config.messageText.slice(0, 24) + (config.messageText.length > 24 ? '...' : '') : 'Custom message'}`
        : 'Select Account';
    } else if (isInteractive) {
      if (config.whatsappAccount) {
        if (config.interactiveType === 'cta') {
          subText = `${config.ctaUrlLabel || 'Website'} • ${config.ctaPhoneLabel || 'Call'}`;
        } else {
          const btnTitles = (config.buttons || []).map((b: any) => b.title).filter(Boolean);
          subText = btnTitles.length > 0 ? btnTitles.join(', ') : 'Quick Reply Buttons';
        }
      } else {
        subText = 'Select Interactive';
      }
    }

    return (
      <div
        className={`relative min-w-[270px] max-w-[310px] rounded-2xl bg-white border font-sans transition-all duration-150 shadow-xs ${
          selected
            ? 'border-emerald-600 ring-2 ring-emerald-400/20 shadow-md'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        {/* Target Input Handle (Left - White ring with gray border) */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="!w-3.5 !h-3.5 !bg-white !border-2 !border-slate-300 !rounded-full !cursor-crosshair shadow-xs"
        />

        {/* Node Header (Solid Emerald Green per Screenshot 2) */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#008952] text-white rounded-t-2xl">
          <div className="flex items-center gap-2 truncate">
            <WorkflowIcon id={nodeData.catalogId || 'send_template'} size={15} className="text-white shrink-0" />
            <span className="text-xs font-bold tracking-tight text-white truncate">
              {headerTitle}
            </span>
          </div>
          <button type="button" className="text-white/90 hover:text-white p-0.5 rounded cursor-pointer shrink-0">
            <MoreVertical className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Node Body (Matching Screenshot 2) */}
        <div className="p-3.5 bg-white rounded-b-2xl space-y-2.5">
          {/* Top Status Badge */}
          {!waAccount ? (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-2.5 py-1.5 flex items-center justify-center gap-1.5 text-[#DC2626] text-[11px] font-normal">
              <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
              <span>Select Whatsapp Business Account</span>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 flex items-center justify-center gap-1.5 text-emerald-800 text-[11px] font-medium truncate">
              <WorkflowIcon id={nodeData.catalogId || 'send_template'} size={13} className="text-emerald-600 shrink-0" />
              <span className="truncate">{waAccount}</span>
            </div>
          )}

          {/* Bottom Details Placeholder / Summary */}
          <div className="text-xs text-slate-700 flex items-center justify-center gap-1.5 font-normal truncate px-1">
            {!waAccount && <WorkflowIcon id={nodeData.catalogId || 'send_template'} size={13} className="text-slate-500 shrink-0" />}
            <span className="truncate">{subText}</span>
          </div>
        </div>

        {/* Top Output Handle (Green ring - Delivered) */}
        <Handle
          type="source"
          position={Position.Right}
          id="delivered"
          style={{ top: '55%' }}
          className="!w-3.5 !h-3.5 !bg-white !border-2 !border-[#10B981] !rounded-full !cursor-crosshair shadow-xs"
        />

        {/* Bottom Output Handle (Red ring - Failed) */}
        <Handle
          type="source"
          position={Position.Right}
          id="failed"
          style={{ top: '78%' }}
          className="!w-3.5 !h-3.5 !bg-white !border-2 !border-[#EF4444] !rounded-full !cursor-crosshair shadow-xs"
        />
      </div>
    );
  }

  if (isTimeDelay) {
    const val = config.delayValue !== undefined ? config.delayValue : 10;
    const unit = config.delayUnit || 'Minute';
    const dir = config.delayDirection || 'After';
    const ref = config.delayReference || 'Previous step';

    return (
      <div
        className={`relative min-w-[240px] max-w-[280px] rounded-2xl bg-white border font-sans transition-all duration-150 shadow-xs ${
          selected
            ? 'border-rose-500 ring-2 ring-rose-400/20 shadow-md'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        {/* Target Input Handle (Left - White ring) */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="!w-3.5 !h-3.5 !bg-white !border-2 !border-slate-300 !rounded-full !cursor-crosshair shadow-xs"
        />

        {/* Node Header (Solid Vibrant Coral-Red per Image 2) */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#FB4B60] text-white rounded-t-2xl">
          <span className="text-xs font-bold tracking-tight text-white">
            Set Delay
          </span>
          <button type="button" className="text-white/90 hover:text-white p-0.5 rounded">
            <MoreVertical className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Node Body (Soft Pink Card per Image 2) */}
        <div className="p-3 bg-white rounded-b-2xl">
          <div className="bg-[#FCDADF] border border-[#FBC4CB] rounded-xl p-3 flex flex-col items-center gap-2">
            {/* Top row: 10 | Minute ▾ | */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-800">
              <span className="font-bold border-b border-slate-700 px-1.5 pb-0.5 text-center min-w-[20px]">
                {val}
              </span>
              <span className="text-slate-400">|</span>
              <span className="font-semibold flex items-center gap-1 text-slate-800">
                {unit}
                <ChevronDown className="w-3 h-3 text-slate-600" />
              </span>
              <span className="text-slate-400">|</span>
            </div>

            {/* Middle row: After ▾ */}
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
              <span>{dir}</span>
              <ChevronDown className="w-3 h-3 text-slate-600" />
            </div>

            {/* Bottom row: [ Previous step ▾ ] */}
            <div className="w-full bg-white/60 border border-slate-300/60 rounded-lg py-1 px-2.5 flex items-center justify-between text-xs font-medium text-slate-700 shadow-2xs">
              <span className="truncate">{ref}</span>
              <ChevronDown className="w-3 h-3 text-slate-500 shrink-0 ml-1" />
            </div>
          </div>
        </div>

        {/* Source Output Handle (Right - White ring) */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="!w-3.5 !h-3.5 !bg-white !border-2 !border-slate-300 !rounded-full !cursor-crosshair shadow-xs"
        />
      </div>
    );
  }

  const isLeadAction = 
    nodeData.catalogId === 'update_lead_assignee' ||
    nodeData.catalogId === 'update_lead_fields' ||
    nodeData.catalogId === 'add_in_list' ||
    nodeData.catalogId === 'remove_from_list' ||
    nodeData.catalogId === 'update_lead_status' ||
    nodeData.catalogId === 'update_lead_rating';

  const getLeadActionTitle = () => {
    if (nodeData.label) return nodeData.label;
    switch (nodeData.catalogId) {
      case 'update_lead_assignee':
        return 'Update Lead Assignee';
      case 'update_lead_fields':
        return 'Update Lead Fields';
      case 'add_in_list':
        return 'Add in List(s)';
      case 'remove_from_list':
        return 'Remove from List(s)';
      case 'update_lead_status':
        return 'Update Lead Status';
      case 'update_lead_rating':
        return 'Update Lead Rating';
      default:
        return 'Lead Action';
    }
  };

  if (isLeadAction) {
    return (
      <div
        className={`relative min-w-[240px] max-w-[290px] rounded-2xl bg-white border font-sans transition-all duration-150 shadow-xs ${
          selected
            ? 'border-red-600 ring-2 ring-red-400/20 shadow-md'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        {/* Target Input Handle (Left - White ring) */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="!w-4 !h-4 !bg-white !border-2 !border-slate-300 !rounded-full !cursor-crosshair shadow-xs"
        />

        {/* Node Header (Solid Vibrant Red #EF0024 - Matching Update Lead Assignee) */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#EF0024] text-white rounded-t-2xl">
          <span className="text-xs font-bold tracking-tight text-white">
            {getLeadActionTitle()}
          </span>
          <button type="button" className="text-white/90 hover:text-white p-0.5 rounded cursor-pointer">
            <MoreVertical className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Node Body (White background with preview contents) */}
        <div className="p-3 bg-white rounded-b-2xl min-h-[64px] flex flex-col items-center justify-center w-full">
          <div className="w-full">{preview}</div>
        </div>

        {/* Source Output Handle (Right - White ring) */}
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
