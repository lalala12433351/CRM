import { useState, useCallback, useRef } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange
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

export const useWorkflowGraph = (initialWorkflow?: WorkflowSerialized) => {
  const initialNodes: CustomWorkflowNode[] = (initialWorkflow?.nodes as CustomWorkflowNode[]) || (SAMPLE_TEMPLATES[0].nodes as CustomWorkflowNode[]);
  const initialEdges: Edge[] = (initialWorkflow?.edges as Edge[]) || (SAMPLE_TEMPLATES[0].edges as Edge[]);

  const [nodes, setNodes] = useNodesState<CustomWorkflowNode>(initialNodes);
  const [edges, setEdges] = useEdgesState<Edge>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Workflow meta
  const [workflowName, setWorkflowName] = useState<string>(
    initialWorkflow?.name || 'Inbound Lead Routing & WhatsApp Automation'
  );
  const [workflowStatus, setWorkflowStatus] = useState<'draft' | 'published'>(
    initialWorkflow?.status || 'published'
  );
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationLogs, setSimulationLogs] = useState<WorkflowSimulationStep[]>([]);
  const simulationTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Find currently selected node object
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Track connections between ports
  const onConnect = useCallback(
    (connection: Connection) => {
      setIsSaved(false);
      // Format edge style based on handle type (e.g. true=green, false=red, trigger=purple)
      const isTrueBranch = connection.sourceHandle === 'true';
      const isFalseBranch = connection.sourceHandle === 'false';

      let strokeColor = '#3a2088'; // primary CRM royal violet
      if (isTrueBranch) strokeColor = '#10b981'; // emerald green
      if (isFalseBranch) strokeColor = '#DC2626'; // rose red

      const newEdge: Edge = {
        ...connection,
        id: `edge-${connection.source}-${connection.sourceHandle || 'default'}-${connection.target}`,
        animated: true,
        type: 'smoothstep',
        style: {
          stroke: strokeColor,
          strokeWidth: 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 16,
          height: 16
        }
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Add node from catalog item
  const addNodeFromCatalog = useCallback(
    (item: CatalogItem, dropPosition?: { x: number; y: number }) => {
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
    [nodes.length, setNodes]
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
        id: `wf-${Date.now()}`,
        name: currentName,
        status: currentStatus,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data
        })) as CustomWorkflowNode[],
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle || null,
          targetHandle: e.targetHandle || null,
          animated: e.animated,
          style: e.style
        })) as Edge[]
      };
    },
    [edges, nodes, workflowName, workflowStatus]
  );

  // Save workflow
  const saveWorkflow = useCallback(
    (status?: 'draft' | 'published') => {
      if (status) setWorkflowStatus(status);
      const serialized = serializeWorkflow(undefined, status);
      setIsSaved(true);
      return serialized;
    },
    [serializeWorkflow]
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
    onNodesChange: (changes: NodeChange<CustomWorkflowNode>[]) => {
      setIsSaved(false);
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    onEdgesChange: (changes: EdgeChange<Edge>[]) => {
      setIsSaved(false);
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    onConnect,
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
    serializeWorkflow,
    saveWorkflow,
    runSimulation,
    stopSimulation,
    isSimulating,
    simulationLogs
  };
};
