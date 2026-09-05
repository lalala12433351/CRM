import { useState, useCallback, useRef, useEffect } from 'react';
import {
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  reconnectEdge
} from '@xyflow/react';
import {
  CustomWorkflowNode,
  WorkflowNodeData,
  CatalogItem,
  WorkflowSerialized
} from '../types/workflow.types';
import { SAMPLE_TEMPLATES } from '../constants/workflowCatalog';

export interface WorkflowSimulationStep {
  step: number;
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  log: string;
  timestamp: string;
}

const sanitizeEdges = (rawEdges: Edge[]): Edge[] => {
  return rawEdges.map((e) => {
    const isTrue = e.sourceHandle === 'true';
    const isFalse = e.sourceHandle === 'false';
    let strokeColor = (e.style as any)?.stroke || '#3a2088';
    if (isTrue) strokeColor = '#10b981';
    else if (isFalse) strokeColor = '#DC2626';

    return {
      ...e,
      sourceHandle: e.sourceHandle || (e.source.includes('condition') ? 'true' : 'output'),
      targetHandle: e.targetHandle || 'input',
      type: e.type || 'smoothstep',
      animated: e.animated !== undefined ? e.animated : true,
      reconnectable: true,
      style: {
        stroke: strokeColor,
        strokeWidth: 2,
        ...(e.style || {})
      },
      markerEnd: e.markerEnd || {
        type: MarkerType.ArrowClosed,
        color: strokeColor,
        width: 14,
        height: 14
      }
    };
  });
};

