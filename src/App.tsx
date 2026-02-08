import { useState, useRef, useEffect, useCallback } from 'react';
import { useMonaco } from '@monaco-editor/react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RefreshCw, Loader2, WifiOff, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { type Node, type Edge } from '@xyflow/react';

// Hooks
import { useStudioState } from './hooks/useStudioState';
import { usePlatformConnection } from './hooks/usePlatformConnection';
import { useEditorLogic } from './hooks/useEditorLogic';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import Library from './components/Library';
import SettingsModal from './components/SettingsModal';
import FleetDashboard from './components/FleetDashboard';

import './index.css';
import ActionNode from './components/ActionNode';
import DashboardNode from './components/DashboardNode';
import TriggerNode from './components/TriggerNode';

const nodeTypes = {
  action: ActionNode,
  dashboard: DashboardNode,
  trigger: TriggerNode,
};

function Studio() {
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'visual' | 'code'>('visual');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('vertical');
  const [isVdlFirst, setIsVdlFirst] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<any>('info');
  const [targetDevice] = useState<string>("all");
  const [libraryWidth, setLibraryWidth] = useState(280);
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState(false);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);

  const [projectConfig, setProjectConfig] = useState({
    target: 'esp32',
    wifi: { ssid: 'Factory_Guest', password: 'secure_iot_pass' },
    mqtt: { broker: 'tcp://broker.emqx.io:1883' },
    registry: { url: import.meta.env.VITE_REGISTRY_URL || 'https://registry.veexplatform.com/api/v1' }
  });

  const monaco = useMonaco();
  const editorRef = useRef<any>(null);

  // Business Logic Hooks
  const studio = useStudioState();
  const connection = usePlatformConnection(
    projectConfig,
    setStatus,
    setStatusType,
    studio.triggerActiveNode
  );
  const editor = useEditorLogic(
    studio.nodes,
    projectConfig,
    connection.registryUrl,
    connection.connectionState,
    monaco,
    editorRef,
    setStatus,
    setStatusType
  );

  const parseVDL = (vdlStr: string): { nodes: Node[], edges: Edge[] } => {
    const newNodes: Node[] = [
      {
        id: '1',
        type: 'trigger',
        data: {
          label: 'Boot Sequence',
          action: 'boot',
          params: {
            priority: 'high',
            timeout: '30s',
            retry: '3'
          }
        },
        position: { x: 250, y: 0 }
      }
    ];
    const newEdges: Edge[] = [];

    const stepLines = vdlStr.split('\n');
    let currentStep: any = null;
    let y = 100;
    let prevId = '1';
    let isParsingParams = false;

    const createNode = (id: string, step: any, y: number) => {
      const isDashboard = step.type.startsWith('ui.');
      return {
        id,
        type: isDashboard ? 'dashboard' : 'action',
        position: { x: 250, y },
        data: { ...step }
      };
    };

    stepLines.forEach(line => {
      const trimmed = line.trim();
      const indent = line.search(/\S/);

      if (trimmed.startsWith('- name:')) {
        if (currentStep) {
          const id = `${newNodes.length + 1}`;
          newNodes.push(createNode(id, currentStep, y));
          newEdges.push({ id: `e${prevId}-${id}`, source: prevId, target: id, animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } });
          prevId = id;
          y += 100;
        }
        isParsingParams = false;
        const nameVal = trimmed.split(':').slice(1).join(':').trim().replace(/"/g, '');
        currentStep = { label: nameVal, params: {}, type: 'platform.core', action: 'wait' };
      } else if (trimmed.startsWith('capability:')) {
        currentStep.type = trimmed.split(':').slice(1).join(':').trim().replace(/"/g, '');
      } else if (trimmed.startsWith('action:')) {
        currentStep.action = trimmed.split(':').slice(1).join(':').trim().replace(/"/g, '');
      } else if (trimmed.startsWith('params:')) {
        if (trimmed.includes('{')) {
          const pStr = trimmed.split('{')[1].split('}')[0];
          pStr.split(',').forEach(p => {
            const parts = p.split(':').map(s => s.trim().replace(/"/g, ''));
            if (parts.length >= 2) currentStep.params[parts[0]] = parts.slice(1).join(':');
          });
        } else {
          isParsingParams = true;
        }
      } else if (isParsingParams && indent >= 8 && trimmed.includes(':')) {
        const parts = trimmed.split(':').map(s => s.trim().replace(/"/g, ''));
        if (parts.length >= 2) currentStep.params[parts[0]] = parts.slice(1).join(':');
      }
    });

    if (currentStep) {
      const id = `${newNodes.length + 1}`;
      newNodes.push(createNode(id, currentStep, y));
      newEdges.push({ id: `e${prevId}-${id}`, source: prevId, target: id, animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } });
    }

    return { nodes: newNodes, edges: newEdges };
  };

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 180 && newWidth < 600) {
        setLibraryWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // --------------------------------------------------------------------------
  // RENDER: Loading / Offline / Connected
  // --------------------------------------------------------------------------

  if (connection.connectionState === 'initializing' || connection.connectionState === 'checking') {
    return (
      <div className="w-full h-full bg-[#0d0f14] flex flex-col items-center justify-center p-4">
        <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
        <h2 className="text-slate-200 text-sm font-bold tracking-widest uppercase">Connecting to Platform</h2>
        <p className="text-slate-500 text-xs mt-2">Verifying Backend Services...</p>
      </div>
    );
  }

  if (connection.connectionState === 'offline') {
    return (
      <div className="w-full h-full bg-[#0d0f14] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
          <WifiOff size={32} className="text-red-500" />
        </div>
        <h2 className="text-white text-lg font-bold">Connection Failed</h2>
        <p className="text-slate-400 text-xs mt-2 mb-6 max-w-xs text-center leading-relaxed">
          Could not reach the Veex Platform Registry at <br />
          <code className="bg-white/5 px-2 py-0.5 rounded text-red-300">{connection.registryUrl}</code>
        </p>

        {connection.connectionError && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 mb-6 max-w-sm text-center">
            <span className="text-[10px] text-red-400 font-mono">{connection.connectionError}</span>
          </div>
        )}

        <button
          onClick={connection.checkHealth}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition shadow-lg shadow-blue-500/20"
        >
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0d0f14] text-slate-100 flex flex-col overflow-hidden">
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDownload={editor.onDownload}
        onSimulate={editor.onSimulate}
        onDeploy={() => editor.onDeploy(targetDevice)}
        simulating={editor.simulating}
        deploying={editor.deploying}
        targetDevice={targetDevice}
        onOpenFleet={() => setIsFleetOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <div
          className={`flex flex-col border-r border-white/5 bg-[#0d0f14] transition-all duration-300 ease-in-out relative
            ${isLibraryCollapsed ? 'w-0 opacity-0 pointer-events-none' : ''}`}
          style={{ width: isLibraryCollapsed ? 0 : libraryWidth }}
        >
          <Library
            onLoadTemplate={studio.onLoadTemplate}
            remoteTemplates={connection.remoteTemplates}
            parseVDL={parseVDL}
            snippets={studio.snippets}
            onDeleteSnippet={studio.deleteSnippet}
          />

          {/* Resize Handle */}
          <div
            onMouseDown={startResizing}
            className={`absolute top-0 -right-0.5 w-1 h-full cursor-col-resize z-50 hover:bg-blue-500/50 transition-colors
              ${isResizing ? 'bg-blue-500 w-1' : 'bg-transparent'}`}
          />
        </div>

        {/* Collapse/Expand Toggle */}
        <button
          onClick={() => setIsLibraryCollapsed(!isLibraryCollapsed)}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-[60] p-1 bg-[#131722] border border-white/10 rounded-r-lg text-slate-500 hover:text-white hover:bg-blue-500/20 transition-all
            ${isLibraryCollapsed ? 'translate-x-0' : ''}`}
          style={{ left: isLibraryCollapsed ? 0 : libraryWidth }}
        >
          {isLibraryCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>

        <Workspace
          nodes={studio.nodes}
          edges={studio.edges}
          onNodesChange={studio.onNodesChange}
          onEdgesChange={studio.onEdgesChange}
          onConnect={studio.onConnect}
          isValidConnection={studio.isValidConnection}
          setReactFlowInstance={studio.setReactFlowInstance}
          reactFlowInstance={studio.reactFlowInstance}
          onNodeClick={studio.onNodeClick}
          onEdgeClick={studio.onEdgeClick}
          onPaneClick={studio.onPaneClick}
          onDragOver={(e: any) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={studio.onDrop}
          viewMode={viewMode}
          orientation={orientation}
          isVdlFirst={isVdlFirst}
          setViewMode={setViewMode}
          setOrientation={setOrientation}
          setIsVdlFirst={setIsVdlFirst}
          vdlPreview={editor.vdlPreview}
          validationErrors={editor.validationErrors}
          editorRef={editorRef}
          nodeTypes={nodeTypes}
          activeNodes={studio.activeNodes}
          logs={[...editor.simulationLogs, ...connection.telemetry]}
          onClearLogs={() => editor.setSimulationLogs([])}
          onSaveSnippet={studio.saveSelectionAsSnippet}
          isConsoleCollapsed={isConsoleCollapsed}
          setIsConsoleCollapsed={setIsConsoleCollapsed}
          deleteSelection={studio.deleteSelection}
        />

        <div className={`shrink-0 bg-[#131722]/50 backdrop-blur-3xl flex flex-col min-h-0 border-l border-white/5 transition-all duration-300 ease-in-out relative
          ${isPropertiesCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-[300px]'}`}>
          <Sidebar
            selectedNode={studio.selectedNode}
            selectedEdge={studio.selectedEdge}
            viewMode={viewMode}
            onSetViewMode={setViewMode}
            updateNodeData={studio.updateNodeData}
            deleteSelection={studio.deleteSelection}
          />
        </div>

        {/* Properties Panel Collapse/Expand Toggle */}
        <button
          onClick={() => setIsPropertiesCollapsed(!isPropertiesCollapsed)}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-[60] p-1 bg-[#131722] border border-white/10 rounded-l-lg text-slate-500 hover:text-white hover:bg-blue-500/20 transition-all
            ${isPropertiesCollapsed ? 'translate-x-0' : ''}`}
          style={{ right: isPropertiesCollapsed ? 0 : 300 }}
        >
          {isPropertiesCollapsed ? <PanelLeftClose size={14} className="rotate-180" /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {status && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg shadow-2xl border backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4
          ${statusType === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            statusType === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}
        >
          {statusType === 'loading' && <Loader2 size={14} className="animate-spin" />}
          <span className="text-[10px] font-bold uppercase tracking-widest">{status}</span>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={projectConfig}
        onSave={setProjectConfig}
      />

      <FleetDashboard
        isOpen={isFleetOpen}
        onClose={() => setIsFleetOpen(false)}
        devices={connection.devices}
        onReboot={(id) => {
          setStatus(`Rebooting ${id}...`);
          setTimeout(() => setStatus(null), 3000);
        }}
        onDeploy={(id) => {
          editor.onDeploy(id);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Studio />
    </ReactFlowProvider>
  );
}
