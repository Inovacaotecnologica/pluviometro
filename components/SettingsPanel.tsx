import React, { useState } from 'react';
import type { P0Settings } from '../types';
import Icon from './Icon';

interface SettingsPanelProps {
  kFactor: number;
  setKFactor: React.Dispatch<React.SetStateAction<number>>;
  p0Settings: P0Settings;
  setP0Settings: React.Dispatch<React.SetStateAction<P0Settings>>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ kFactor, setKFactor, p0Settings, setP0Settings }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleP0Change = (channel: number, value: string) => {
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue)) {
        setP0Settings(prev => ({ ...prev, [channel]: parsedValue }));
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-transform transform hover:scale-110"
        aria-label="Abrir configurações"
      >
        <Icon name="settings" className="w-6 h-6" />
      </button>
      {isOpen && (
        <div className="absolute top-14 right-0 w-72 bg-gray-800 rounded-lg shadow-2xl p-4 border border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-white">Configurações</h3>
          
          <div className="mb-4">
            <label htmlFor="k-factor" className="block text-sm font-medium text-gray-300 mb-1">
              Fator K (mm/pulso)
            </label>
            <input
              type="number"
              id="k-factor"
              step="0.01"
              value={kFactor}
              onChange={(e) => setKFactor(parseFloat(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <p className="block text-sm font-medium text-gray-300">Offsets P0 (pulsos)</p>
            {[1, 2, 3].map(channel => (
                 <div key={channel} className="flex items-center space-x-2">
                    <label htmlFor={`p0-offset-${channel}`} className="w-16 text-sm text-gray-400">
                        Canal {channel}
                    </label>
                    <input
                        type="number"
                        id={`p0-offset-${channel}`}
                        step="1"
                        value={p0Settings[channel] ?? 0}
                        onChange={(e) => handleP0Change(channel, e.target.value)}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                 </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