export const useWorkflowGraph = (initialWorkflow?: WorkflowSerialized | any) => {
  const getInitialNodes = (wf?: any): CustomWorkflowNode[] => {
    if (wf?.nodes && Array.isArray(wf.nodes) && wf.nodes.length > 0) {
      return wf.nodes as CustomWorkflowNode[];
    }
    return SAMPLE_TEMPLATES[0].nodes as CustomWorkflowNode[];
  };

  const getInitialEdges = (wf?: any): Edge[] => {
    if (wf && Array.isArray(wf.edges)) {
      return sanitizeEdges(wf.edges as Edge[]);
    }
    if (wf?.nodes && Array.isArray(wf.nodes) && wf.nodes.length > 0) {
      return [];
    }
    return sanitizeEdges(SAMPLE_TEMPLATES[0].edges as Edge[]);
  };

  const [nodes, setNodes] = useNodesState<CustomWorkflowNode>(getInitialNodes(initialWorkflow));
  const [edges, setEdges] = useEdgesState<Edge>(getInitialEdges(initialWorkflow));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Workflow meta
  const [workflowName, setWorkflowName] = useState<string>(
    initialWorkflow?.name || 'Inbound Lead Routing & WhatsApp Automation'
  );
  const [workflowStatus, setWorkflowStatus] = useState<'draft' | 'published'>(
    initialWorkflow?.status === 'draft' || initialWorkflow?.isDraft ? 'draft' : 'published'
  );
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Sync state whenever initialWorkflow object or ID changes
  useEffect(() => {
    if (initialWorkflow) {
      const incomingNodes = getInitialNodes(initialWorkflow);
      const incomingEdges = getInitialEdges(initialWorkflow);
      setNodes(incomingNodes);
      setEdges(incomingEdges);
      setWorkflowName(initialWorkflow.name || 'Inbound Lead Routing & WhatsApp Automation');
      setWorkflowStatus(
        initialWorkflow.status === 'draft' || initialWorkflow.isDraft ? 'draft' : 'published'
      );
      setIsSaved(true);
      setSelectedNodeId(null);
    }
  }, [initialWorkflow?.id, initialWorkflow?.updatedAt]);

  // Nodes & Edges Change Handlers (Memoized to prevent canvas re-mounts)
  const onNodesChange = useCallback(
    (changes: NodeChange<CustomWorkflowNode>[]) => {
      const isContentChange = changes.some(
        (c) => c.type === 'position' || c.type === 'remove' || c.type === 'add'
      );
      if (isContentChange) {
        setIsSaved(false);
      }
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      const isContentChange = changes.some(
        (c) => c.type === 'remove' || c.type === 'add'
      );
      if (isContentChange) {
        setIsSaved(false);
      }
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  // Simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationLogs, setSimulationLogs] = useState<WorkflowSimulationStep[]>([]);
  const simulationTimerRef = useRef<NodeJS.Timeout[]>([]);
  const edgeReconnectSuccessful = useRef<boolean>(true);

  // Find currently selected node object
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Track connections between ports and persist created edges
  const onConnect = useCallback(
    (connection: Connection) => {
      console.log('[ReactFlow Drop Event] Connection captured:', connection);

      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      setIsSaved(false);

      const sourceId = connection.source;
      const targetId = connection.target;
      const sHandle = connection.sourceHandle || null;
      const tHandle = connection.targetHandle || null;

      let strokeColor = '#3a2088'; // primary CRM royal violet
      if (sHandle === 'true') strokeColor = '#10b981'; // emerald green
      if (sHandle === 'false') strokeColor = '#DC2626'; // rose red

      const edgeId = `xy-edge_${sourceId}_${sHandle || 'def'}-${targetId}_${tHandle || 'def'}-${Date.now()}`;

      const newEdge: Edge = {
        id: edgeId,
        source: sourceId,
        target: targetId,
        sourceHandle: sHandle,
        targetHandle: tHandle,
        type: 'smoothstep',
        animated: true,
        reconnectable: true,
        style: { stroke: strokeColor, strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 14,
          height: 14
        }
      };

      setEdges((prevEdges) => {
        const isDuplicate = prevEdges.some(
          (e) => e.source === sourceId && e.target === targetId && (e.sourceHandle || null) === sHandle
        );
        if (isDuplicate) return prevEdges;
        console.log('[ReactFlow Edge State] Appending edge. Previous edges count:', prevEdges.length);
        return [...prevEdges, newEdge];
      });
    },
    [setEdges]
  );

  // Reconnection Handlers: Allow users to click/drag existing line endpoints to change connections or disconnect
  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (!newConnection.source || !newConnection.target) return;
      if (newConnection.source === newConnection.target) return;

      edgeReconnectSuccessful.current = true;
      setIsSaved(false);

      const sHandle = newConnection.sourceHandle || null;
      let strokeColor = '#3a2088';
      if (sHandle === 'true') strokeColor = '#10b981';
      else if (sHandle === 'false') strokeColor = '#DC2626';

      setEdges((prevEdges) => {
        const reconnected = reconnectEdge(oldEdge, newConnection, prevEdges);
        return reconnected.map((e) => {
          if (e.id === oldEdge.id || (e.source === newConnection.source && e.target === newConnection.target)) {
            return {
              ...e,
              source: newConnection.source,
              target: newConnection.target,
              sourceHandle: newConnection.sourceHandle || null,
              targetHandle: newConnection.targetHandle || null,
              reconnectable: true,
              style: { ...e.style, stroke: strokeColor, strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: strokeColor,
                width: 14,
                height: 14
              }
            };
          }
          return e;
        });
      });
    },
    [setEdges]
  );

  const onReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        // Dragged to empty space -> Disconnect/Delete the line
        setIsSaved(false);
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
      edgeReconnectSuccessful.current = true;
    },
    [setEdges]
  );

  // Add node from catalog item (Enforces single trigger rule)
  const addNodeFromCatalog = useCallback(
    (item: CatalogItem, dropPosition?: { x: number; y: number }) => {
      // Prevent adding more than 1 trigger/event node
      if (item.kind === 'trigger' && nodes.some((n) => n.type === 'trigger' || n.data?.kind === 'trigger')) {
        return null;
      }

      setIsSaved(false);
      const id = `node-${item.kind}-${Date.now().toString().slice(-5)}`;
      
      // Calculate a sensible offset if no drop position given
      const position = dropPosition || {
        x: 100 + (nodes.length % 5) * 60,
        y: 100 + (nodes.length % 5) * 50
      };

      const newNode: CustomWorkflowNode = {
        id,
        type: item.kind,
        position,
        data: {
          kind: item.kind,
          catalogId: item.id,
          label: item.name,
          description: item.description,
          iconName: item.iconName,
          category: item.category,
          config: { ...item.defaultConfig }
        }
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(id);
      return id;
    },
    [nodes, setNodes]
  );

  // Update specific node's data
  const updateNodeData = useCallback(
    (nodeId: string, updatedData: Partial<WorkflowNodeData>) => {
      setIsSaved(false);
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...updatedData
              }
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Delete node and its attached edges
  const deleteNode = useCallback(
    (nodeId: string) => {
      setIsSaved(false);
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId, setEdges, setNodes]
  );

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setIsSaved(false);
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
  }, [setEdges, setNodes]);

  // Load a template
  const loadTemplate = useCallback(
    (templateId: string = 'tpl-instant-welcome') => {
      const tpl = SAMPLE_TEMPLATES.find((t) => t.id === templateId) || SAMPLE_TEMPLATES[0];
      setWorkflowName(tpl.name);
      setNodes(tpl.nodes as CustomWorkflowNode[]);
      setEdges(tpl.edges as Edge[]);
      setSelectedNodeId(null);
      setIsSaved(true);
    },
    [setEdges, setNodes]
  );

  // Serialize graph to clean JSON format matching specs
  const serializeWorkflow = useCallback(
    (nameOverride?: string, statusOverride?: 'draft' | 'published'): WorkflowSerialized => {
      const currentName = nameOverride || workflowName;
      const currentStatus = statusOverride || workflowStatus;

      return {
        id: initialWorkflow?.id || `wf-${Date.now()}`,
        name: currentName,
        status: currentStatus,
        version: '1.0.0',
        createdAt: initialWorkflow?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: { ...n.position },
          data: {
            ...n.data,
            config: { ...(n.data?.config || {}) }
          }
        })) as CustomWorkflowNode[],
        edges: edges.map((e) => {
          const isTrue = e.sourceHandle === 'true';
          const isFalse = e.sourceHandle === 'false';
          let strokeColor = (e.style as any)?.stroke || '#3a2088';
          if (isTrue) strokeColor = '#10b981';
          else if (isFalse) strokeColor = '#DC2626';

          return {
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle || null,
            targetHandle: e.targetHandle || null,
            type: e.type || 'smoothstep',
            animated: e.animated !== undefined ? e.animated : true,
            reconnectable: true,
            style: {
              stroke: strokeColor,
              strokeWidth: 2,
              ...(e.style || {})
            },
            markerEnd: e.markerEnd || {
              type: MarkerType.ArrowClosed,
              color: strokeColor,
              width: 14,
              height: 14
            }
          };
        }) as Edge[]
      };
    },
    [edges, nodes, workflowName, workflowStatus, initialWorkflow]
  );

  // Save workflow
  const saveWorkflow = useCallback(
    (status?: 'draft' | 'published') => {
      const targetStatus = status || workflowStatus;
      setWorkflowStatus(targetStatus);
      const serialized = serializeWorkflow(undefined, targetStatus);
      setIsSaved(true);
      return serialized;
    },
    [serializeWorkflow, workflowStatus]
  );

  // Interactive Simulation runner (walks the graph nodes and yields logs)
  const runSimulation = useCallback(() => {
    // Clear any active timers
    simulationTimerRef.current.forEach(clearTimeout);
    simulationTimerRef.current = [];

    if (nodes.length === 0) return;

    setIsSimulating(true);
    setSimulationLogs([]);

    // Find trigger node (entry point)
    const triggerNode = nodes.find((n) => n.data.kind === 'trigger') || nodes[0];
    const orderedNodes: CustomWorkflowNode[] = [triggerNode];

    // Traverse connected edges
    let currentNode = triggerNode;
    const visited = new Set<string>([triggerNode.id]);

    while (currentNode) {
      const outEdges = edges.filter((e) => e.source === currentNode.id);
      if (outEdges.length === 0) break;

      // If condition node, prefer True branch for happy path simulation
      const chosenEdge =
        outEdges.find((e) => e.sourceHandle === 'true') ||
        outEdges[0];

      const nextNode = nodes.find((n) => n.id === chosenEdge.target);
      if (nextNode && !visited.has(nextNode.id)) {
        visited.add(nextNode.id);
        orderedNodes.push(nextNode);
        currentNode = nextNode;
      } else {
        break;
      }
    }

    // Schedule step execution animations
    orderedNodes.forEach((node, index) => {
      const timer = setTimeout(() => {
        const timeStr = new Date().toLocaleTimeString();
        let logMsg = `Executed ${node.data.label}`;

        if (node.data.kind === 'trigger') {
          logMsg = `Trigger [${node.data.label}] fired with sample payload.`;
        } else if (node.data.kind === 'condition') {
          logMsg = `Evaluated rules on [${node.data.label}]: Condition MET (True branch selected).`;
        } else if (node.data.catalogId === 'send_template') {
          logMsg = `WhatsApp Template "${node.data.config?.templateName || 'welcome'}" dispatched with HTTP 200 OK.`;
        } else if (node.data.catalogId === 'call_api') {
          logMsg = `HTTP ${node.data.config?.method || 'POST'} request sent to ${node.data.config?.endpointUrl || 'endpoint'} (200 OK).`;
        } else if (node.data.catalogId === 'update_lead_assignee') {
          logMsg = `Lead assigned to sales agent via ${node.data.config?.assigneeType || 'round_robin'}.`;
        } else if (node.data.catalogId === 'update_lead_status') {
          logMsg = `Lead stage updated to "${node.data.config?.targetStage || 'Contacted'}".`;
        } else if (node.data.catalogId === 'capi') {
          logMsg = `Meta Conversions API event "${node.data.config?.capiEventName || 'Lead'}" posted successfully.`;
        }

        setSimulationLogs((prev) => [
          ...prev,
          {
            step: index + 1,
            nodeId: node.id,
            nodeName: node.data.label,
            status: 'success',
            log: logMsg,
            timestamp: timeStr
          }
        ]);

        if (index === orderedNodes.length - 1) {
          setIsSimulating(false);
        }
      }, (index + 1) * 800);

      simulationTimerRef.current.push(timer);
    });
  }, [edges, nodes]);

  const stopSimulation = useCallback(() => {
    simulationTimerRef.current.forEach(clearTimeout);
    simulationTimerRef.current = [];
    setIsSimulating(false);
  }, []);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    onReconnectStart,
    onReconnectEnd,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    addNodeFromCatalog,
    updateNodeData,
    deleteNode,
    clearCanvas,
    loadTemplate,
    workflowName,
    setWorkflowName,
    workflowStatus,
    setWorkflowStatus,
    isSaved,
    setIsSaved,
    serializeWorkflow,
    saveWorkflow,
    runSimulation,
    stopSimulation,
    isSimulating,
    simulationLogs
  };
};
