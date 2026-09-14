import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, LineChart, Line, CartesianGrid, YAxis } from 'recharts'
import { Card } from './ui/Primitives'

export function WeeklyRhythmChart({ data, title, subtitle }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-headline-sm text-on-surface">{title}</h3>
          {subtitle && <p className="text-body-sm text-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barCategoryGap="28%">
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#464555' }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(79,70,229,0.06)' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #e5eeff', fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[6, 6, 6, 6]} fill="#4f46e5" maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function TrendLineChart({ data, dataKey = 'value', xKey = 'label', title, subtitle, color = '#4f46e5', height = 160 }) {
  return (
    <Card className="p-4">
      {title && (
        <div className="mb-3">
          <h3 className="font-display text-headline-sm text-on-surface">{title}</h3>
          {subtitle && <p className="text-body-sm text-on-surface-variant">{subtitle}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eff4ff" vertical={false} />
          <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#464555' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#464555' }} width={30} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5eeff', fontSize: 12 }} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
