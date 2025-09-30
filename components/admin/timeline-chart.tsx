
'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface TimelineData {
  date: string
  formattedDate: string
  registrations?: number
  completedBookings?: number
  talents?: number
  organizers?: number
  completed?: number
  created?: number
}

interface TimelineChartProps {
  data: TimelineData[]
  type: 'registrations' | 'bookings'
  height?: number
}

export default function TimelineChart({ data, type, height = 300 }: TimelineChartProps) {
  const formatTooltipValue = (value: number, name: string) => {
    return [value, name]
  }

  if (type === 'registrations') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <XAxis 
            dataKey="formattedDate"
            tickLine={false}
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
            label={{ 
              value: 'Date', 
              position: 'insideBottom', 
              offset: -15, 
              style: { textAnchor: 'middle', fontSize: 11 } 
            }}
          />
          <YAxis 
            tickLine={false}
            tick={{ fontSize: 10 }}
            label={{ 
              value: 'Registrations', 
              angle: -90, 
              position: 'insideLeft', 
              style: { textAnchor: 'middle', fontSize: 11 } 
            }}
          />
          <Tooltip 
            formatter={formatTooltipValue}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Legend 
            verticalAlign="top"
            wrapperStyle={{ fontSize: 11 }}
          />
          <Line 
            type="monotone" 
            dataKey="talents" 
            stroke="#60B5FF" 
            strokeWidth={2}
            dot={{ fill: '#60B5FF', strokeWidth: 2, r: 3 }}
            name="Talents"
          />
          <Line 
            type="monotone" 
            dataKey="organizers" 
            stroke="#FF9149" 
            strokeWidth={2}
            dot={{ fill: '#FF9149', strokeWidth: 2, r: 3 }}
            name="Organizers"
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <XAxis 
          dataKey="formattedDate"
          tickLine={false}
          tick={{ fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          height={60}
          label={{ 
            value: 'Date', 
            position: 'insideBottom', 
            offset: -15, 
            style: { textAnchor: 'middle', fontSize: 11 } 
          }}
        />
        <YAxis 
          tickLine={false}
          tick={{ fontSize: 10 }}
          label={{ 
            value: 'Bookings', 
            angle: -90, 
            position: 'insideLeft', 
            style: { textAnchor: 'middle', fontSize: 11 } 
          }}
        />
        <Tooltip 
          formatter={formatTooltipValue}
          wrapperStyle={{ fontSize: 11 }}
        />
        <Legend 
          verticalAlign="top"
          wrapperStyle={{ fontSize: 11 }}
        />
        <Line 
          type="monotone" 
          dataKey="created" 
          stroke="#FF9898" 
          strokeWidth={2}
          dot={{ fill: '#FF9898', strokeWidth: 2, r: 3 }}
          name="Created"
        />
        <Line 
          type="monotone" 
          dataKey="completed" 
          stroke="#72BF78" 
          strokeWidth={2}
          dot={{ fill: '#72BF78', strokeWidth: 2, r: 3 }}
          name="Completed"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
