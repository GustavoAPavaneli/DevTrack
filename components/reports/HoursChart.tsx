'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

interface DayData {
  day: string
  hours: number
}

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function HoursChart({ data }: { data: DayData[] }) {
  const chartData = data.map((d, i) => ({ day: DAY_LABELS[i] ?? d.day, hours: d.hours }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#555', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: '8px',
            color: '#f0f0f0',
          }}
          cursor={{ fill: '#1f1f1f' }}
          formatter={(value) => [`${value}h`, 'Horas']}
        />
        <Bar dataKey="hours" fill="#F4511E" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
