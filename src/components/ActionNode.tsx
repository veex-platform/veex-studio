import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
    Settings, Cpu, Globe, Network,
    Bluetooth, Clock, Send, Thermometer,
    Zap
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
    'platform.gpio': <Cpu size={12} />,
    'platform.core': <Clock size={12} />,
    'comm.mqtt': <Send size={12} />,
    'comm.can': <Network size={12} />,
    'comm.http': <Globe size={12} />,
    'comm.grpc': <Globe size={12} />,
    'comm.ble': <Bluetooth size={12} />,
    'platform.sensor': <Thermometer size={12} />,
};

const colorMap: Record<string, string> = {
    'platform.gpio': 'from-blue-600/40 text-blue-400',
    'platform.core': 'from-slate-600/40 text-slate-400',
    'comm.mqtt': 'from-emerald-600/40 text-emerald-400',
    'comm.can': 'from-orange-600/40 text-orange-400',
    'comm.http': 'from-indigo-600/40 text-indigo-400',
    'platform.sensor': 'from-rose-600/40 text-rose-400',
};

export default function ActionNode({ data, selected }: NodeProps) {
    // We'll use the id and a custom context or just data to determine active state.
    // For simplicity with xyflow, we'll assume 'active' is passed in data or we can extend NodeProps.
    const isActive = data.isActive === true;
    const capability = (data.type as string) || 'platform.core';
    const Icon = iconMap[capability] || <Zap size={12} />;
    const theme = colorMap[capability] || 'from-blue-600/40 text-blue-400';
    const params = (data.params as Record<string, any>) || {};

    return (
        <div className={`min-w-[170px] bg-[#131722]/95 backdrop-blur-xl border-2 
          ${selected ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' :
                isActive ? 'border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.6)] animate-pulse' : 'border-white/5'} 
          rounded-xl shadow-2xl overflow-hidden transition-all duration-300 group relative`}>

            {isActive && (
                <div className="absolute inset-0 bg-blue-500/10 animate-ping pointer-events-none" />
            )}
            {/* Capability Header */}
            <div className={`px-3 py-1.5 bg-gradient-to-r ${theme.split(' ')[0]} to-transparent flex items-center gap-2 border-b border-white/5`}>
                <span className={theme.split(' ')[1]}>{Icon}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">{capability.split('.')[1]}</span>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition">
                    <Settings size={10} className="text-white/40 hover:text-white" />
                </div>
            </div>

            {/* Content Area */}
            <div className="p-3 bg-slate-900/20">
                <h3 className="text-[11px] font-bold text-slate-100 mb-1.5 leading-tight">{data.label as string}</h3>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 uppercase">
                        <span>Action</span>
                        <span className="text-blue-400/80">{data.action as string}</span>
                    </div>
                    {Object.entries(params).slice(0, 2).map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center text-[9px] font-mono border-t border-white/[0.03] pt-1 mt-1">
                            <span className="text-slate-500 lowercase">{k}</span>
                            <span className="text-blue-200/90">{String(v)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Connection Ports */}
            <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-blue-500 !border-none !-top-1 opacity-0 group-hover:opacity-100 transition" />
            <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-blue-500 !border-none !-bottom-1 opacity-0 group-hover:opacity-100 transition" />
        </div>
    );
}
