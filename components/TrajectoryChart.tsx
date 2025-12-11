import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend
} from 'recharts';
import { Point } from '../types';

interface TrajectoryChartProps {
  t0: Point | null;
  t30: Point | null;
  t60: Point | null;
  t90: Point | null; // Predicted
}

const TrajectoryChart: React.FC<TrajectoryChartProps> = ({ t0, t30, t60, t90 }) => {
  const data = [
    { name: 'T0', x: t0?.x, y: t0?.y, type: 'Observed' },
    { name: 'T30', x: t30?.x, y: t30?.y, type: 'Observed' },
    { name: 'T60', x: t60?.x, y: t60?.y, type: 'Observed' },
    { name: 'T90 (Pred)', x: t90?.x, y: t90?.y, type: 'Predicted' },
  ].filter(d => d.x !== undefined && d.y !== undefined);

  // Invert Y axis for image coordinate system (0,0 is top left)
  // But typically charts have 0,0 bottom left. 
  // Let's keep it consistent with image coordinates but flip the domain in YAxis if needed.
  // Actually, standard charts are fine, we just label axes.

  return (
    <div className="w-full h-64 bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="text-slate-200 font-semibold mb-2">Trajectory Map (Cloud Centroid)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="x" 
            type="number" 
            domain={['auto', 'auto']} 
            stroke="#94a3b8" 
            label={{ value: 'X Coordinate (px)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
          />
          <YAxis 
            dataKey="y" 
            type="number" 
            domain={['auto', 'auto']} 
            reversed={true} 
            stroke="#94a3b8" 
            label={{ value: 'Y Coordinate (px)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
            cursor={{ stroke: '#cbd5e1' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="y" 
            data={data.filter(d => d.type === 'Observed')} 
            stroke="#38bdf8" 
            strokeWidth={2} 
            name="Observed Path"
            dot={{ r: 4, fill: '#38bdf8' }}
          />
          {t90 && t60 && (
             <Line 
               type="monotone" 
               dataKey="y" 
               data={[
                   { x: t60.x, y: t60.y },
                   { x: t90.x, y: t90.y }
               ]} 
               stroke="#f472b6" 
               strokeWidth={2} 
               strokeDasharray="5 5"
               name="Predicted Path"
               dot={{ r: 4, fill: '#f472b6' }}
             />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrajectoryChart;
