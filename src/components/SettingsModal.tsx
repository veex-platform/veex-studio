import { X, Save, Server, Wifi, Cpu } from 'lucide-react';
import { useState } from 'react';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    config: any;
    onSave: (newConfig: any) => void;
}

export default function SettingsModal({ isOpen, onClose, config, onSave }: SettingsProps) {
    const [localConfig, setLocalConfig] = useState(config);

    if (!isOpen) return null;

    const handleChange = (section: string, key: string, value: string) => {
        setLocalConfig((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const handleSave = () => {
        onSave(localConfig);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="bg-[#131722] border border-white/10 rounded-xl shadow-2xl w-[500px] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                        <Server size={14} className="text-blue-500" />
                        Project Settings
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Target Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Cpu size={12} className="text-blue-400" /> Target Hardware
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {['esp32', 'm5stack-core2'].map((target) => (
                                <button
                                    key={target}
                                    onClick={() => setLocalConfig({ ...localConfig, target })}
                                    className={`px-4 py-2 rounded-lg text-[11px] font-mono border transition text-left
                                    ${localConfig.target === target
                                            ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                            : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/5'}`}
                                >
                                    {target}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Infrastructure Config */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Wifi size={12} className="text-emerald-400" /> Connectivity
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <span className="text-[10px] text-slate-400">WiFi SSID</span>
                                <input
                                    type="text"
                                    value={localConfig.wifi?.ssid || ''}
                                    onChange={(e) => handleChange('wifi', 'ssid', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-[11px] text-slate-300 outline-none focus:border-emerald-500/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-[10px] text-slate-400">WiFi Password</span>
                                <input
                                    type="password"
                                    value={localConfig.wifi?.password || ''}
                                    onChange={(e) => handleChange('wifi', 'password', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-[11px] text-slate-300 outline-none focus:border-emerald-500/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-400">MQTT Broker URL</span>
                            <input
                                type="text"
                                placeholder="tcp://broker.hivemq.com:1883"
                                value={localConfig.mqtt?.broker || ''}
                                onChange={(e) => handleChange('mqtt', 'broker', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-[11px] text-slate-300 outline-none focus:border-blue-500/50 font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-400">Registry API URL</span>
                            <input
                                type="text"
                                placeholder="https://registry.veexplatform.com"
                                value={localConfig.registry?.url || ''}
                                onChange={(e) => handleChange('registry', 'url', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-[11px] text-slate-300 outline-none focus:border-blue-500/50 font-mono"
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition shadow-lg shadow-blue-500/20"
                    >
                        <Save size={14} /> Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
