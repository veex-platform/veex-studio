import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Power, Repeat } from 'lucide-react';
import { useState } from 'react';

export default function TriggerNode({ data, selected }: NodeProps) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const isLoop = data.action === 'loop';
    const label = data.label as string;
    const params = (data.params as Record<string, any>) || {};

    // Extract useful VDL properties
    const priority = params.priority || 'normal';
    const timeout = params.timeout || '30s';
    const retry = params.retry || '3';

    return (
        <div className={`min-w-[150px] relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 group
          ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}`}>

            {/* Animated Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${isLoop
                ? 'from-indigo-500 via-purple-500 to-pink-500'
                : 'from-emerald-400 via-cyan-500 to-blue-500'
                } opacity-90`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Animated Glow Effect */}
            <div className={`absolute inset-0 ${isLoop
                ? 'bg-gradient-to-r from-purple-500/0 via-purple-300/30 to-purple-500/0'
                : 'bg-gradient-to-r from-cyan-500/0 via-cyan-300/30 to-cyan-500/0'
                } animate-pulse`} />

            {/* Content */}
            <div className="relative">
                {/* Header */}
                <div
                    onDoubleClick={() => setIsCollapsed(!isCollapsed)}
                    className="px-2.5 py-1.5 flex items-center gap-2 cursor-pointer select-none"
                >
                    <div className={`p-1.5 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''
                        }`}>
                        {isLoop ? (
                            <Repeat size={12} className="text-white drop-shadow-lg" />
                        ) : (
                            <Power size={12} className="text-white drop-shadow-lg animate-pulse" />
                        )}
                    </div>
                    <div className="flex-1 flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/70 leading-none mb-0.5 drop-shadow">
                            {isLoop ? 'Loop' : 'Boot'}
                        </span>
                        <span className="text-[11px] font-bold text-white leading-none drop-shadow-lg">{label}</span>
                    </div>
                </div>

                {/* Properties Panel */}
                <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[200px]'}`}>
                    <div className="px-2.5 pb-2 pt-0.5 space-y-0.5">
                        <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-white/70">Priority</span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${priority === 'high'
                                ? 'bg-yellow-400/30 text-yellow-100'
                                : 'bg-white/20 text-white/90'
                                }`}>{priority}</span>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-white/70">Timeout</span>
                            <span className="text-[9px] font-mono font-bold text-white/90">{timeout}</span>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-white/70">Retry</span>
                            <span className="text-[9px] font-mono font-bold text-white/90">{retry}x</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Source Handle Only */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !bg-white !border-2 !border-slate-900 !-bottom-1.5 opacity-0 group-hover:opacity-100 transition shadow-xl"
            />
        </div>
    );
}
