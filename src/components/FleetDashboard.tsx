import React from 'react';
import { X, Cpu, RefreshCw, Zap, Wifi, Activity, Globe, HardDrive } from 'lucide-react';
import type { Device } from '../types';

interface FleetDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    devices: Device[];
    onReboot: (id: string) => void;
    onDeploy: (id: string) => void;
}

const FleetDashboard: React.FC<FleetDashboardProps> = ({ isOpen, onClose, devices, onReboot, onDeploy }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#000000]/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-[#0b0e14] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Activity size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-white text-lg font-bold tracking-tight">Fleet Command</h2>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">Device Registry & Management</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Device Grid */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {devices.length === 0 ? (
                        <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-slate-600">
                            <Cpu size={48} className="mb-4 opacity-20" />
                            <p className="font-medium tracking-wide">No active nodes detected in the registry</p>
                            <p className="text-[10px] uppercase tracking-widest mt-2">Check backend status or device power</p>
                        </div>
                    ) : (
                        devices.map(device => (
                            <div key={device.id} className="bg-[#131722] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 group shadow-xl">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${device.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'} border-4 border-${device.status === 'online' ? 'emerald' : 'red'}-500/20`} />
                                        <div>
                                            <h3 className="text-white font-bold text-sm tracking-tight">{device.name || 'Generic ESP32'}</h3>
                                            <p className="text-slate-500 text-[10px] font-mono">{device.id}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-white/5 px-2 py-0.5 rounded text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-white/5">
                                            v{device.version || '1.0.0'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="bg-black/20 rounded-xl p-3 border border-white/[0.02]">
                                        <div className="flex items-center gap-2 mb-1 text-slate-500">
                                            <Wifi size={10} />
                                            <span className="text-[8px] font-bold uppercase tracking-tighter">Connectivity</span>
                                        </div>
                                        <span className="text-slate-200 text-xs font-mono">{device.ip || '---.---.---.---'}</span>
                                    </div>
                                    <div className="bg-black/20 rounded-xl p-3 border border-white/[0.02]">
                                        <div className="flex items-center gap-2 mb-1 text-slate-500">
                                            <Activity size={10} />
                                            <span className="text-[8px] font-bold uppercase tracking-tighter">Uptime</span>
                                        </div>
                                        <span className="text-slate-200 text-xs font-mono">{device.uptime || '0h 00m'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                    <button
                                        onClick={() => onDeploy(device.id)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition shadow-lg shadow-blue-500/20 active:scale-95"
                                    >
                                        <Zap size={12} /> Push Updates
                                    </button>
                                    <button
                                        onClick={() => onReboot(device.id)}
                                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition border border-white/5 active:rotate-180 duration-500"
                                        title="Remote Reboot"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-2">
                            <Globe size={12} />
                            Registry: v1.0.4-LTS
                        </span>
                        <span className="flex items-center gap-2">
                            <HardDrive size={12} />
                            Protocol: Protobuf over WSS
                        </span>
                    </div>
                    <span>{devices.filter(d => d.status === 'online').length} Nodes Online</span>
                </div>
            </div>
        </div>
    );
};

export default FleetDashboard;
