
import React, { useState, useEffect } from 'react';
import type { ProcessedData, P0Settings, ConnectionStatus } from '../types';
import KpiCard from './KpiCard';
import RainChart from './RainChart';
import VoltageGauge from './VoltageGauge';
import SettingsPanel from './SettingsPanel';
import Icon from './Icon';

interface DashboardProps {
  data: ProcessedData | null;
  isLoading: boolean;
  error: string | null;
  topic: string;
  kFactor: number;
  setKFactor: React.Dispatch<React.SetStateAction<number>>;
  p0Settings: P0Settings;
  setP0Settings: React.Dispatch<React.SetStateAction<P0Settings>>;
  connectionStatus: ConnectionStatus;
}

const StatusBadge: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
    const statusMap = {
        CONNECTING: { text: 'Conectando...', color: 'bg-yellow-600' },
        WS_CONNECTED: { text: 'Conectado (WS)', color: 'bg-green-600' },
        POLLING: { text: 'Conectado (Polling)', color: 'bg-blue-600' },
        DISCONNECTED: { text: 'Desconectado', color: 'bg-red-600' },
    };
    const currentStatus = statusMap[status];

    return (
        <div className="flex items-center space-x-2">
            <span className={`text-xs font-semibold text-white px-2 py-1 rounded-full ${currentStatus.color}`}>
                {currentStatus.text}
            </span>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ 
    data, isLoading, error, topic,
    kFactor, setKFactor, p0Settings, setP0Settings,
    connectionStatus
}) => {
  const kpis = data?.kpis;
  const lastReadingDate = kpis?.lastReadingTimestamp ? new Date(kpis.lastReadingTimestamp).toLocaleString('pt-BR') : 'N/A';
  const hasChartData = data && data.chartData.length > 0;

  const firstDataPointTs = data?.chartData?.[0]?.timestamp ? new Date(data.chartData[0].timestamp).getTime() : 0;
  const lastPulseTs = data?.lastPulseTimestamp ? new Date(data.lastPulseTimestamp).getTime() : 0;
  
  // 1 hour and 10 minutes = 70 minutes in milliseconds
  const pulseWarningThresholdMs = 70 * 60 * 1000;
  const now = new Date().getTime();
  
  let shouldShowNoPulseWarning = false;
  
  if (data?.hasPulseData) {
      // If we have received pulses before, show warning if the last one is too old
      if (lastPulseTs > 0 && (now - lastPulseTs) > pulseWarningThresholdMs) {
          shouldShowNoPulseWarning = true;
      }
  } else if (firstDataPointTs > 0) {
      // If we've never received pulses, show warning only if the data stream itself is old enough
      if ((now - firstDataPointTs) > pulseWarningThresholdMs) {
          shouldShowNoPulseWarning = true;
      }
  }

  const handleDownloadCSV = () => {
    if (!data || !hasChartData) return;
    const header = 'timestamp,chuva_intervalo_mm,intensidade_mmh,intensidade_media_movel_mmh,acumulado_diario_mm\n';
    const rows = data.chartData.map(d => `${d.timestamp},${d.interval_mm},${d.intensity_mmh},${d.intensity_ma_mmh ?? 0},${d.daily_acc_mm}`).join('\n');
    const csvContent = "\uFEFF" + header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `dados_chuva_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
      <SettingsPanel kFactor={kFactor} setKFactor={setKFactor} p0Settings={p0Settings} setP0Settings={setP0Settings} />
      
      <header className="mb-6 flex justify-between items-start flex-wrap gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">Pluviômetro</h1>
            <p className="text-gray-400 mt-1">
              Tópico: <span className="font-mono bg-gray-700 px-2 py-1 rounded">{topic}</span>
            </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          <StatusBadge status={connectionStatus} />
          <button onClick={handleDownloadCSV} disabled={!hasChartData} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors" aria-label="Baixar dados em CSV">
            <Icon name="download" className="w-5 h-5" />
            <span>Baixar CSV</span>
          </button>
        </div>
      </header>
      
      {error && <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-6 rounded-r-lg" role="alert"><p className="font-bold">Erro de Conexão</p><p>{error}</p></div>}
      
      <main>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-6">
          <KpiCard title="Chuva Hoje" value={kpis?.rainToday ?? 0} unit="mm" icon="rain" colorClass="bg-blue-500" />
          <KpiCard title="Máx. Intensidade" value={kpis?.maxIntensityToday ?? 0} unit="mm/h" icon="intensity" colorClass="bg-yellow-500" />
          <KpiCard title="Tensão" value={kpis?.voltage?.toFixed(2) ?? 'N/A'} unit="V" icon="bolt" colorClass="bg-green-500" />
          <KpiCard title="Temperatura" value={kpis?.temperature ?? 'N/A'} unit="°C" icon="temperature" colorClass="bg-red-500" />
          <KpiCard title="RSSI" value={kpis?.rssi ?? 'N/A'} unit="dBm" icon="wifi" colorClass="bg-indigo-500" />
          <KpiCard title="SNR" value={kpis?.snr ?? 'N/A'} unit="dB" icon="signal" colorClass="bg-purple-500" />
          <KpiCard title="Última Leitura" value={lastReadingDate.split(' ')[1]} unit={lastReadingDate.split(' ')[0]} icon="clock" colorClass="bg-gray-600" />
        </div>

        {shouldShowNoPulseWarning && (
          <div className="bg-yellow-900 border-l-4 border-yellow-500 text-yellow-100 p-4 mb-6 rounded-r-lg" role="alert">
            <p className="font-bold">Aviso</p>
            <p>Sem dados de pulsos recebidos há mais de 1h e 10min. Verifique o sensor.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[32rem]">
            <RainChart data={data?.chartData ?? []} />
          </div>
          <div className="h-[32rem]">
             <VoltageGauge voltage={kpis?.voltage ?? null} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;