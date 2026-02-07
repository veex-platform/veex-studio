import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './index.css';
import ActionNode from './components/ActionNode';
import Library from './components/Library';
import { Download, Database, ListTree, Zap, ChevronDown, UserCircle, Trash2, Settings, Maximize2, Minimize2, Minus, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import SettingsModal from './components/SettingsModal';
import { motion, AnimatePresence } from 'framer-motion';

const nodeTypes = {
  action: ActionNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Boot Sequence' },
    position: { x: 300, y: 50 },
    className: 'bg-white !text-slate-900 border-none rounded-lg px-6 py-3 font-bold shadow-xl !w-[160px] text-center text-[10px]',
  },
  {
    id: '2',
    type: 'action',
    data: { label: 'Industrial Blink', action: 'write', type: 'platform.gpio', params: { pin: '2', level: '1' } },
    position: { x: 300, y: 150 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } },
];

let id = 3;
const getId = () => `${id++}`;

function Studio() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [deploying, setDeploying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [vdlMode, setVdlMode] = useState<'min' | 'normal' | 'max'>('normal');
  const [projectConfig, setProjectConfig] = useState({
    target: 'esp32',
    wifi: { ssid: 'Factory_Guest', password: 'secure_iot_pass' },
    mqtt: { broker: 'tcp://broker.emqx.io:1883' },
    registry: { url: import.meta.env.VITE_REGISTRY_URL || 'https://registry.veexplatform.com/api/v1' }
  });
  const [remoteTemplates, setRemoteTemplates] = useState<any[]>([]);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [targetDevice, setTargetDevice] = useState<string>("all");
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | 'loading'>('info');

  // Industrial Connectivity: Dynamic Backend Discovery
  const registryUrl = useMemo(() => {
    const configUrl = projectConfig.registry?.url;
    if (configUrl) {
      if (configUrl.startsWith('http')) return configUrl;
      // Handle relative paths
      if (configUrl.startsWith('/')) return `${window.location.origin}${configUrl}`;
      return configUrl;
    }
    return 'https://registry.veexplatform.com/api/v1';
  }, [projectConfig.registry?.url]);

  // Fetch templates and devices from Platform
  React.useEffect(() => {
    fetch(`${registryUrl}/dev/templates`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch templates');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setRemoteTemplates(data);
        } else {
          setRemoteTemplates([]);
        }
      })
      .catch(() => {
        console.warn("Registry templates offline");
        setRemoteTemplates([]);
      });

    fetch(`${registryUrl}/admin/devices`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch devices');
        return res.json();
      })
      .then(data => {
        // API returns { devices: [], total: N }
        if (data && Array.isArray(data.devices)) {
          setAvailableDevices(data.devices);
        } else if (Array.isArray(data)) {
          // Fallback if API changes
          setAvailableDevices(data);
        } else {
          setAvailableDevices([]);
        }
      })
      .catch(() => {
        console.warn("Registry devices offline");
        setAvailableDevices([]);
      });
  }, [registryUrl]);

  // WebSocket for Real-time Events
  React.useEffect(() => {
    if (!registryUrl) return;

    // Convert http(s) to ws(s)
    const wsUrl = registryUrl.replace(/^http/, 'ws') + '/ws';
    console.log("Connecting to WebSocket:", wsUrl);

    let socket: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("WebSocket connected");
        setStatusType('success');
        setStatus("Real-time Link Established");
        setTimeout(() => setStatus(null), 3000);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'device_registered') {
            const device = msg.payload;
            setStatusType('info');
            setStatus(`New Device: ${device.id}`);

            // Refresh device list
            fetch(`${registryUrl}/admin/devices`)
              .then(res => res.json())
              .then(data => {
                if (data && Array.isArray(data.devices)) {
                  setAvailableDevices(data.devices);
                }
              })
              .catch(console.error);

            setTimeout(() => setStatus(null), 4000);
          }
        } catch (e) {
          console.error("WS Parse Error", e);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected, reconnecting...");
        reconnectTimer = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.warn("WebSocket error", err);
        socket?.close();
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [registryUrl]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } }, eds)),
    [setEdges]
  );

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      // No self-loops
      if (connection.source === connection.target) return false;

      // Prevent connecting TO the Boot Sequence (Input node)
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (targetNode?.type === 'input') return false;

      return true;
    },
    [nodes]
  );

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };

  const onEdgeClick = (_: any, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, ...newData } } : null);
    }
  };

  const deleteSelection = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    }
    if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  };

  const onDeploy = async () => {
    setDeploying(true);
    setStatusType('loading');
    setStatus("Building industrial artifact...");
    try {
      const response = await fetch(`${registryUrl}/dev/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "visual-blink",
          version: "1.0.0",
          vdl: vdlPreview
        })
      });
      if (response.ok) {
        await response.json();
        if (targetDevice === "all") {
          setStatusType('success');
          setStatus("Artifact registered in Cloud.");
        } else {
          setStatusType('loading');
          setStatus(`Deploying to ${targetDevice}...`);

          try {
            const deployRes = await fetch(`${registryUrl}/dev/deploy`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                device_id: targetDevice,
                artifact_id: "visual-blink-1.0.0"
              })
            });

            if (deployRes.ok) {
              setStatusType('success');
              setStatus(`Flash Success: ${targetDevice} updated.`);
            } else {
              const error = await deployRes.text();
              setStatusType('error');
              setStatus(`Deploy Failed: ${error}`);
            }
          } catch (_err) {
            setStatusType('error');
            setStatus("Deploy Request Failed");
          }
        }
      } else {
        const error = await response.text();
        setStatusType('error');
        setStatus(`Build Failed: ${error}`);
      }
    } catch (_e) {
      setStatusType('error');
      setStatus("Registry Connection Failed");
    } finally {
      setDeploying(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  const onDownload = async () => {
    setStatusType('loading');
    setStatus("Preparing download...");
    try {
      const response = await fetch(`${registryUrl}/dev/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "visual-blink",
          version: "1.0.0",
          vdl: vdlPreview
        })
      });

      if (response.ok) {
        const artifact = await response.json();
        window.open(artifact.download_url, '_blank');
        setStatusType('success');
        setStatus("Download Started");
      } else {
        setStatusType('error');
        setStatus("Failed to generate .vex");
      }
    } catch (_e) {
      setStatusType('error');
      setStatus("Registry Offline");
    } finally {
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const data = event.dataTransfer.getData('application/reactflow');
      if (!data || !reactFlowInstance) return;
      const nodeData = JSON.parse(data);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode: Node = {
        id: getId(),
        type: 'action',
        position,
        data: {
          label: nodeData.label,
          type: nodeData.capability,
          action: nodeData.action,
          params: { ...nodeData.params }
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onLoadTemplate = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    setStatusType('info');
    setStatus("Template Loaded Successfully");
    setTimeout(() => setStatus(null), 2000);
  }, [setNodes, setEdges]);

  const vdlPreview = useMemo(() => {
    const actionNodes = nodes
      .filter((n) => n.id !== '1' && n.type === 'action')
      .sort((a, b) => a.position.y - b.position.y);

    const steps = actionNodes
      .map((n) => {
        const d = n.data as any;
        return `    - name: "${n.id}_${d.action}"\n      capability: "${d.type}"\n      action: "${d.action}"\n      params:\n${Object.entries(d.params || {}).map(([k, v]) => `        ${k}: ${typeof v === 'string' && !v.startsWith('0x') ? `"${v}"` : v}`).join('\n')}`;
      })
      .join('\n');

    return `vdlVersion: "1.0"\nenvironment:\n  target: "${projectConfig.target}"\n  wifi:\n    ssid: "${projectConfig.wifi.ssid}"\n    password: "${projectConfig.wifi.password}"\n  mqtt:\n    broker: "${projectConfig.mqtt.broker}"\nflows:\n  main_loop:\n    steps:\n${steps}`;
  }, [nodes, projectConfig]);

  const parseVDL = (vdlStr: string): { nodes: Node[], edges: Edge[] } => {
    const newNodes: Node[] = [
      { id: '1', type: 'input', data: { label: 'Boot Sequence' }, position: { x: 250, y: 0 }, className: 'bg-white !text-slate-900 border-none rounded-lg px-6 py-3 font-bold shadow-xl !w-[160px] text-center text-[10px]' }
    ];
    const newEdges: Edge[] = [];

    const stepLines = vdlStr.split('\n');
    let currentStep: any = null;
    let y = 100;
    let prevId = '1';
    let isParsingParams = false;

    stepLines.forEach(line => {
      const trimmed = line.trim();
      const indent = line.search(/\S/);

      if (trimmed.startsWith('- name:')) {
        if (currentStep) {
          const id = `${newNodes.length + 1}`;
          newNodes.push({ id, type: 'action', position: { x: 250, y }, data: currentStep });
          newEdges.push({ id: `e${prevId}-${id}`, source: prevId, target: id, animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } });
          prevId = id;
          y += 100;
        }
        isParsingParams = false;
        currentStep = { label: trimmed.split('"')[1], params: {} };
      } else if (trimmed.startsWith('capability:')) {
        currentStep.type = trimmed.split('"')[1];
      } else if (trimmed.startsWith('action:')) {
        currentStep.action = trimmed.split('"')[1];
      } else if (trimmed.startsWith('params:')) {
        if (trimmed.includes('{')) {
          const pStr = trimmed.split('{')[1].split('}')[0];
          pStr.split(',').forEach(p => {
            const [k, v] = p.split(':').map(s => s.trim().replace(/"/g, ''));
            if (k && v) currentStep.params[k] = v;
          });
        } else {
          isParsingParams = true;
        }
      } else if (isParsingParams && indent >= 8 && trimmed.includes(':')) {
        const [k, v] = trimmed.split(':').map(s => s.trim().replace(/"/g, ''));
        if (k && v) currentStep.params[k] = v;
      }
    });

    if (currentStep) {
      const id = `${newNodes.length + 1}`;
      newNodes.push({ id, type: 'action', position: { x: 250, y }, data: currentStep });
      newEdges.push({ id: `e${prevId}-${id}`, source: prevId, target: id, animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } });
    }

    return { nodes: newNodes, edges: newEdges };
  };

  return (
    <div className="w-full h-full bg-[#0d0f14] text-slate-100 flex flex-col overflow-hidden">
      {/* Navbar */}
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
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="w-1.5 h-1.5 rounded-full border border-slate-500" />
              Industrial Edge OS
            </div>
            <div className="flex items-center gap-1.5 text-emerald-500/80">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
              Registry: Connected
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-white/5 transition rounded-md text-slate-400 hover:text-white"
            title="Project Settings"
          >
            <Settings size={16} />
          </button>

          <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-md px-2 py-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Target:</span>
            <select
              value={targetDevice}
              onChange={(e) => setTargetDevice(e.target.value)}
              className="bg-transparent text-[10px] text-blue-400 outline-none cursor-pointer font-mono"
            >
              <option value="all">FROTA GERAL (Cloud)</option>
              {availableDevices.map((d: any) => (
                <option key={d.id} value={d.id}>{d.id} ({d.status})</option>
              ))}
            </select>
          </div>

          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition rounded-md text-[10px] font-semibold text-slate-300 border border-white/10"
          >
            <Download size={12} /> .VEX
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

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Library */}
        <Library
          onLoadTemplate={(nodes, edges) => onLoadTemplate(nodes, edges)}
          remoteTemplates={remoteTemplates}
          parseVDL={parseVDL}
        />

        {/* Center: Canvas */}
        <main className="flex-1 relative bg-[#0b0e14] border-r border-white/5" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onInit={setReactFlowInstance}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={20} size={1} />

            {nodes.length === 1 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center text-xl">+</div>
                  <span className="text-xs font-medium tracking-widest uppercase">Start by dragging capabilities here</span>
                </div>
              </div>
            )}
          </ReactFlow>
        </main>

        {/* Right: Properties & VDL */}
        <aside className="w-[300px] shrink-0 bg-[#131722]/50 backdrop-blur-3xl flex flex-col min-h-0 border-l border-white/5 transition-all duration-300">

          {/* Properties Panel (Hidden when VDL is Maximized) */}
          <div className={`flex flex-col min-h-0 transition-all duration-300 ${vdlMode === 'max' ? 'h-0 opacity-0 overflow-hidden' : 'flex-1 opacity-100'}`}>
            {selectedNode || selectedEdge ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    {selectedNode ? 'Properties' : 'Connection'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={deleteSelection}
                      className="text-slate-600 hover:text-red-500 transition p-1 rounded-md hover:bg-white/5"
                      title="Delete Selection"
                    >
                      <Trash2 size={12} />
                    </button>
                    <Zap size={10} className="text-blue-500" />
                  </div>
                </div>

                {selectedNode ? (
                  <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto min-h-0">
                    <div>
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Node Name</label>
                      <input
                        type="text"
                        value={(selectedNode.data.label as string) || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Capability</label>
                      <div className="w-full bg-black/20 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] text-slate-500 flex justify-between items-center select-none">
                        {(selectedNode.data.type as string) || 'platform.core'}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Configuration</label>
                      {Object.entries(selectedNode.data.params || {}).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1.5">
                          <span className="text-[10px] text-slate-400 px-1">{key}</span>
                          <input
                            type="text"
                            value={(value as string) || ''}
                            onChange={(e) => {
                              const oldParams = (selectedNode.data.params as Record<string, any>) || {};
                              updateNodeData(selectedNode.id, { params: { ...oldParams, [key]: e.target.value } });
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] text-blue-300 outline-none focus:border-blue-500/50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 p-8 text-center flex flex-col items-center justify-center gap-4 opacity-50">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">Selected Connection</p>
                      <p className="text-[9px] uppercase tracking-widest text-slate-600 mt-1 font-mono">{selectedEdge?.id}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 p-8 text-center flex flex-col items-center justify-center gap-4 opacity-20">
                <ListTree size={32} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Select a node or edge to edit</p>
              </div>
            )}
          </div>

          {/* Live VDL Preview with Window Controls */}
          <div className={`bg-[#0b0e14] border-t border-white/5 flex flex-col transition-all duration-300 ease-in-out
             ${vdlMode === 'max' ? 'flex-1' : vdlMode === 'min' ? 'h-[40px] shrink-0' : 'h-1/3 shrink-0'}`}>

            {/* VDL Header */}
            <div
              className="h-[40px] px-3 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5 cursor-pointer hover:bg-white/10 transition"
              onClick={() => setVdlMode(prev => prev === 'min' ? 'normal' : 'min')} // Click header to toggle min/normal
            >
              <div className="flex items-center gap-2">
                <h2 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${vdlMode === 'min' ? 'bg-slate-500' : 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]'}`} />
                  Live VDL Preview
                </h2>
                {vdlMode === 'min' && <span className="text-[9px] text-slate-600 font-mono hidden group-hover:block ml-2">Click to Expand</span>}
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {/* Minimize Button */}
                <button
                  onClick={() => setVdlMode('min')}
                  className={`p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition ${vdlMode === 'min' ? 'text-blue-400' : ''}`}
                  title="Minimize"
                >
                  <Minus size={12} />
                </button>

                {/* Normal / Restore Button */}
                <button
                  onClick={() => setVdlMode('normal')}
                  className={`p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition ${vdlMode === 'normal' ? 'text-blue-400' : ''}`}
                  title="Normal View"
                >
                  <Minimize2 size={12} />
                </button>

                {/* Maximize Button */}
                <button
                  onClick={() => setVdlMode('max')}
                  className={`p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition ${vdlMode === 'max' ? 'text-blue-400' : ''}`}
                  title="Maximize"
                >
                  <Maximize2 size={12} />
                </button>
              </div>
            </div>

            {/* VDL Content (Scrollable) */}
            <div className={`flex-1 p-4 font-mono text-[10px] overflow-auto text-blue-100/40 leading-relaxed scrollbar-hide
               ${vdlMode === 'min' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <pre>{vdlPreview}</pre>
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`
              absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-2 rounded-full text-[10px] font-bold shadow-2xl border flex items-center gap-2
              ${statusType === 'success' ? 'bg-emerald-600 border-emerald-400/20 text-white' :
                statusType === 'error' ? 'bg-red-600 border-red-400/20 text-white' :
                  statusType === 'loading' ? 'bg-blue-600 border-blue-400/20 text-white' :
                    'bg-slate-800 border-white/10 text-slate-200'}
            `}
          >
            {statusType === 'loading' && <Loader2 size={12} className="animate-spin" />}
            {statusType === 'success' && <CheckCircle2 size={12} />}
            {statusType === 'error' && <AlertCircle size={12} />}
            {statusType === 'info' && <Info size={12} />}
            {status}
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={projectConfig}
        onSave={setProjectConfig}
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
