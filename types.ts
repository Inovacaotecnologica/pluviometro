export interface Reading {
  readingType: string;
  channel: number;
  readingData: string;
  engineeringValue?: number;
  engineeringUnit?: string;
}

export interface CommMetaData {
  rssi: number;
  snr: number;
  receivedTimestamp?: string;
  sequenceCounter?: number | number[];
  sf?: number;
  frequencyHertz?: number;
}

export interface RawMessage {
  type: string;
  nodeId: number;
  readTimestamp?: string;
  readings: Reading[];
  commMetaData?: CommMetaData;
  temperatureDegrees?: number;
  inputPowerVolts?: number;
  uptimeSeconds?: number;
  firmwareVersion?: string;
}

export interface ChartDataPoint {
  timestamp: string;
  interval_mm: number;
  intensity_mmh: number;
  daily_acc_mm: number;
  intensity_ma_mmh?: number;
}

export interface KpiData {
  rainToday: number;
  maxIntensityToday: number;
  lastReadingTimestamp: string | null;
  voltage: number | null;
  rssi: number | null;
  snr: number | null;
  temperature: number | null;
}

export interface ProcessedData {
  chartData: ChartDataPoint[];
  kpis: KpiData;
  hasPulseData: boolean;
  lastPulseTimestamp: string | null;
}

export interface P0Settings {
  [channel: number]: number;
}

export type ConnectionStatus = 'CONNECTING' | 'WS_CONNECTED' | 'POLLING' | 'DISCONNECTED';