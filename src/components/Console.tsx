import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ChevronDown, ChevronUp, Trash2, Eye, Edit3 } from 'lucide-react';
import type { TelemetryMessage } from '../types';

interface ConsoleProps {
    logs: TelemetryMessage[];
    onClear: () => void;
    liveViewMode: boolean;
    setLiveViewMode: (mode: boolean) => void;
}

const Console: React.FC<ConsoleProps> = ({ logs, onClear, liveViewMode, setLiveViewMode }) => {
    console.log("CONSOLE RECEIVED LOGS:", logs);
    const [isOpen, setIsOpen] = useState(true);
    const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
    const scrollRef = useRef<HTMLDivElement>(null);

    const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [filteredLogs]);

    if (!isOpen) {
        return (
            <div className="h-8 bg-[#131722] border-t border-white/10 flex items-center justify-between px-3 shrink-0">
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-white transition"
                >
                    <Terminal size={12} className="text-blue-500" />
                    <span>Console ({logs.length})</span>
                    <ChevronUp size={12} />
                </button>
            </div>
        );
    }

    return (
        <div className="h-48 bg-[#0d0f14] border-t border-white/10 flex flex-col shrink-0 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="h-9 bg-[#131722] border-b border-white/5 flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"
                    >
                        <Terminal size={12} className="text-blue-500" />
                        <span>Console</span>
                        <ChevronDown size={12} />
                    </button>

                    <div className="h-4 w-px bg-white/10" />

                    <div className="flex items-center gap-1">
                        {(['all', 'info', 'warn', 'error'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition ${filter === f ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setLiveViewMode(!liveViewMode)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300
                            ${liveViewMode
                                ? 'bg-blue-600 border border-blue-400 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                            }`}
                        title={liveViewMode ? 'Exit Live View Mode' : 'Enable Live Dashboard View'}
                    >
                        {liveViewMode ? <Edit3 size={10} /> : <Eye size={10} />}
                        {liveViewMode ? 'Live' : 'Live View'}
                    </button>

                    <button
                        onClick={onClear}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                        title="Clear Logs"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Log Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-2 font-mono text-[10px] selection:bg-blue-500/30"
            >
                {filteredLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 italic">
                        No telemetry data available...
                    </div>
                ) : (
                    filteredLogs.map(log => {
                        let dateStr = 'Unknown Time';
                        try {
                            const d = new Date(log.timestamp);
                            if (!isNaN(d.getTime())) {
                                dateStr = d.toLocaleTimeString();
                            }
                        } catch (e) {
                            console.warn("Invalid timestamp in log:", log);
                        }

                        return (
                            <div key={log.id} className="flex gap-3 py-0.5 border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] transition px-1">
                                <span className="text-slate-500 shrink-0">[{dateStr}]</span>
                                <span className={`shrink-0 font-bold uppercase w-8 ${log.level === 'error' ? 'text-red-400' :
                                    log.level === 'warn' ? 'text-amber-400' : 'text-blue-400'
                                    }`}>
                                    {log.level}
                                </span>
                                <span className="text-slate-300 break-all">{log.message || 'Empty message'}</span>
                                <span className="text-slate-600 ml-auto shrink-0">{log.deviceId}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Console;
