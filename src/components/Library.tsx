import {
    Cpu, Clock, Database, Send, Network,
    Activity, Thermometer, Droplets,
    Globe, Search, ChevronDown, Scissors, Trash2, Zap
} from 'lucide-react';
import React, { useState } from 'react';

const templates = [
    {
        id: 'tmpl-mqtt',
        title: 'MQTT Remote I/O',
        description: 'Control GPIO pins via MQTT messages.',
        icon: <Send size={14} />,
        nodes: [
            { id: '1', type: 'input', data: { label: 'Boot Sequence' }, position: { x: 250, y: 0 }, className: 'bg-white !text-slate-900 border-none rounded-lg px-6 py-3 font-bold shadow-xl !w-[160px] text-center text-[10px]' },
            { id: '2', type: 'action', data: { label: 'Listen MQTT', action: 'subscribe', type: 'comm.mqtt', params: { topic: 'v1/device/control/+' } }, position: { x: 250, y: 100 } },
            { id: '3', type: 'action', data: { label: 'Write GPIO', action: 'write', type: 'platform.gpio', params: { pin: '2', level: '$PAYLOAD' } }, position: { x: 250, y: 200 } },
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } },
            { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } },
        ]
    },
    {
        id: 'tmpl-can',
        title: 'CAN to Cloud Gateway',
        description: 'Forward CAN messages to a central MQTT broker.',
        icon: <Network size={14} />,
        nodes: [
            { id: '1', type: 'input', data: { label: 'Boot Sequence' }, position: { x: 250, y: 0 }, className: 'bg-white !text-slate-900 border-none rounded-lg px-6 py-3 font-bold shadow-xl !w-[160px] text-center text-[10px]' },
            { id: '2', type: 'action', data: { label: 'Read CAN', action: 'read', type: 'comm.can', params: { id: '0x123' } }, position: { x: 250, y: 100 } },
            { id: '3', type: 'action', data: { label: 'Publish Data', action: 'publish', type: 'comm.mqtt', params: { topic: 'v1/can/raw', payload: '$DATA' } }, position: { x: 250, y: 200 } },
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } },
            { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } },
        ]
    }
];

const categories = [
    {
        id: 'core',
        title: 'Platform Core',
        items: [
            { type: 'action', label: 'Wait (Delay)', capability: 'platform.core', icon: <Clock size={14} />, params: { ms: '1000' }, action: 'wait' },
            { type: 'action', label: 'System Check', capability: 'platform.core', icon: <Activity size={14} />, params: { check: 'uptime' }, action: 'wait' },
        ]
    },
    {
        id: 'digital',
        title: 'Digital I/O & Bus',
        items: [
            { type: 'action', label: 'GPIO Write', capability: 'platform.gpio', icon: <Cpu size={14} />, params: { pin: '2', level: '1' }, action: 'write' },
            { type: 'action', label: 'I2C Read', capability: 'platform.i2c', icon: <Database size={14} />, params: { address: '0x68', register: '0x3B' }, action: 'read' },
            { type: 'action', label: 'SPI Transfer', capability: 'platform.spi', icon: <Database size={14} />, params: { cs: '15', data: "0x00" }, action: 'transfer' },
            { type: 'action', label: 'Modbus Read', capability: 'modbus', icon: <Cpu size={14} />, params: { address: '4001', count: '1' }, action: 'read' },
        ]
    },
    {
        id: 'edge_ai',
        title: 'Edge AI & Analytics',
        items: [
            { type: 'action', label: 'ML Inference', capability: 'ml', icon: <Zap size={14} />, params: { model: 'vibration_v1.tflite' }, action: 'inference' },
        ]
    },
    {
        id: 'comms',
        title: 'Industrial Comms',
        items: [
            { type: 'action', label: 'CAN Send', capability: 'comm.can', icon: <Network size={14} />, params: { id: '0x123' }, action: 'read' },
            { type: 'action', label: 'MQTT Publish', capability: 'comm.mqtt', icon: <Send size={14} />, params: { topic: 'v1/telemetry' }, action: 'publish' },
        ]
    },
    {
        id: 'sensors',
        title: 'Sensors & Actuators',
        items: [
            { type: 'action', label: 'Temp (Generic)', capability: 'platform.sensor', icon: <Thermometer size={14} />, params: { type: 'temperature' }, action: 'read' },
            { type: 'action', label: 'Humidity (Generic)', capability: 'platform.sensor', icon: <Droplets size={14} />, params: { type: 'humidity' }, action: 'read' },
        ]
    }
];

