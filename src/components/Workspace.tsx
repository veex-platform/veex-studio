import { useEffect, useState } from 'react';
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
import { Columns, Rows, ArrowLeftRight, AlertCircle, Scissors, PanelLeftClose } from 'lucide-react';


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
    isConsoleCollapsed: boolean;
    setIsConsoleCollapsed: (collapsed: boolean) => void;
    deleteSelection: () => void;
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
    isConsoleCollapsed,
    setIsConsoleCollapsed,
    deleteSelection,
}) => {
    const selectedNodes = nodes.filter(n => n.selected);
    const hasSelection = selectedNodes.length > 0;

    const [liveViewMode, setLiveViewMode] = useState(false);

    // Inject active state and telemetry into nodes
    const nodesWithActive = nodes.map(node => ({
        ...node,
        data: {
            ...node.data,
            isActive: activeNodes[node.id] || false,
            telemetry: logs,
            isLiveView: liveViewMode
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

    // Keyboard shortcut for deleting selected nodes/edges
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check if Delete or Backspace is pressed
            if (event.key === 'Delete' || event.key === 'Backspace') {
                // Don't delete if user is typing in an input/textarea
                const target = event.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                    return;
                }

                // Check if there's a selection
                const hasSelectedNodes = nodes.some(n => n.selected);
                const hasSelectedEdges = edges.some(e => e.selected);

                if (hasSelectedNodes || hasSelectedEdges) {
                    event.preventDefault();
                    deleteSelection();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes, edges, deleteSelection]);

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
                            proOptions={{ hideAttribution: true }}
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
                        {/* Editor Toolbar */}
                        <div className="h-8 bg-[#131722] border-b border-white/5 flex items-center justify-between px-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">VDL Code</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => {
                                        if (editorRef.current) {
                                            navigator.clipboard.writeText(editorRef.current.getValue());
                                        }
                                    }}
                                    className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-white hover:bg-white/5 rounded transition"
                                    title="Copy to Clipboard"
                                >
                                    Copy
                                </button>
                                <button
                                    onClick={() => {
                                        if (editorRef.current) {
                                            editorRef.current.getAction('editor.action.formatDocument')?.run();
                                        }
                                    }}
                                    className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-white hover:bg-white/5 rounded transition"
                                    title="Format Code"
                                >
                                    Format
                                </button>
                                <div className="w-px h-4 bg-white/10" />
                                <button
                                    onClick={() => {
                                        if (editorRef.current) {
                                            editorRef.current.trigger('keyboard', 'editor.action.fontZoomIn', {});
                                        }
                                    }}
                                    className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-white hover:bg-white/5 rounded transition"
                                    title="Zoom In (Ctrl +)"
                                >
                                    Zoom+
                                </button>
                                <button
                                    onClick={() => {
                                        if (editorRef.current) {
                                            editorRef.current.trigger('keyboard', 'editor.action.fontZoomOut', {});
                                        }
                                    }}
                                    className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-white hover:bg-white/5 rounded transition"
                                    title="Zoom Out (Ctrl -)"
                                >
                                    Zoom-
                                </button>
                                <button
                                    onClick={() => {
                                        if (editorRef.current) {
                                            editorRef.current.trigger('keyboard', 'editor.action.fontZoomReset', {});
                                        }
                                    }}
                                    className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-white hover:bg-white/5 rounded transition"
                                    title="Reset Zoom (Ctrl 0)"
                                >
                                    100%
                                </button>
                                <div className="w-px h-4 bg-white/10" />
                                <button
                                    onClick={() => {
                                        const name = prompt('Enter snippet name:');
                                        if (name) onSaveSnippet(name);
                                    }}
                                    className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 hover:text-white hover:bg-amber-500/10 rounded transition"
                                    title="Save as Snippet"
                                >
                                    Snippet
                                </button>
                                <button
                                    onClick={() => {
                                        if (editorRef.current) {
                                            const content = editorRef.current.getValue();
                                            const blob = new Blob([content], { type: 'text/plain' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'flow.vdl';
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        }
                                    }}
                                    className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-blue-400 hover:text-white hover:bg-blue-500/10 rounded transition"
                                    title="Download VDL File"
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 overflow-hidden">
                            <Editor
                                height="100%"
                                defaultLanguage="yaml"
                                theme="vs-dark"
                                value={vdlPreview}
                                onChange={(value) => {
                                    // Allow editing - sync back to nodes if needed
                                    if (editorRef.current && value) {
                                        // Future: implement VDL -> Nodes sync
                                    }
                                }}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 11,
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    fontFamily: 'JetBrains Mono, monospace',
                                    padding: { top: 12, bottom: 12 },
                                    readOnly: false,
                                    wordWrap: 'on',
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

            {/* Console Panel with Collapse Button */}
            <div className={`bg-[#0d0f14] border-t border-white/10 flex flex-col shrink-0 overflow-hidden shadow-2xl transition-all duration-300 ease-in-out relative
                ${isConsoleCollapsed ? 'h-0 opacity-0 pointer-events-none' : 'h-48'}`}>
                <Console
                    logs={logs}
                    onClear={onClearLogs}
                    liveViewMode={liveViewMode}
                    setLiveViewMode={setLiveViewMode}
                />
            </div>

            {/* Console Collapse/Expand Toggle */}
            <button
                onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-[60] p-1 bg-[#131722] border border-white/10 rounded-t-lg text-slate-500 hover:text-white hover:bg-blue-500/20 transition-all
                    ${isConsoleCollapsed ? 'translate-y-0' : ''}`}
                style={{ bottom: isConsoleCollapsed ? 0 : 192 }}
            >
                {isConsoleCollapsed ? <PanelLeftClose size={14} className="rotate-90" /> : <PanelLeftClose size={14} className="-rotate-90" />}
            </button>
        </main >
    );
};

// Internal Import for icons (if used inside Workspace)


export default Workspace;
