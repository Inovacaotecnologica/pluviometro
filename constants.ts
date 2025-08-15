export const VALID_COUNTER_TYPES = new Set(['pulsecounter', 'pulsecount', 'counter', 'pulses']);
export const DEFAULT_RAIN_CHANNEL = 2;
export const VOLTAGE_CHANNEL = 0;
export const DEFAULT_K_FACTOR = 0.1;
export const DEFAULT_P0_SETTINGS = { 1: 0, 2: 0, 3: 0 };
export const TIMEZONE = 'America/Sao_Paulo';

// Configuration for Real API
export const API_BASE_URL = 'http://localhost:1880'; // Use VITE_API_BASE in a Vite project
export const WEBSOCKET_URL = 'ws://localhost:1880/ws/raw';
export const DEFAULT_TOPIC = 'gatewayItabira27262';

// Real-time settings
export const POLLING_INTERVAL_MS = 3000;