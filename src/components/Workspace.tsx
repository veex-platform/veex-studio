import { useEffect } from 'react';
import Editor from '@monaco-editor/react';
import Console from './Console';
import type { TelemetryMessage } from '../types';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Panel,
    BackgroundVariant,
    type Node,
    type Edge,
    type Connection,
} from '@xyflow/react';
import { Columns, Rows, ArrowLeftRight, AlertCircle, Scissors } from 'lucide-react';


interface WorkspaceProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: any;
    onEdgesChange: any;
    onConnect: (params: Connection) => void;
    isValidConnection: any;
    setReactFlowInstance: any;
    reactFlowInstance: any;
    onNodeClick: any;
    onEdgeClick: any;
    onPaneClick: any;
    onDragOver: any;
    onDrop: any;
    viewMode: 'split' | 'visual' | 'code';
    orientation: 'horizontal' | 'vertical';
    isVdlFirst: boolean;
    setViewMode: (mode: 'split' | 'visual' | 'code') => void;
    setOrientation: (o: 'horizontal' | 'vertical') => void;
    setIsVdlFirst: (v: boolean) => void;
    vdlPreview: string;
    validationErrors: any[];
    editorRef: any;
    nodeTypes: any;
    activeNodes: Record<string, boolean>;
    logs: TelemetryMessage[];
    onClearLogs: () => void;
    onSaveSnippet: (name: string) => void;
}