export default function Library({
    onLoadTemplate,
    remoteTemplates = [],
    parseVDL,
    snippets = [],
    onDeleteSnippet
}: {
    onLoadTemplate: (nodes: any[], edges: any[]) => void,
    remoteTemplates?: any[],
    parseVDL: (vdl: string) => { nodes: any[], edges: any[] },
    snippets?: any[],
    onDeleteSnippet?: (id: string) => void
}) {
    const [openCats, setOpenCats] = useState<string[]>(['templates', 'snippets', ...categories.map(c => c.id)]);

    const groupedRemoteTemplates = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        if (Array.isArray(remoteTemplates)) {
            remoteTemplates.forEach(tmpl => {
                const cat = tmpl.category || 'other';
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(tmpl);
            });
        }
        return groups;
    }, [remoteTemplates]);

    const onDragStart = (event: React.DragEvent, nodeData: any) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
        event.dataTransfer.effectAllowed = 'move';
    };

    const toggleCat = (id: string) => {
        setOpenCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    return (
        <div className="w-[260px] shrink-0 border-r border-white/5 bg-[#131722]/40 backdrop-blur-xl flex flex-col h-full z-40">
            <div className="p-4 border-b border-white/5 bg-white/5">
                <div className="relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition" />
                    <input
                        type="text"
                        placeholder="Search capabilities..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-[11px] text-slate-300 focus:border-blue-500/50 outline-none transition"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
                <h2 className="px-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Templates</h2>

                <div className="mb-6">
                    <button
                        onClick={() => toggleCat('templates')}
                        className="w-full flex items-center justify-between px-5 py-2 hover:bg-white/5 transition group"
                    >
                        <span className="text-[11px] font-bold text-blue-400 flex items-center gap-3">
                            <ChevronDown size={14} className={`text-blue-500 transition-transform ${openCats.includes('templates') ? '' : '-rotate-90'}`} />
                            Quick Templates
                        </span>
                    </button>

                    {openCats.includes('templates') && (
                        <div className="mt-2 px-4 space-y-2">
                            {templates.map((tmpl) => (
                                <button
                                    key={tmpl.id}
                                    onClick={() => onLoadTemplate(tmpl.nodes, tmpl.edges)}
                                    className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="text-blue-500 group-hover:scale-110 transition-transform">{tmpl.icon}</div>
                                        <span className="text-[11px] font-bold text-slate-200">{tmpl.title}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 leading-tight">{tmpl.description}</p>
                                </button>
                            ))}

                            {Object.entries(groupedRemoteTemplates).map(([category, tmpls]) => (
                                <div key={category} className="pt-4 border-t border-white/5 mt-4">
                                    <h3 className="px-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{category}</h3>
                                    <div className="space-y-2">
                                        {tmpls.map((tmpl) => (
                                            <button
                                                key={tmpl.id}
                                                onClick={() => {
                                                    const { nodes, edges } = parseVDL(tmpl.vdl);
                                                    onLoadTemplate(nodes, edges);
                                                }}
                                                className="w-full text-left p-3 rounded-lg bg-blue-600/10 border border-blue-500/20 hover:border-blue-400 hover:bg-blue-600/20 transition-all group"
                                            >
                                                <div className="flex items-center gap-3 mb-1">
                                                    <div className="text-emerald-500 group-hover:scale-110 transition-transform"><Globe size={14} /></div>
                                                    <span className="text-[11px] font-bold text-slate-100">{tmpl.title}</span>
                                                </div>
                                                <p className="text-[9px] text-slate-400 leading-tight">{tmpl.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <button
                        onClick={() => toggleCat('snippets')}
                        className="w-full flex items-center justify-between px-5 py-2 hover:bg-white/5 transition group"
                    >
                        <span className="text-[11px] font-bold text-amber-500 flex items-center gap-3">
                            <ChevronDown size={14} className={`text-amber-500 transition-transform ${openCats.includes('snippets') ? '' : '-rotate-90'}`} />
                            Custom Snippets
                        </span>
                        <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 rounded-full font-black ml-auto border border-amber-500/20">
                            {snippets.length}
                        </span>
                    </button>

                    {openCats.includes('snippets') && (
                        <div className="mt-2 px-4 space-y-2">
                            {snippets.length === 0 ? (
                                <p className="text-[9px] text-slate-600 px-1 italic">Save nodes as snippets...</p>
                            ) : (
                                snippets.map((snip) => (
                                    <div key={snip.id} className="group relative">
                                        <div
                                            draggable
                                            onDragStart={(e) => onDragStart(e, { type: 'snippet', id: snip.id })}
                                            className="w-full text-left p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all cursor-grab active:cursor-grabbing"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="text-amber-500"><Scissors size={12} /></div>
                                                <span className="text-[10px] font-bold text-slate-300 truncate pr-6">{snip.name}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onDeleteSnippet?.(snip.id)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="h-px bg-white/5 mx-5 mb-6" />

                {categories.map((cat) => (
                    <div key={cat.id} className="mb-1">
                        <button onClick={() => toggleCat(cat.id)} className="w-full flex items-center justify-between px-5 py-2 hover:bg-white/5 transition group">
                            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-3">
                                <ChevronDown size={14} className={`text-slate-600 transition-transform ${openCats.includes(cat.id) ? '' : '-rotate-90'}`} />
                                {cat.title}
                            </span>
                        </button>
                        {openCats.includes(cat.id) && (
                            <div className="mt-1 pb-2">
                                {cat.items.map((item) => (
                                    <div
                                        key={item.label}
                                        className="group flex items-center gap-3 px-10 py-2 cursor-grab active:cursor-grabbing hover:bg-blue-600/10 transition-all border-l-2 border-transparent hover:border-blue-500"
                                        onDragStart={(event) => onDragStart(event, item)}
                                        draggable
                                    >
                                        <div className="text-slate-500 group-hover:text-blue-400 transition">{item.icon}</div>
                                        <span className="text-[11px] text-slate-400 group-hover:text-slate-200 transition truncate">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
