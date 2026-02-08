import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useMemo, useState } from 'react';
import { Gauge as GaugeIcon, LineChart, Activity } from 'lucide-react';

interface DashboardNodeData {
    label: string;
    type: string;
    capability: string;
    params: {
        telemetryKey: string;
        min?: string;
        max?: string;
        unit?: string;
        buffer?: string;
        colorOn?: string;
        colorOff?: string;
    };
    telemetry?: any[]; // Passed from Workspace
    isLiveView?: boolean;
}

const Gauge = ({ value, min, max, unit }: { value: number; min: number; max: number; unit: string }) => {
    const percent = Math.min(Math.max((value - min) / (max - min), 0), 1);
    const rotation = percent * 180 - 180;

    return (
        <div className="flex flex-col items-center gap-2 py-2">
            <div className="relative w-32 h-16 overflow-hidden">
                <div className="absolute w-32 h-32 border-[12px] border-slate-800 rounded-full" />
                <div
                    className="absolute w-32 h-32 border-[12px] border-blue-500 rounded-full transition-transform duration-500 origin-center"
                    style={{ transform: `rotate(${rotation}deg)`, clipPath: 'inset(0 0 50% 0)' }}
                />
                <div className="absolute bottom-0 left-0 right-0 text-center">
                    <span className="text-lg font-black text-white">{value.toFixed(1)}</span>
                    <span className="text-[9px] text-slate-500 ml-1 uppercase">{unit}</span>
                </div>
            </div>
        </div>
    );
};

const LED = ({ active, colorOn, colorOff }: { active: boolean; colorOn: string; colorOff: string }) => (
    <div className="flex items-center justify-center gap-3 py-4">
        <div
            className="w-4 h-4 rounded-full transition-all duration-300 shadow-lg"
            style={{
                backgroundColor: active ? colorOn : colorOff,
                boxShadow: active ? `0 0 15px ${colorOn}` : 'none'
            }}
        />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-white' : 'text-slate-600'}`}>
            {active ? 'ACTIVE' : 'INACTIVE'}
        </span>
    </div>
);

const Chart = ({ data }: { data: number[] }) => {
    if (data.length === 0) return <div className="h-16 flex items-center justify-center text-[9px] text-slate-600">Waiting for data...</div>;

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * 140;
        const y = 40 - ((v - min) / range) * 35;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="h-16 w-full flex items-center justify-center px-2 py-2">
            <svg viewBox="0 0 140 40" className="w-full h-full overflow-visible">
                <path
                    d={`M ${points}`}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                />
            </svg>
        </div>
    );
};

export default function DashboardNode({ data, selected }: NodeProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const d = data as unknown as DashboardNodeData;
    const telemetryKey = d.params.telemetryKey;

    // Extract relevant data points from the telemetry buffer
    const readings = useMemo(() => {
        if (!d.telemetry) return [];
        return d.telemetry
            .filter(m => m.deviceId === telemetryKey || m.key === telemetryKey)
            .map(m => parseFloat(m.message) || 0)
            .reverse();
    }, [d.telemetry, telemetryKey]);

    const latestValue = readings.length > 0 ? readings[readings.length - 1] : 0;
    const isLiveView = d.isLiveView;

    return (
        <div className={`min-w-[180px] bg-[#131722]/90 backdrop-blur-3xl border 
          ${selected ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-white/5'} 
          rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden`}>

            {/* Header */}
            <div
                onDoubleClick={() => setIsCollapsed(!isCollapsed)}
                className="px-4 py-2 bg-white/[0.02] border-b border-white/5 flex items-center justify-between cursor-pointer select-none"
            >
                <div className="flex items-center gap-2">
                    <div className={`transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`}>
                        {d.capability === 'ui.gauge' && <GaugeIcon size={12} className="text-blue-400" />}
                        {d.capability === 'ui.chart' && <LineChart size={12} className="text-indigo-400" />}
                        {d.capability === 'ui.led' && <Activity size={12} className="text-emerald-400" />}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{d.label}</span>
                </div>
                {readings.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
            </div>

            {/* Content Area */}
            <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[500px]'}`}>
                <div className="p-4">
                    {d.capability === 'ui.gauge' && (
                        <Gauge
                            value={latestValue}
                            min={parseFloat(d.params.min || '0')}
                            max={parseFloat(d.params.max || '100')}
                            unit={d.params.unit || ''}
                        />
                    )}
                    {d.capability === 'ui.chart' && (
                        <Chart data={readings.slice(-30)} />
                    )}
                    {d.capability === 'ui.led' && (
                        <LED
                            active={latestValue > 0}
                            colorOn={d.params.colorOn || '#10b981'}
                            colorOff={d.params.colorOff || '#334155'}
                        />
                    )}

                    <div className="mt-2 flex justify-between items-center opacity-40">
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">Key: {telemetryKey}</span>
                        <span className="text-[8px] font-mono text-slate-500 tracking-tighter">
                            {readings.length > 0 ? 'STREAMING' : 'IDLE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Ports - Hidden in Live View */}
            {!isLiveView && (
                <>
                    <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-blue-500 !border-none !-top-1 px-0.5 opacity-0 hover:opacity-100 transition" />
                    <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-blue-500 !border-none !-bottom-1 px-0.5 opacity-0 hover:opacity-100 transition" />
                </>
            )}
        </div>
    );
}
