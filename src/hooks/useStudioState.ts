import { useCallback, useState, useEffect } from 'react';
import {
    addEdge,
    useNodesState,
    useEdgesState,
    type Connection,
    type Edge,
    type Node,
} from '@xyflow/react';

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'input',
        data: { label: 'Boot Sequence' },
        position: { x: 300, y: 50 },
        className: 'bg-white !text-slate-900 border-none rounded-lg px-6 py-3 font-bold shadow-xl !w-[160px] text-center text-[10px]',
    },
    {
        id: '2',
        type: 'action',
        data: { label: 'Industrial Blink', action: 'write', type: 'platform.gpio', params: { pin: '2', level: '1' } },
        position: { x: 300, y: 150 },
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } },
];

let id = 3;
const getId = () => `${id++}`;

export const useStudioState = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [activeNodes, setActiveNodes] = useState<Record<string, boolean>>({});
    const [snippets, setSnippets] = useState<any[]>([]);

    // Load snippets from localStorage on init
    useEffect(() => {
        const saved = localStorage.getItem('veex_snippets');
        if (saved) setSnippets(JSON.parse(saved));
    }, []);



    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } }, eds)),
        [setEdges]
    );

    const isValidConnection = useCallback(
        (connection: Edge | Connection) => {
            if (connection.source === connection.target) return false;
            const targetNode = nodes.find((n) => n.id === connection.target);
            if (targetNode?.type === 'input') return false;
            return true;
        },
        [nodes]
    );

    const onNodeClick = (_: any, node: Node) => {
        setSelectedNode(node);
        setSelectedEdge(null);
    };

    const onEdgeClick = (_: any, edge: Edge) => {
        setSelectedEdge(edge);
        setSelectedNode(null);
    };

    const onPaneClick = () => {
        setSelectedNode(null);
        setSelectedEdge(null);
    };

    const updateNodeData = (nodeId: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: { ...node.data, ...newData } };
                }
                return node;
            })
        );
        if (selectedNode?.id === nodeId) {
            setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, ...newData } } : null);
        }
    };

    const deleteSelection = () => {
        if (selectedNode) {
            setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
            setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
            setSelectedNode(null);
        }
        if (selectedEdge) {
            setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
            setSelectedEdge(null);
        }
    };

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const data = event.dataTransfer.getData('application/reactflow');
            if (!data || !reactFlowInstance) return;
            const nodeData = JSON.parse(data);
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            if (nodeData.type === 'snippet') {
                const snippet = snippets.find(s => s.id === nodeData.id);
                if (snippet) {
                    // Relabel IDs for current session
                    const idMap: Record<string, string> = {};
                    const newNodes = snippet.nodes.map((n: any) => {
                        const newId = getId();
                        idMap[n.id] = newId;
                        return {
                            ...n,
                            id: newId,
                            position: {
                                x: n.position.x + position.x - snippet.nodes[0].position.x,
                                y: n.position.y + position.y - snippet.nodes[0].position.y
                            }
                        };
                    });
                    const newEdges = snippet.edges.map((e: any) => ({
                        ...e,
                        id: `e${idMap[e.source]}-${idMap[e.target]}`,
                        source: idMap[e.source],
                        target: idMap[e.target]
                    }));
                    setNodes(nds => nds.concat(newNodes));
                    setEdges(eds => eds.concat(newEdges));
                }
                return;
            }

            const newNode: Node = {
                id: getId(),
                type: 'action',
                position,
                data: {
                    label: nodeData.label,
                    type: nodeData.capability,
                    action: nodeData.action,
                    params: { ...nodeData.params }
                },
            };
            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes, snippets, setEdges]
    );

    const onLoadTemplate = useCallback((newNodes: Node[], newEdges: Edge[]) => {
        setNodes(newNodes);
        setEdges(newEdges);
    }, [setNodes, setEdges]);

    const triggerActiveNode = useCallback((nodeId: string) => {
        setActiveNodes(prev => ({ ...prev, [nodeId]: true }));
        setTimeout(() => {
            setActiveNodes(prev => {
                const newState = { ...prev };
                delete newState[nodeId];
                return newState;
            });
        }, 1000);
    }, []);

    const saveSelectionAsSnippet = useCallback((name: string) => {
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length === 0) return;

        const nodeIds = new Set(selectedNodes.map(n => n.id));
        const selectedEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

        const newSnippet = {
            id: `snip_${Date.now()}`,
            name,
            nodes: selectedNodes.map(n => ({ ...n, selected: false })),
            edges: selectedEdges.map(e => ({ ...e, selected: false }))
        };

        const newSnippets = [...snippets, newSnippet];
        setSnippets(newSnippets);
        localStorage.setItem('veex_snippets', JSON.stringify(newSnippets));
    }, [nodes, edges, snippets]);

    const deleteSnippet = useCallback((snippetId: string) => {
        const newSnippets = snippets.filter(s => s.id !== snippetId);
        setSnippets(newSnippets);
        localStorage.setItem('veex_snippets', JSON.stringify(newSnippets));
    }, [snippets]);

    return {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        isValidConnection,
        selectedNode,
        setSelectedNode,
        selectedEdge,
        setSelectedEdge,
        reactFlowInstance,
        setReactFlowInstance,
        onNodeClick,
        onEdgeClick,
        onPaneClick,
        updateNodeData,
        deleteSelection,
        onDrop,
        onLoadTemplate,
        activeNodes,
        triggerActiveNode,
        snippets,
        saveSelectionAsSnippet,
        deleteSnippet,
    };
};
