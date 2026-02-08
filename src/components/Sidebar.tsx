import React from 'react';
import { Zap, Trash2, ListTree } from 'lucide-react';
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

                                <div className="space-y-4">
                                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Configuration</label>
                                    {Object.entries(selectedNode.data.params || {}).map(([key, value]) => (
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

            {!selectedNode && !selectedEdge && viewMode !== 'split' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        onClick={() => onSetViewMode('split')}
                        className="group flex flex-col items-center gap-3 transition-transform hover:scale-105"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/20 transition">
                            <Zap size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-blue-500/50 uppercase tracking-[0.2em] group-hover:text-blue-400 transition">Enable Split View</span>
                    </button>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
