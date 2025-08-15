import React from 'react';
import Icon, { type IconName } from './Icon';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: IconName;
  colorClass: string;
  smallText?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, unit, icon, colorClass, smallText = false }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-4 h-full">
      <div className={`p-3 rounded-full ${colorClass} self-start`}>
        <Icon name={icon} className="w-6 h-6 text-white" />
      </div>
      <div className="overflow-hidden">
        <p className="text-sm text-gray-400 truncate">{title}</p>
        <p className={`${smallText ? 'text-lg' : 'text-2xl'} font-bold text-white truncate`}>
          {value} <span className="text-base font-normal text-gray-300">{unit}</span>
        </p>
      </div>
    </div>
  );
};

export default KpiCard;