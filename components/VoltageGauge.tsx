
import React from 'react';

interface VoltageGaugeProps {
  voltage: number | null;
}

const VoltageGauge: React.FC<VoltageGaugeProps> = ({ voltage }) => {
  const minVoltage = 3.0;
  const maxVoltage = 4.2;
  const value = voltage !== null ? Math.max(minVoltage, Math.min(maxVoltage, voltage)) : minVoltage;
  const percentage = (value - minVoltage) / (maxVoltage - minVoltage);
  const angle = -90 + percentage * 180;

  const getPathColor = (p: number) => {
    if (p < 0.2) return 'stroke-red-500';
    if (p < 0.5) return 'stroke-yellow-500';
    return 'stroke-green-500';
  };
  
  const pathColor = getPathColor(percentage);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center justify-center h-full">
      <h3 className="text-lg font-semibold text-gray-300 mb-2">Tensão da Bateria</h3>
      <div className="relative w-48 h-24">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" strokeWidth="10" className="stroke-gray-700" />
          <path
            d="M10 50 A 40 40 0 0 1 90 50"
            fill="none"
            strokeWidth="10"
            className={pathColor}
            strokeDasharray="125.6"
            strokeDashoffset={125.6 * (1 - percentage)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute bottom-0 w-full text-center">
          <span className="text-3xl font-bold text-white">{voltage?.toFixed(2) ?? 'N/A'}</span>
          <span className="text-lg text-gray-400"> V</span>
        </div>
      </div>
      <div className="flex justify-between w-full px-4 mt-1 text-xs text-gray-500">
        <span>{minVoltage}V</span>
        <span>{maxVoltage}V</span>
      </div>
    </div>
  );
};

export default VoltageGauge;
