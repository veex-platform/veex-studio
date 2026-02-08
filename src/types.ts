export interface Device {
    id: string;
    name: string;
    status: 'online' | 'offline';
    ip?: string;
    version?: string;
    lastSeen?: string;
    uptime?: string;
}

export interface TelemetryMessage {
    id: string;
    deviceId: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
}

export interface WebSocketMessage {
    type: 'status_update' | 'telemetry_data' | 'execution_event';
    payload: any;
}
