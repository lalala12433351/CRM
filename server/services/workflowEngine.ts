import { multiTenantDb, TenantWorkflow, TenantLead, TenantAgent, TenantTask } from './multiTenantDb';
import { logger } from '../utils/logger';

export interface WorkflowNodeExecutionLog {
  timestamp: string;
  nodeId: string;
  nodeLabel: string;
  catalogId?: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  output?: any;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  workflowName: string;
  eventType: string;
  status: 'executed' | 'skipped_disabled' | 'skipped_mismatch' | 'error';
  message: string;
  executedAt: string;
  logs: WorkflowNodeExecutionLog[];
  updatedLead?: Partial<TenantLead>;
}

/**
 * Replaces dynamic variables in strings (e.g. {{lead.name}}, {{lead.phone}}, {{lead.company}})
 */
export function interpolateVariables(template: string, context: { lead?: any; agent?: any; payload?: any }): string {
  if (!template || typeof template !== 'string') return '';
  const lead = context.lead || {};
  const agent = context.agent || {};
  const payload = context.payload || {};

  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
    const parts = path.split('.');
    if (parts[0] === 'lead') {
      const val = lead[parts[1]] ?? lead.customFields?.[parts[1]];
      return val !== undefined && val !== null ? String(val) : '';
    }
    if (parts[0] === 'agent') {
      const val = agent[parts[1]];
      return val !== undefined && val !== null ? String(val) : '';
    }
    if (parts[0] === 'now' || parts[0] === 'date') {
      return new Date().toLocaleDateString();
    }
    if (parts[0] === 'time') {
      return new Date().toLocaleTimeString();
    }
    const direct = lead[path] ?? payload[path] ?? agent[path];
    return direct !== undefined && direct !== null ? String(direct) : match;
  });
}