const Workspace: React.FC<WorkspaceProps> = ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isValidConnection,
    setReactFlowInstance,
    reactFlowInstance,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    onDragOver,
    onDrop,
    viewMode,
    orientation,
    isVdlFirst,
    setViewMode,
    setOrientation,
    setIsVdlFirst,
    vdlPreview,
    validationErrors,
    editorRef,
    nodeTypes,
    activeNodes,
    logs,
    onClearLogs,
    onSaveSnippet,
}) => {
    const selectedNodes = nodes.filter(n => n.selected);
    const hasSelection = selectedNodes.length > 0;

    // Inject active state into nodes
    const nodesWithActive = nodes.map(node => ({
        ...node,
        data: {
            ...node.data,
            isActive: activeNodes[node.id] || false
        }
    }));
    // Auto-centering when layout changes
    useEffect(() => {
        if (reactFlowInstance && (viewMode === 'split' || viewMode === 'visual')) {
            const timer = setTimeout(() => {
                reactFlowInstance.fitView({ duration: 600, padding: 0.2 });
            }, 350);
            return () => clearTimeout(timer);
        }
    }, [viewMode, orientation, isVdlFirst, reactFlowInstance]);

    return (
        <main className="flex-1 relative bg-[#0b0e14] flex flex-col overflow-hidden">
            <div className={`flex-1 flex overflow-hidden ${orientation === 'vertical' ? 'flex-row' : 'flex-col'} ${isVdlFirst ? (orientation === 'vertical' ? 'flex-row-reverse' : 'flex-col-reverse') : ''}`}>

                {/* Visual View (Graph) */}
                {(viewMode === 'split' || viewMode === 'visual') && (
                    <div className="relative flex-1 bg-[#0b0e14] transition-all duration-300 overflow-hidden" onDragOver={onDragOver} onDrop={onDrop}>
                        <ReactFlow
                            nodes={nodesWithActive}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            isValidConnection={isValidConnection}
                            onInit={setReactFlowInstance}
                            onNodeClick={onNodeClick}
                            onEdgeClick={onEdgeClick}
                            onPaneClick={onPaneClick}
                            fitView
                        >
                            <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={20} size={1} />

                            {hasSelection && (
                                <Panel position="top-left" className="m-4">
                                    <button
                                        onClick={() => {
                                            const name = prompt('Snippet Name:', 'Custom Logic Fragment');
                                            if (name) onSaveSnippet(name);
                                        }}
                                        className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 transition active:scale-95 border border-white/10"
                                    >
                                        <Scissors size={12} /> Save as Snippet ({selectedNodes.length})
                                    </button>
                                </Panel>
                            )}

                            <Controls
                                showInteractive={false}
                            />
                            <MiniMap
                                style={{ backgroundColor: '#0d0f14', width: 120, height: 90 }}
                                nodeColor="#1e293b"
                                maskColor="rgba(0, 0, 0, 0.4)"
                                className="border border-white/5 rounded-lg overflow-hidden !m-4"
                            />
                            <Panel position="top-right" className="bg-[#131722]/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 m-4 shadow-2xl">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    {viewMode === 'split' ? 'Multi-Window View' : 'Visual Focused'}
                                </span>
                            </Panel>

                            {nodes.length === 1 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center text-xl">+</div>
                                        <span className="text-xs font-medium tracking-widest uppercase text-[9px]">Start by dragging capabilities</span>
                                    </div>
                                </div>
                            )}
                        </ReactFlow>
                    </div>
                )}

                {/* Splitter Line */}
                {viewMode === 'split' && (
                    <div className={`bg-white/5 ${orientation === 'vertical' ? 'w-px h-full' : 'h-px w-full'}`} />
                )}

                {/* Code View (VDL Editor) */}
                {(viewMode === 'split' || viewMode === 'code') && (
                    <div className="relative flex-1 flex flex-col bg-[#0b0e14] transition-all duration-300 overflow-hidden">
                        {/* Editor Area */}
                        <div className="flex-1 overflow-hidden">
                            <Editor
                                height="100%"
                                defaultLanguage="yaml"
                                theme="vs-dark"
                                value={vdlPreview}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 11,
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    fontFamily: 'JetBrains Mono, monospace',
                                    padding: { top: 12, bottom: 12 },
                                }}
                                onMount={(editor) => {
                                    editorRef.current = editor;
                                }}
                            />
                        </div>

                        {/* Validation Errors Overlay */}
                        {validationErrors.length > 0 && (
                            <div className="bg-red-950/40 border-t border-red-500/20 p-2 max-h-[100px] overflow-y-auto shrink-0">
                                {validationErrors.map((err, i) => (
                                    <div key={i} className="text-[9px] text-red-300 font-mono flex items-start gap-2 mb-1 last:mb-0">
                                        <AlertCircle size={8} className="mt-0.5 shrink-0" />
                                        <span>Line {err.line}: {err.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* XAML-style Layout Control Toolbar */}
            <div className="h-9 bg-[#131722] border-t border-white/5 flex items-center justify-between px-3 shrink-0 z-50 relative">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-white/5 rounded p-0.5 border border-white/5">
                        <button
                            onClick={() => setViewMode('visual')}
                            className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition ${viewMode === 'visual' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Visual Only"
                        >
                            Visual
                        </button>
                        <button
                            onClick={() => setViewMode('split')}
                            className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition ${viewMode === 'split' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Split View"
                        >
                            Split
                        </button>
                        <button
                            onClick={() => setViewMode('code')}
                            className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition ${viewMode === 'code' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Code Only"
                        >
                            Code
                        </button>
                    </div>

                    <div className="h-4 w-px bg-white/10" />

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setOrientation('vertical')}
                            className={`p-1.5 rounded transition ${orientation === 'vertical' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                            title="Vertical Split (Side-by-side)"
                        >
                            <Columns size={12} />
                        </button>
                        <button
                            onClick={() => setOrientation('horizontal')}
                            className={`p-1.5 rounded transition ${orientation === 'horizontal' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                            title="Horizontal Split (Stacked)"
                        >
                            <Rows size={12} />
                        </button>
                        <div className="w-1" />
                        <button
                            onClick={() => setIsVdlFirst(!isVdlFirst)}
                            className="p-1.5 rounded text-slate-500 hover:text-blue-400 hover:bg-white/5 transition"
                            title="Swap Positions"
                        >
                            <ArrowLeftRight size={12} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Live Sync Active
                    </span>
                </div>
            </div>

            <Console logs={logs} onClear={onClearLogs} />
        </main>
    );
};

// Internal Import for icons (if used inside Workspace)


export default Workspace;
