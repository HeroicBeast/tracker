import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';

export interface TrendPoint {
  index: number;
  percentage: number;
}

export default function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="index" tick={{ fontSize: 10, fill: '#5b6789' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#5b6789' }} axisLine={false} tickLine={false} />
        <ReferenceLine y={80} stroke="#fbbf24" strokeDasharray="4 4" />
        <Tooltip
          contentStyle={{ background: '#12172a', border: '1px solid #232b45', borderRadius: 8, fontSize: 12 }}
          labelFormatter={(i) => `Class #${i}`}
          formatter={(v) => [`${v ?? 0}%`, 'Attendance']}
        />
        <Line type="monotone" dataKey="percentage" stroke="#7c86f5" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
