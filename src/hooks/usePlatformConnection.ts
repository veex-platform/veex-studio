import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Device, TelemetryMessage, WebSocketMessage } from '../types';

type ConnectionState = 'initializing' | 'checking' | 'connected' | 'offline' | 'reconnecting';

export const usePlatformConnection = (
    projectConfig: any,
    setStatus: (s: string | null) => void,
    setStatusType: (t: 'info' | 'success' | 'error' | 'loading' | any) => void,
    onExecution?: (nodeId: string) => void
) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('initializing');
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [remoteTemplates, setRemoteTemplates] = useState<any[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [telemetry, setTelemetry] = useState<TelemetryMessage[]>([]);

    const registryUrl = useMemo(() => {
        const configUrl = projectConfig.registry?.url;
        if (configUrl) {
            if (configUrl.startsWith('http')) return configUrl;
            if (configUrl.startsWith('/')) return `${window.location.origin}${configUrl}`;
            return configUrl;
        }
        return 'https://registry.veexplatform.com/api/v1';
    }, [projectConfig.registry?.url]);

    const checkHealth = useCallback(async () => {
        setConnectionState('checking');
        setConnectionError(null);
        try {
            const res = await fetch(`${registryUrl}/admin/health`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (data.status === 'healthy' || data.database === 'connected') {
                setConnectionState('connected');
            } else {
                throw new Error('Backend unhealthy');
            }
        } catch (err: any) {
            console.error("Health Check Failed:", err);
            setConnectionState('offline');
            setConnectionError(err.message || 'Connection refused');
        }
    }, [registryUrl]);

    useEffect(() => {
        checkHealth();
    }, [checkHealth]);

    useEffect(() => {
        if (connectionState !== 'connected') return;

        const fetchData = async () => {
            try {
                // Fetch Templates
                const tmplRes = await fetch(`${registryUrl}/dev/templates`);
                if (tmplRes.ok) {
                    const tmplData = await tmplRes.json();
                    setRemoteTemplates(Array.isArray(tmplData) ? tmplData : []);
                }

                // Fetch Initial Devices
                const devRes = await fetch(`${registryUrl}/admin/devices`);
                if (devRes.ok) {
                    const devData = await devRes.json();
                    setDevices(Array.isArray(devData) ? devData : []);
                }
            } catch (err) {
                console.warn("Data fetch failed despite healthy connection:", err);
            }
        };

        fetchData();
    }, [connectionState, registryUrl]);

    useEffect(() => {
        if (connectionState !== 'connected') return;

        const wsUrl = registryUrl.replace(/^http/, 'ws') + '/ws';
        let socket: WebSocket | null = null;
        let reconnectTimer: any = null;

        const connect = () => {
            socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                setStatusType('success');
                setStatus("Real-time Link Established");
                setTimeout(() => setStatus(null), 3000);
            };

            socket.onmessage = (event) => {
                try {
                    const msg: WebSocketMessage = JSON.parse(event.data);

                    switch (msg.type) {
                        case 'status_update':
                            setDevices(prev => {
                                const existing = prev.find(d => d.id === msg.payload.id);
                                if (existing) {
                                    return prev.map(d => d.id === msg.payload.id ? { ...d, ...msg.payload } : d);
                                }
                                return [...prev, msg.payload];
                            });
                            break;

                        case 'telemetry_data':
                            setTelemetry(prev => [msg.payload, ...prev].slice(0, 100));
                            break;

                        case 'execution_event':
                            if (onExecution && msg.payload.nodeId) {
                                onExecution(msg.payload.nodeId);
                            }
                            break;

                        default:
                            if ((msg as any).type === 'device_registered') {
                                const device = msg.payload;
                                setStatusType('info');
                                setStatus(`New Device: ${device.id}`);
                                setTimeout(() => setStatus(null), 4000);
                                setDevices(prev => [...prev.filter(d => d.id !== device.id), device]);
                            }
                    }
                } catch (e) {
                    console.error("WS Parse Error", e);
                }
            };

            socket.onclose = () => {
                if (connectionState === 'connected') {
                    reconnectTimer = setTimeout(connect, 3000);
                }
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
    }, [connectionState, registryUrl, setStatus, setStatusType]);

    return {
        connectionState,
        connectionError,
        remoteTemplates,
        devices,
        telemetry,
        registryUrl,
        checkHealth
    };
};
