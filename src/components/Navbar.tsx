import React from 'react';
import { Database, Settings, Download, Play, Zap, ChevronDown, UserCircle } from 'lucide-react';

interface NavbarProps {
    onOpenSettings: () => void;
    onDownload: (e: any) => void;
    onSimulate: () => void;
    onDeploy: () => void;
    simulating: boolean;
    deploying: boolean;
    targetDevice: string;
}

const Navbar: React.FC<NavbarProps> = ({
    onOpenSettings,
    onDownload,
    onSimulate,
    onDeploy,
    simulating,
    deploying,
    targetDevice,
}) => {
    return (
        <nav className="h-14 shrink-0 border-b border-white/5 bg-[#131722]/80 backdrop-blur-xl flex items-center justify-between px-4 z-50">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <Database size={14} className="text-white" />
                    </div>
                    <h1 className="font-bold text-sm tracking-tight flex items-center gap-2">
                        Veex <span className="text-slate-500 font-normal">Studio</span>
                    </h1>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5 text-emerald-500/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                        Online
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onOpenSettings}
                    className="p-2 hover:bg-white/5 transition rounded-md text-slate-400 hover:text-white"
                    title="Project Settings"
                >
                    <Settings size={16} />
                </button>

                <button
                    onClick={onDownload}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition rounded-md text-[10px] font-semibold text-slate-300 border border-white/10"
                >
                    <Download size={12} /> .VEX
                </button>

                <button
                    onClick={onSimulate}
                    disabled={simulating}
                    className={`flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition rounded-md text-[10px] font-semibold text-green-400 border border-green-500/20 mr-2 ${simulating ? 'opacity-50' : ''}`}
                >
                    <Play size={12} fill="currentColor" />
                    {simulating ? 'Running...' : 'Run'}
                </button>

                <div className="flex items-center">
                    <button
                        disabled={deploying}
                        onClick={onDeploy}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-l-md text-[10px] font-bold transition
              ${deploying ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'}`}
                    >
                        <Zap size={12} fill="currentColor" />
                        {deploying ? 'Deploying...' : targetDevice === 'all' ? 'Deploy to Fleet' : 'Instant Flash'}
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-500 border-l border-white/10 px-1 py-1.5 rounded-r-md">
                        <ChevronDown size={14} />
                    </button>
                </div>
                <div className="ml-2 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 hover:border-blue-500/50 transition cursor-pointer overflow-hidden">
                    <UserCircle size={20} className="text-slate-400" />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