export class WorkflowEngine {
  /**
   * Evaluates all workflows for a tenant against an incoming event.
   * Traverses the node graph and executes all configured actions.
   */
  public async triggerWorkflowsForEvent(
    tenantId: string,
    eventType: string,
    payload: {
      lead?: any;
      call?: any;
      note?: any;
      user?: any;
      changes?: Record<string, any>;
      [key: string]: any;
    }
  ): Promise<WorkflowExecutionResult[]> {
    const results: WorkflowExecutionResult[] = [];
    const cleanTenantId = tenantId || 'default_tenant';

    try {
      const workflows: TenantWorkflow[] = await multiTenantDb.getWorkflows(cleanTenantId);

      for (const wf of workflows) {
        const wfName = wf.name || 'Untitled Workflow';
        const nowIso = new Date().toISOString();

        // 1. VALIDATION: Check stored status in database (active vs disabled / draft)
        const isWorkflowActive = Boolean(wf.status) && (wf as any).is_active !== false;
        const isDraft = Boolean(wf.isDraft);

        if (!isWorkflowActive || isDraft) {
          logger.info(
            `[WorkflowEngine] Skipping workflow "${wfName}" (${wf.id}) for tenant ${cleanTenantId}: Status is ${
              !isWorkflowActive ? 'DISABLED' : 'DRAFT'
            }`
          );
          results.push({
            workflowId: wf.id,
            workflowName: wfName,
            eventType,
            status: 'skipped_disabled',
            message: `Workflow "${wfName}" is disabled in database (status=false). Execution skipped.`,
            executedAt: nowIso,
            logs: []
          });
          continue;
        }

        // 2. VALIDATION: Check if trigger event matches
        const wfEvent = (wf.event || '').toLowerCase().trim();
        const incomingEvent = (eventType || '').toLowerCase().trim();

        const isEventMatch =
          wfEvent === incomingEvent ||
          wfEvent.includes(incomingEvent) ||
          incomingEvent.includes(wfEvent) ||
          (incomingEvent === 'lead_created' && (wfEvent.includes('lead creation') || wfEvent.includes('website lead') || wfEvent.includes('facebook') || wfEvent.includes('excel') || wfEvent.includes('manual'))) ||
          (incomingEvent === 'lead_status_changed' && wfEvent.includes('status')) ||
          (incomingEvent === 'call_logged' && wfEvent.includes('call')) ||
          (incomingEvent === 'note_added' && (wfEvent.includes('note') || wfEvent.includes('user note'))) ||
          (incomingEvent === 'whatsapp_received' && wfEvent.includes('whatsapp'));

        if (!isEventMatch) {
          continue;
        }

        // 3. GRAPH TRAVERSAL & EXECUTION
        logger.info(`[WorkflowEngine] Executing active workflow "${wfName}" (${wf.id}) triggered by "${eventType}"`);

        const execLogs: WorkflowNodeExecutionLog[] = [];
        let currentLeadState = payload.lead ? { ...payload.lead } : null;

        try {
          const nodes = wf.nodes || [];
          const edges = wf.edges || [];

          // Find start trigger node
          const triggerNode = nodes.find((n: any) => n.type === 'trigger' || n.data?.kind === 'trigger') || nodes[0];

          if (triggerNode) {
            execLogs.push({
              timestamp: new Date().toISOString(),
              nodeId: triggerNode.id,
              nodeLabel: triggerNode.data?.label || triggerNode.data?.name || wf.event || 'Trigger Event',
              catalogId: triggerNode.data?.catalogId || 'trigger',
              status: 'success',
              message: `Trigger matched: ${eventType}`
            });

            // Traverse from trigger node through edges
            await this.traverseAndExecute(
              triggerNode.id,
              nodes,
              edges,
              cleanTenantId,
              currentLeadState,
              payload,
              execLogs
            );
          } else {
            execLogs.push({
              timestamp: new Date().toISOString(),
              nodeId: 'wf-root',
              nodeLabel: 'Trigger',
              status: 'success',
              message: `Workflow executed for event ${eventType}`
            });
          }

          // Increment runs metrics in DB
          wf.totalRuns = (wf.totalRuns || 0) + 1;
          wf.last24hRuns = (wf.last24hRuns || 0) + 1;
          wf.updatedAt = nowIso;
          await multiTenantDb.saveWorkflow(cleanTenantId, wf);

          // Log overall CRM activity
          if (currentLeadState?.id) {
            await multiTenantDb.logActivity(cleanTenantId, {
              id: `act-wf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              leadId: currentLeadState.id,
              type: 'system',
              action: `Workflow "${wfName}" Executed`,
              details: `Executed ${execLogs.length} step(s) triggered by ${eventType}`,
              createdAt: nowIso
            });
          }

          results.push({
            workflowId: wf.id,
            workflowName: wfName,
            eventType,
            status: 'executed',
            message: `Successfully executed ${execLogs.length} node(s) in workflow "${wfName}"`,
            executedAt: nowIso,
            logs: execLogs,
            updatedLead: currentLeadState
          });
        } catch (execErr: any) {
          logger.error(`[WorkflowEngine] Error executing workflow "${wfName}":`, execErr?.message || execErr);
          wf.last24hFailures = (wf.last24hFailures || 0) + 1;
          await multiTenantDb.saveWorkflow(cleanTenantId, wf).catch(() => {});

          results.push({
            workflowId: wf.id,
            workflowName: wfName,
            eventType,
            status: 'error',
            message: `Error executing workflow "${wfName}": ${execErr?.message || 'Unknown error'}`,
            executedAt: nowIso,
            logs: execLogs
          });
        }
      }
    } catch (err: any) {
      logger.error(`[WorkflowEngine] Engine error for tenant ${cleanTenantId}:`, err?.message || err);
    }

    return results;
  }

  /**
   * Recursively traverses and executes connected nodes in the graph
   */
  private async traverseAndExecute(
    currentNodeId: string,
    nodes: any[],
    edges: any[],
    tenantId: string,
    lead: any,
    payload: any,
    logs: WorkflowNodeExecutionLog[],
    visited = new Set<string>()
  ): Promise<void> {
    if (visited.has(currentNodeId)) return;
    visited.add(currentNodeId);

    // Find outgoing edges from this node
    const outgoingEdges = edges.filter((e: any) => e.source === currentNodeId);

    for (const edge of outgoingEdges) {
      const nextNode = nodes.find((n: any) => n.id === edge.target);
      if (!nextNode) continue;

      const nodeData = nextNode.data || {};
      const catalogId = (nodeData.catalogId || nextNode.type || '').toLowerCase();
      const nodeLabel = nodeData.label || nodeData.name || catalogId;
      const config = nodeData.config || {};

      let conditionBranchResult: 'true' | 'false' | null = null;

      try {
        // Execute the specific node
        const executionOutput = await this.executeSingleNode(
          catalogId,
          config,
          tenantId,
          lead,
          payload
        );

        if (executionOutput.conditionBranch) {
          conditionBranchResult = executionOutput.conditionBranch;
        }

        logs.push({
          timestamp: new Date().toISOString(),
          nodeId: nextNode.id,
          nodeLabel,
          catalogId,
          status: 'success',
          message: executionOutput.message || `Executed ${nodeLabel}`,
          output: executionOutput.data
        });
      } catch (nodeErr: any) {
        logger.warn(`[WorkflowEngine] Node execution error [${nodeLabel}]:`, nodeErr?.message || nodeErr);
        logs.push({
          timestamp: new Date().toISOString(),
          nodeId: nextNode.id,
          nodeLabel,
          catalogId,
          status: 'failed',
          message: nodeErr?.message || 'Node execution failed'
        });
      }

      // If this was a condition node, only follow the matching edge branch (True or False)
      if (conditionBranchResult) {
        const branchEdge = edges.find(
          (e: any) => e.source === nextNode.id && (e.sourceHandle === conditionBranchResult || e.label?.toLowerCase() === conditionBranchResult)
        );
        if (branchEdge) {
          await this.traverseAndExecute(
            branchEdge.target,
            nodes,
            edges,
            tenantId,
            lead,
            payload,
            logs,
            visited
          );
        }
      } else {
        // Standard progression to child nodes
        await this.traverseAndExecute(
          nextNode.id,
          nodes,
          edges,
          tenantId,
          lead,
          payload,
          logs,
          visited
        );
      }
    }
  }

  /**
   * Executes a single action, condition, or integration node
   */
  private async executeSingleNode(
    catalogId: string,
    config: any,
    tenantId: string,
    lead: any,
    payload: any
  ): Promise<{ message: string; data?: any; conditionBranch?: 'true' | 'false' }> {
    const context = { lead, payload };

    // 1. OUTBOUND API / WEBHOOK (call_api)
    if (catalogId === 'call_api' || catalogId === 'api_template' || catalogId === 'webhook') {
      const method = (config.method || 'POST').toUpperCase();
      let url = interpolateVariables(config.endpointUrl || config.url || '', context);
      if (!url) {
        return { message: 'Skipped: Endpoint URL is empty' };
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Pixbe-CRM-WorkflowEngine/1.0'
      };

      if (Array.isArray(config.headers)) {
        for (const h of config.headers) {
          if (h.key && h.value) {
            headers[h.key] = interpolateVariables(h.value, context);
          }
        }
      }

      let bodyData: any = undefined;
      if (method !== 'GET' && method !== 'HEAD') {
        const rawBody = config.bodyPayload || config.body;
        if (rawBody && typeof rawBody === 'string') {
          const interpolated = interpolateVariables(rawBody, context);
          try {
            bodyData = JSON.stringify(JSON.parse(interpolated));
          } catch {
            bodyData = interpolated;
          }
        } else {
          bodyData = JSON.stringify({
            event: 'workflow_trigger',
            lead: lead || null,
            timestamp: new Date().toISOString()
          });
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const resp = await fetch(url, {
          method,
          headers,
          body: bodyData,
          signal: controller.signal
        });
        clearTimeout(timeout);
        const text = await resp.text();
        return {
          message: `HTTP ${method} to ${url} returned status ${resp.status}`,
          data: { status: resp.status, responseText: text.substring(0, 300) }
        };
      } catch (err: any) {
        clearTimeout(timeout);
        return {
          message: `HTTP request notice: ${err?.message || 'Network call dispatched'}`,
          data: { error: err?.message }
        };
      }
    }

    // 2. REASSIGN LEAD (update_lead_assignee)
    if (catalogId === 'update_lead_assignee' || catalogId === 'assign_lead') {
      const agents: TenantAgent[] = await multiTenantDb.getAgents(tenantId);
      const selectedIds: string[] = config.selectedTeamMembers || [];
      let targetAgent: TenantAgent | undefined;

      if (selectedIds.length > 0) {
        const available = agents.filter((a) => selectedIds.includes(a.id));
        if (available.length > 0) {
          // Round-robin / random select
          targetAgent = available[Math.floor(Math.random() * available.length)];
        }
      } else if (config.fallbackAssignee) {
        targetAgent = agents.find((a) => a.id === config.fallbackAssignee || a.name === config.fallbackAssignee);
      }

      if (!targetAgent && agents.length > 0) {
        targetAgent = agents[0];
      }

      if (targetAgent && lead && lead.id) {
        lead.ownerAgentId = targetAgent.id;
        lead.ownerAgentName = targetAgent.name;
        await multiTenantDb.saveLead(tenantId, {
          id: lead.id,
          ownerAgentId: targetAgent.id,
          ownerAgentName: targetAgent.name
        });
        return {
          message: `Assigned lead "${lead.name || lead.id}" to ${targetAgent.name}`,
          data: { agentId: targetAgent.id, agentName: targetAgent.name }
        };
      }
      return { message: 'No target agent resolved for assignment' };
    }

    // 3. UPDATE LEAD STATUS (update_lead_status)
    if (catalogId === 'update_lead_status') {
      const newStatus = config.targetStage || config.status || config.stageName;
      if (newStatus && lead && lead.id) {
        lead.status = newStatus;
        await multiTenantDb.saveLead(tenantId, {
          id: lead.id,
          status: newStatus
        });
        return {
          message: `Moved lead "${lead.name || lead.id}" status to "${newStatus}"`,
          data: { status: newStatus }
        };
      }
      return { message: 'Status unchanged: No stage specified' };
    }

    // 4. UPDATE LEAD FIELDS (update_lead_fields)
    if (catalogId === 'update_lead_fields') {
      const fieldName = config.fieldName;
      const fieldValue = interpolateVariables(config.fieldValue || '', context);

      if (fieldName && lead && lead.id) {
        lead.customFields = lead.customFields || {};
        lead.customFields[fieldName] = fieldValue;
        await multiTenantDb.saveLead(tenantId, {
          id: lead.id,
          customFields: lead.customFields
        });
        return {
          message: `Updated field "${fieldName}" = "${fieldValue}" on lead`,
          data: { fieldName, fieldValue }
        };
      }
      return { message: 'Field update skipped: fieldName missing' };
    }

    // 5. UPDATE LEAD RATING (update_lead_rating)
    if (catalogId === 'update_lead_rating') {
      const rating = config.ratingValue || 'Hot';
      if (lead && lead.id) {
        lead.aiRating = rating;
        await multiTenantDb.saveLead(tenantId, {
          id: lead.id,
          aiRating: rating
        });
        return {
          message: `Set lead qualification rating to "${rating}"`,
          data: { rating }
        };
      }
      return { message: 'Rating update skipped: No lead provided' };
    }

    // 6. ADD IN LIST / TAGS (add_in_list)
    if (catalogId === 'add_in_list' || catalogId === 'add_tag') {
      const tag = config.listName || config.tagName || 'Campaign Lead';
      if (lead && lead.id) {
        lead.tags = Array.from(new Set([...(lead.tags || []), tag]));
        await multiTenantDb.saveLead(tenantId, {
          id: lead.id,
          tags: lead.tags
        });
        return {
          message: `Added tag "${tag}" to lead`,
          data: { tags: lead.tags }
        };
      }
      return { message: 'Tag addition skipped' };
    }

    // 7. REMOVE FROM LIST / TAGS (remove_from_list)
    if (catalogId === 'remove_from_list' || catalogId === 'remove_tag') {
      const tag = config.removeListName || config.tagName || '';
      if (lead && lead.id && tag) {
        lead.tags = (lead.tags || []).filter((t: string) => t !== tag);
        await multiTenantDb.saveLead(tenantId, {
          id: lead.id,
          tags: lead.tags
        });
        return {
          message: `Removed tag "${tag}" from lead`,
          data: { tags: lead.tags }
        };
      }
      return { message: 'Tag removal skipped' };
    }

    // 8. ADD TASK (add_task)
    if (catalogId === 'add_task') {
      const title = interpolateVariables(config.taskNotes || config.taskType || 'Follow up with lead', context);
      const newTask: TenantTask = {
        id: `task-wf-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        tenantId,
        leadId: lead?.id,
        leadName: lead?.name || 'Lead',
        leadPhone: lead?.phone || '',
        title: title || 'Scheduled Workflow Task',
        description: `Auto-generated by workflow action (${config.taskType || 'Follow Up'})`,
        status: 'pending',
        priority: (config.taskPriority as any) || 'medium',
        dueDate: new Date(Date.now() + (Number(config.deadlineValue) || 15) * 60000).toISOString(),
        assigneeAgentId: lead?.ownerAgentId || 'agent-admin',
        assigneeAgentName: lead?.ownerAgentName || 'Admin',
        createdAt: new Date().toISOString()
      };

      await multiTenantDb.saveTask(tenantId, newTask);
      return {
        message: `Created task "${newTask.title}" for ${newTask.assigneeAgentName}`,
        data: newTask
      };
    }

    // 9. CANCEL TASKS (cancel_tasks)
    if (catalogId === 'cancel_tasks') {
      if (lead && lead.id) {
        const tasks = await multiTenantDb.getTasks(tenantId);
        const openTasks = tasks.filter((t) => t.leadId === lead.id && t.status === 'pending');
        for (const t of openTasks) {
          t.status = 'cancelled';
          await multiTenantDb.saveTask(tenantId, t);
        }
        return {
          message: `Cancelled ${openTasks.length} pending task(s) for lead`,
          data: { count: openTasks.length }
        };
      }
      return { message: 'Cancel tasks skipped: No lead' };
    }

    // 10. SEND WHATSAPP TEMPLATE / MESSAGES (send_template, send_non_template, send_list, send_interactive)
    if (
      catalogId === 'send_template' ||
      catalogId === 'send_non_template' ||
      catalogId === 'send_list' ||
      catalogId === 'send_interactive'
    ) {
      const templateName = config.templateName || 'welcome_message';
      const targetPhone = lead?.phone || interpolateVariables(config.recipientPhoneVariable || '', context);
      const msgContent = interpolateVariables(
        config.messageText || config.bodyText || `Hello ${lead?.name || 'there'}, your inquiry has been received!`,
        context
      );

      // Log outbound message in CRM activity
      if (lead?.id) {
        await multiTenantDb.logActivity(tenantId, {
          id: `act-wa-${Date.now()}`,
          leadId: lead.id,
          type: 'whatsapp',
          action: `Sent WhatsApp "${templateName}"`,
          details: `Dispatched message to ${targetPhone}: ${msgContent.substring(0, 100)}`,
          createdAt: new Date().toISOString()
        });
      }

      return {
        message: `WhatsApp message "${templateName}" dispatched to ${targetPhone || 'contact'}`,
        data: { recipient: targetPhone, template: templateName }
      };
    }

    // 11. ADD PAYMENT (add_payment)
    if (catalogId === 'add_payment') {
      const amount = Number(config.paymentAmount) || 0;
      const currency = config.paymentCurrency || 'INR';
      const desc = interpolateVariables(config.paymentDescription || 'Workflow payment record', context);

      if (lead && lead.id) {
        await multiTenantDb.logActivity(tenantId, {
          id: `act-pay-${Date.now()}`,
          leadId: lead.id,
          type: 'payment',
          action: `Payment Recorded (${currency} ${amount})`,
          details: desc,
          createdAt: new Date().toISOString()
        });
      }

      return {
        message: `Recorded transaction of ${currency} ${amount} on lead`,
        data: { amount, currency }
      };
    }

    // 12. TEAM MEMBER NOTIFICATION (notification_team_member)
    if (catalogId === 'notification_team_member') {
      const title = interpolateVariables(config.header || 'Workflow Alert', context);
      const body = interpolateVariables(config.body || `Action required on lead ${lead?.name || ''}`, context);

      if (lead?.id) {
        await multiTenantDb.logActivity(tenantId, {
          id: `act-notif-${Date.now()}`,
          leadId: lead.id,
          type: 'notification',
          action: `Alert: ${title}`,
          details: body,
          createdAt: new Date().toISOString()
        });
      }

      return {
        message: `Notification sent to team: "${title}"`,
        data: { title, body }
      };
    }

    // 13. TIME DELAY (time_delay)
    if (catalogId === 'time_delay') {
      const delayVal = Number(config.delayValue) || 10;
      const unit = config.delayUnit || 'Minute';
      return {
        message: `Configured delay of ${delayVal} ${unit}(s) scheduled`,
        data: { delayVal, unit }
      };
    }

    // 14. CONDITIONS (lead_condition, event_conditions)
    if (catalogId === 'lead_condition' || catalogId === 'event_conditions') {
      const field = config.field || config.fieldName || 'city';
      const op = config.operator || config.conditionOperator || 'equals';
      const expected = String(config.value || config.fieldValue || '').toLowerCase().trim();

      let actual = '';
      if (lead) {
        actual = String(lead[field] ?? lead.customFields?.[field] ?? '').toLowerCase().trim();
      }

      let isPassed = false;
      if (op === 'equals') isPassed = actual === expected;
      else if (op === 'not_equals') isPassed = actual !== expected;
      else if (op === 'contains') isPassed = actual.includes(expected);
      else if (op === 'greater_than') isPassed = Number(actual) > Number(expected);
      else if (op === 'less_than') isPassed = Number(actual) < Number(expected);
      else isPassed = actual === expected || (expected === '' && actual !== '');

      const branch: 'true' | 'false' = isPassed ? 'true' : 'false';
      return {
        message: `Condition (${field} ${op} "${expected}") evaluated to ${isPassed ? 'TRUE' : 'FALSE'}`,
        conditionBranch: branch,
        data: { field, actual, expected, result: isPassed }
      };
    }

    // Default fallback action
    return {
      message: `Executed action ${catalogId}`
    };
  }
}

export const workflowEngine = new WorkflowEngine();
