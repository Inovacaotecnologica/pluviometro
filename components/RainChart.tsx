import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { ChartDataPoint } from '../types';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface RainChartProps {
  data: ChartDataPoint[];
}

interface CustomTooltipContentProps {
  active?: boolean;
  payload?: {
    name: string;
    value: ValueType;
    unit?: string;
    color?: string;
  }[];
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipContentProps) => {
    if (active && payload && payload.length) {
        const date = new Date(label as string | number);
        const formattedLabel = date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        return (
            <div className="bg-gray-800 bg-opacity-90 p-4 border border-gray-600 rounded-lg shadow-lg">
                <p className="label text-gray-300">{`${formattedLabel}`}</p>
                {payload.map((pld, index) => (
                    <p key={index} style={{ color: pld.color }} className="intro">
                        {`${pld.name}: ${pld.value}${pld.unit}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const RainChart: React.FC<RainChartProps> = ({ data }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-full">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">Histórico de Chuva</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(tick) => new Date(tick).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            stroke="#9ca3af"
            angle={-35}
            textAnchor="end"
            height={50}
            interval="preserveStartEnd"
          />
          <YAxis yAxisId="left" orientation="left" stroke="#81e6d9" unit=" mm" />
          <YAxis yAxisId="right" orientation="right" stroke="#f6ad55" unit=" mm/h" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '30px' }}/>
          <Bar yAxisId="left" dataKey="interval_mm" name="Chuva (Intervalo)" fill="#4299e1" unit=" mm" barSize={20} />
          <Line yAxisId="left" type="monotone" dataKey="daily_acc_mm" name="Acumulado Diário" stroke="#81e6d9" strokeWidth={2} unit=" mm" dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="intensity_mmh" name="Intensidade" stroke="#f6ad55" strokeWidth={2} unit=" mm/h" dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="intensity_ma_mmh" name="Intensidade (Média Móvel)" stroke="#ff7300" strokeDasharray="5 5" unit=" mm/h" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RainChart;