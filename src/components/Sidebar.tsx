import React from 'react';
import { Zap, Trash2, ListTree, ChevronDown } from 'lucide-react';
import { type Node, type Edge } from '@xyflow/react';

interface SidebarProps {
    selectedNode: Node | null;
    selectedEdge: Edge | null;
    viewMode: 'split' | 'visual' | 'code';
    onSetViewMode: (mode: 'split' | 'visual' | 'code') => void;
    updateNodeData: (nodeId: string, newData: any) => void;
    deleteSelection: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    selectedNode,
    selectedEdge,
    viewMode,
    onSetViewMode,
    updateNodeData,
    deleteSelection,
}) => {
    return (
        <aside className="w-[300px] shrink-0 bg-[#131722]/50 backdrop-blur-3xl flex flex-col min-h-0 border-l border-white/5 transition-all duration-300">
            {/* Properties Panel (Hidden when View is Code-only) */}
            <div className={`flex flex-col min-h-0 transition-all duration-300 ${viewMode === 'code' ? 'h-0 opacity-0 overflow-hidden' : 'flex-1 opacity-100'}`}>
                {selectedNode || selectedEdge ? (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                {selectedNode ? 'Properties' : 'Connection'}
                            </h2>
                            <div className="flex items-center gap-2">
                                {viewMode !== 'split' && (
                                    <button
                                        onClick={() => onSetViewMode('split')}
                                        className="text-[9px] font-bold text-blue-500 hover:text-blue-400 transition flex items-center gap-1 bg-blue-500/5 px-2 py-1 rounded"
                                    >
                                        <Zap size={10} /> SPLIT VIEW
                                    </button>
                                )}
                                <button
                                    onClick={deleteSelection}
                                    className="text-slate-600 hover:text-red-500 transition p-1 rounded-md hover:bg-white/5"
                                    title="Delete Selection"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        {selectedNode ? (
                            <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto min-h-0">
                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Node Name</label>
                                    <input
                                        type="text"
                                        value={(selectedNode.data.label as string) || ''}
                                        onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Capability</label>
                                    <div className="w-full bg-black/20 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] text-slate-500 flex justify-between items-center select-none">
                                        {(selectedNode.data.type as string) || 'platform.core'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Action</label>
                                    <div className="relative">
                                        <select
                                            value={(selectedNode.data.action as string) || ''}
                                            onChange={(e) => updateNodeData(selectedNode.id, { action: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 pr-8 text-[11px] text-emerald-400 font-mono outline-none focus:border-emerald-500/50 appearance-none cursor-pointer hover:bg-black/60 transition-colors"
                                        >
                                            <option value="">(Custom Action...)</option>
                                            {/* Dynamic options based on capability */}
                                            {(selectedNode.data.type as string)?.includes('gpio') && (
                                                <>
                                                    <option value="read">read</option>
                                                    <option value="write">write</option>
                                                    <option value="readwrite">readwrite</option>
                                                </>
                                            )}
                                            {(selectedNode.data.type as string)?.includes('mqtt') && (
                                                <>
                                                    <option value="publish">publish</option>
                                                    <option value="subscribe">subscribe</option>
                                                </>
                                            )}
                                            {(selectedNode.data.type as string)?.includes('i2c') && (
                                                <>
                                                    <option value="read">read</option>
                                                    <option value="write">write</option>
                                                </>
                                            )}
                                            {(selectedNode.data.type as string)?.includes('can') && (
                                                <>
                                                    <option value="send">send</option>
                                                    <option value="receive">receive</option>
                                                </>
                                            )}
                                            {/* Logic specific options */}
                                            {(selectedNode.data.type as string)?.includes('logic') && (
                                                <>
                                                    <option value="set">set</option>
                                                    <option value="get">get</option>
                                                    <option value="increment">increment</option>
                                                    <option value="decrement">decrement</option>
                                                </>
                                            )}

                                            {/* Default fallback options only if NO specific capability options matched */}
                                            {!['gpio', 'mqtt', 'i2c', 'can', 'logic'].some(cap => (selectedNode.data.type as string)?.includes(cap)) && (
                                                <>
                                                    <option value="read">read</option>
                                                    <option value="write">write</option>
                                                    <option value="boot">boot</option>
                                                </>
                                            )}

                                            {/* Always show boot as an option for core/triggers if not already matched */}
                                            {(selectedNode.data.type as string) === 'platform.core' && <option value="boot">boot</option>}

                                            {/* Fallback for current value if custom */}
                                            {!!selectedNode.data.action && !['read', 'write', 'readwrite', 'publish', 'subscribe', 'send', 'receive', 'set', 'get', 'increment', 'decrement', 'boot'].includes(selectedNode.data.action as string) && (
                                                <option value={selectedNode.data.action as string}>{selectedNode.data.action as string}</option>
                                            )}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <ChevronDown size={10} />
                                        </div>
                                    </div>
                                    <p className="text-[8px] text-slate-600 mt-1 italic leading-tight">Primary operation for this capability</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Configuration</label>
                                    {Object.entries(selectedNode.data.params || {})
                                        .filter(([key]) => key !== 'action') // Filter out action as it has its own field now
                                        .map(([key, value]) => (
                                            <div key={key} className="flex flex-col gap-1.5">
                                                <span className="text-[10px] text-slate-400 px-1">{key}</span>
                                                <input
                                                    type="text"
                                                    value={(value as string) || ''}
                                                    onChange={(e) => {
                                                        const oldParams = (selectedNode.data.params as Record<string, any>) || {};
                                                        updateNodeData(selectedNode.id, { params: { ...oldParams, [key]: e.target.value } });
                                                    }}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] text-blue-300 outline-none focus:border-blue-500/50"
                                                />
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 p-8 text-center flex flex-col items-center justify-center gap-4 opacity-50">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400">Selected Connection</p>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-600 mt-1 font-mono">{selectedEdge?.id}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 p-8 text-center flex flex-col items-center justify-center gap-4 opacity-20">
                        <ListTree size={32} />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Select a node or edge to edit</p>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
