import { useMemo, useState, useEffect } from 'react';
import { type Node } from '@xyflow/react';

export const useEditorLogic = (
    nodes: Node[],
    projectConfig: any,
    registryUrl: string,
    connectionState: string,
    monaco: any,
    editorRef: any,
    setStatus: (s: string | null) => void,
    setStatusType: (t: any) => void
) => {
    const [deploying, setDeploying] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [simulationLogs, setSimulationLogs] = useState<any[]>([]);
    const [validationErrors, setValidationErrors] = useState<any[]>([]);

    const vdlPreview = useMemo(() => {
        const actionNodes = (nodes || [])
            .filter((n) => n && n.id !== '1' && n.type === 'action')
            .sort((a, b) => (a?.position?.y || 0) - (b?.position?.y || 0));

        const steps = actionNodes
            .map((n) => {
                const d = n.data as any;
                return `    - name: "${n.id}_${d.action}"\n      capability: "${d.type}"\n      action: "${d.action}"\n      params:\n${Object.entries(d.params || {}).map(([k, v]) => `        ${k}: ${typeof v === 'string' && !v.startsWith('0x') ? `"${v}"` : v}`).join('\n')}`;
            })
            .join('\n');

        return `vdlVersion: "1.0"\nenvironment:\n  target: "${projectConfig.target}"\n  wifi:\n    ssid: "${projectConfig.wifi.ssid}"\n    password: "${projectConfig.wifi.password}"\n  mqtt:\n    broker: "${projectConfig.mqtt.broker}"\nflows:\n  main_loop:\n    steps:\n${steps}`;
    }, [nodes, projectConfig]);

    useEffect(() => {
        if (!vdlPreview || connectionState !== 'connected') return;

        const validate = async () => {
            try {
                const res = await fetch(`${registryUrl}/dev/validate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vdl: vdlPreview })
                });
                if (res.ok) {
                    const data = await res.json();
                    setValidationErrors(data.errors || []);

                    if (monaco && editorRef.current) {
                        const model = editorRef.current.getModel();
                        if (model) {
                            const markers = (data.errors || []).map((err: any) => ({
                                startLineNumber: err.line || 1,
                                startColumn: 1,
                                endLineNumber: err.line || 1,
                                endColumn: 1000,
                                message: err.message,
                                severity: err.level === 'error' ? 8 : 4,
                            }));
                            monaco.editor.setModelMarkers(model, 'owner', markers);
                        }
                    }
                }
            } catch (e) {
                console.error("Validation failed", e);
            }
        };

        const timer = setTimeout(validate, 800);
        return () => clearTimeout(timer);
    }, [vdlPreview, connectionState, registryUrl, monaco, editorRef]);

    const onDeploy = async (targetDevice: string) => {
        setDeploying(true);
        setStatusType('loading');
        setStatus("Building industrial artifact...");
        try {
            const response = await fetch(`${registryUrl}/dev/build`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "visual-blink", version: "1.0.0", vdl: vdlPreview })
            });
            if (response.ok) {
                if (targetDevice === "all") {
                    setStatusType('success');
                    setStatus("Artifact registered in Cloud.");
                } else {
                    setStatusType('loading');
                    setStatus(`Deploying to ${targetDevice}...`);
                    const deployRes = await fetch(`${registryUrl}/dev/deploy`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ device_id: targetDevice, artifact_id: "visual-blink-1.0.0" })
                    });
                    if (deployRes.ok) {
                        setStatusType('success');
                        setStatus(`Flash Success: ${targetDevice} updated.`);
                    } else {
                        const error = await deployRes.text();
                        setStatusType('error');
                        setStatus(`Deploy Failed: ${error}`);
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

    const onSimulate = async () => {
        setSimulating(true);
        setSimulationLogs([]);
        setStatusType('loading');
        setStatus("Starting Simulation...");
        try {
            const response = await fetch(`${registryUrl}/dev/simulate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vdl: vdlPreview, payload: { "simulated": true } })
            });
            if (response.ok) {
                const data = await response.json();
                setSimulationLogs(data.logs || []);
                setStatusType('success');
                setStatus("Simulation Finished");
            } else {
                const err = await response.text();
                setSimulationLogs([{ timestamp: new Date().toLocaleTimeString(), level: 'error', message: `Failed: ${err}` }]);
                setStatusType('error');
                setStatus("Simulation Failed");
            }
        } catch (e: any) {
            setSimulationLogs([{ timestamp: new Date().toLocaleTimeString(), level: 'error', message: `Connection Error: ${e.message}` }]);
            setStatusType('error');
            setStatus("Simulation Error");
        } finally {
            setSimulating(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const onDownload = async (e: any) => {
        e.preventDefault();
        setStatusType('loading');
        setStatus("Preparing download...");
        try {
            const response = await fetch(`${registryUrl}/dev/build`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "visual-blink", version: "1.0.0", vdl: vdlPreview })
            });
            if (response.ok) {
                const artifact = await response.json();
                const link = document.createElement('a');
                link.href = artifact.download_url;
                link.setAttribute('download', `${artifact.name || 'artifact'}.vex`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
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

    return {
        vdlPreview,
        deploying,
        simulating,
        simulationLogs,
        validationErrors,
        onDeploy,
        onSimulate,
        onDownload,
        setSimulationLogs
    };
};
