import {
    Cpu, Clock, Database, Send, Network,
    Activity, Thermometer, Droplets,
    Globe, Search, ChevronDown, Scissors, Trash2, Zap, Tag,
    Gauge, LineChart, ChevronsUpDown, ChevronsDownUp, Repeat
} from 'lucide-react';
import React, { useState } from 'react';

const templates = [
    {
        id: 'tmpl-mqtt',
        title: 'MQTT Remote I/O',
        description: 'Control GPIO pins via MQTT messages.',
        icon: <Send size={14} />,
        nodes: [
            { id: '1', type: 'trigger', data: { label: 'Boot Sequence', action: 'boot', params: { priority: 'high', timeout: '30s', retry: '3' } }, position: { x: 250, y: 0 } },
            { id: '2', type: 'action', data: { label: 'Listen MQTT', action: 'subscribe', type: 'comm.mqtt', params: { action: 'subscribe', topic: 'v1/device/control/+' } }, position: { x: 250, y: 100 } },
            { id: '3', type: 'action', data: { label: 'Write GPIO', action: 'write', type: 'platform.gpio', params: { action: 'write', pin: '2', level: '$PAYLOAD' } }, position: { x: 250, y: 200 } },
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
            { id: '1', type: 'trigger', data: { label: 'Boot Sequence', action: 'boot', params: { priority: 'high', timeout: '30s', retry: '3' } }, position: { x: 250, y: 0 } },
            { id: '2', type: 'action', data: { label: 'Read CAN', action: 'read', type: 'comm.can', params: { action: 'read', id: '0x123' } }, position: { x: 250, y: 100 } },
            { id: '3', type: 'action', data: { label: 'Publish Data', action: 'publish', type: 'comm.mqtt', params: { action: 'publish', topic: 'v1/can/raw', payload: '$DATA' } }, position: { x: 250, y: 200 } },
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
            { type: 'action', label: 'Main Loop', capability: 'platform.core', icon: <Repeat size={14} />, action: 'loop' },
        ]
    },
    {
        id: 'digital',
        title: 'Digital I/O & Bus',
        items: [
            { type: 'action', label: 'GPIO', capability: 'platform.gpio', icon: <Cpu size={14} />, params: { pin: '2', action: 'write', level: '1' }, action: 'write' },
            { type: 'action', label: 'I2C', capability: 'platform.i2c', icon: <Database size={14} />, params: { address: '0x68', action: 'read', register: '0x3B' }, action: 'read' },
            { type: 'action', label: 'SPI', capability: 'platform.spi', icon: <Database size={14} />, params: { cs: '15', action: 'transfer', data: "0x00" }, action: 'transfer' },
            { type: 'action', label: 'Modbus', capability: 'modbus', icon: <Cpu size={14} />, params: { address: '4001', action: 'read', count: '1' }, action: 'read' },
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
            { type: 'action', label: 'CAN Bus', capability: 'comm.can', icon: <Network size={14} />, params: { id: '0x123', action: 'send' }, action: 'send' },
            { type: 'action', label: 'MQTT', capability: 'comm.mqtt', icon: <Send size={14} />, params: { topic: 'v1/telemetry', action: 'publish' }, action: 'publish' },
        ]
    },
    {
        id: 'sensors',
        title: 'Sensors & Actuators',
        items: [
            { type: 'action', label: 'Temperature', capability: 'platform.sensor', icon: <Thermometer size={14} />, params: { type: 'temperature' }, action: 'read' },
            { type: 'action', label: 'Humidity', capability: 'platform.sensor', icon: <Droplets size={14} />, params: { type: 'humidity' }, action: 'read' },
        ]
    },
    {
        id: 'logic',
        title: 'Logic & State',
        items: [
            { type: 'action', label: 'State Variable', capability: 'platform.logic', icon: <Tag size={14} />, params: { key: 'my_var', action: 'set', value: '10' }, action: 'set' },
        ]
    },
    {
        id: 'dashboard',
        title: 'Live View Dashboard',
        items: [
            { type: 'dashboard', label: 'Gauge Display', capability: 'ui.gauge', icon: <Gauge size={14} />, params: { telemetryKey: 'temp', min: '0', max: '100', unit: '°C' }, action: 'display' },
            { type: 'dashboard', label: 'Real-time Chart', capability: 'ui.chart', icon: <LineChart size={14} />, params: { telemetryKey: 'vibration', buffer: '50' }, action: 'stream' },
            { type: 'dashboard', label: 'Status LED', capability: 'ui.led', icon: <Activity size={14} />, params: { telemetryKey: 'status', colorOn: '#10b981', colorOff: '#334155' }, action: 'indicator' },
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
    const [openCats, setOpenCats] = useState<string[]>([]);



    const onDragStart = (event: React.DragEvent, nodeType: string, capability: string, label: string, action: string, params: any) => {
        const dragData = {
            type: nodeType,
            capability,
            label,
            action,
            params
        };
        event.dataTransfer.setData('application/reactflow', JSON.stringify(dragData));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragSnippetStart = (event: React.DragEvent, snippetId: string) => {
        const dragData = {
            type: 'snippet',
            id: snippetId
        };
        event.dataTransfer.setData('application/reactflow', JSON.stringify(dragData));
        event.dataTransfer.effectAllowed = 'move';
    };

    const toggleCat = (id: string) => {
        setOpenCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0d0f14]">
            <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-[#131722]/50">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search capabilities..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-[11px] text-slate-300 outline-none focus:border-blue-500/50 transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setOpenCats(['templates', 'snippets', 'remote-gallery', ...categories.map(c => c.id)])}
                        title="Expand All"
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition"
                    >
                        <ChevronsUpDown size={14} />
                    </button>
                    <button
                        onClick={() => setOpenCats([])}
                        title="Collapse All"
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition"
                    >
                        <ChevronsDownUp size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 scrollbar-hide">
                {/* Templates Section */}
                <div className="space-y-1">
                    <button
                        onClick={() => toggleCat('templates')}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition group"
                    >
                        <span className="text-[10px] font-black tracking-[0.15em] text-slate-500 uppercase group-hover:text-slate-300">Starter Templates</span>
                        <ChevronDown size={12} className={`text-slate-600 transition-transform ${openCats.includes('templates') ? '' : '-rotate-90'}`} />
                    </button>
                    {openCats.includes('templates') && (
                        <div className="px-2 pt-1 pb-2 space-y-2">
                            {templates.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => onLoadTemplate(t.nodes, t.edges)}
                                    className="p-3 bg-[#131722] border border-white/5 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/[0.02] transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition">
                                            {t.icon}
                                        </div>
                                        <h4 className="text-[11px] font-bold text-slate-200">{t.title}</h4>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{t.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* VEEX Platform Gallery (Consolidated) */}
                {remoteTemplates.length > 0 && (
                    <div className="space-y-1">
                        <button
                            onClick={() => toggleCat('remote-gallery')}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition group"
                        >
                            <span className="text-[10px] font-black tracking-[0.15em] text-slate-500 uppercase group-hover:text-slate-300">Platform Gallery</span>
                            <ChevronDown size={12} className={`text-slate-600 transition-transform ${openCats.includes('remote-gallery') ? '' : '-rotate-90'}`} />
                        </button>
                        {openCats.includes('remote-gallery') && (
                            <div className="px-2 pt-1 pb-2 space-y-2">
                                {remoteTemplates.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => {
                                            const res = parseVDL(t.vdl);
                                            onLoadTemplate(res.nodes, res.edges);
                                        }}
                                        className="p-3 bg-[#131722] border border-white/5 rounded-xl cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] transition-all group"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
                                                    <Globe size={14} />
                                                </div>
                                                <h4 className="text-[11px] font-bold text-slate-200">{t.name}</h4>
                                            </div>
                                            <span className="text-[8px] font-black text-emerald-500/50 uppercase border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                                                {t.category || 'Core'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium line-clamp-2">{t.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Custom Snippets */}
                {snippets.length > 0 && (
                    <div className="space-y-1">
                        <button
                            onClick={() => toggleCat('snippets')}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition group"
                        >
                            <span className="text-[10px] font-black tracking-[0.15em] text-slate-500 uppercase group-hover:text-slate-300">Saved Snippets</span>
                            <ChevronDown size={12} className={`text-slate-600 transition-transform ${openCats.includes('snippets') ? '' : '-rotate-90'}`} />
                        </button>
                        {openCats.includes('snippets') && (
                            <div className="px-2 pt-1 pb-2 space-y-2">
                                {snippets.map(s => (
                                    <div
                                        key={s.id}
                                        draggable
                                        onDragStart={(e) => onDragSnippetStart(e, s.id)}
                                        className="p-3 bg-[#131722] border border-white/5 rounded-xl cursor-grab active:cursor-grabbing hover:border-amber-500/50 hover:bg-amber-500/[0.02] transition-all group relative"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition">
                                                <Scissors size={14} />
                                            </div>
                                            <h4 className="text-[11px] font-bold text-slate-200">{s.name}</h4>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteSnippet?.(s.id);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Capability Categories */}
                {categories.map(cat => (
                    <div key={cat.id} className="space-y-1">
                        <button
                            onClick={() => toggleCat(cat.id)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition group"
                        >
                            <span className="text-[10px] font-black tracking-[0.15em] text-slate-500 uppercase group-hover:text-slate-300">{cat.title}</span>
                            <ChevronDown size={12} className={`text-slate-600 transition-transform ${openCats.includes(cat.id) ? '' : '-rotate-90'}`} />
                        </button>
                        {openCats.includes(cat.id) && (
                            <div className="grid grid-cols-1 gap-1.5 px-2">
                                {cat.items.map(item => (
                                    <div
                                        key={item.label}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, item.type, item.capability, item.label, item.action, item.params)}
                                        className="flex items-center gap-3 px-3 py-2 bg-[#131722] border border-white/[0.03] rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-500/30 hover:bg-blue-500/[0.02] transition-all group"
                                    >
                                        <div className="text-slate-500 group-hover:text-blue-400 transition">
                                            {item.icon}
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-300 group-hover:text-white transition">{item.label}</span>
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
