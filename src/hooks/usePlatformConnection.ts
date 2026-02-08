import { useState, useMemo, useCallback, useEffect } from 'react';

type ConnectionState = 'initializing' | 'checking' | 'connected' | 'offline' | 'reconnecting';

export const usePlatformConnection = (projectConfig: any, setStatus: (s: string | null) => void, setStatusType: (t: 'info' | 'success' | 'error' | 'loading' | any) => void) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('initializing');
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [remoteTemplates, setRemoteTemplates] = useState<any[]>([]);

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
                const tmplRes = await fetch(`${registryUrl}/dev/templates`);
                if (tmplRes.ok) {
                    const tmplData = await tmplRes.json();
                    setRemoteTemplates(Array.isArray(tmplData) ? tmplData : []);
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
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'device_registered') {
                        const device = msg.payload;
                        setStatusType('info');
                        setStatus(`New Device: ${device.id}`);
                        setTimeout(() => setStatus(null), 4000);
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
        registryUrl,
        checkHealth
    };
};
