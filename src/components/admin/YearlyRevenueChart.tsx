
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

interface YearlyRevenueChartProps {
  data: { month: string; total: number }[];
}

export function YearlyRevenueChart({ data }: YearlyRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value.toLocaleString('es-AR')}`}
        />
        <Tooltip 
            cursor={{ fill: 'hsl(var(--muted))' }}
            formatter={(value: number) => [value.toLocaleString('es-AR', {style: 'currency', currency: 'ARS'}), "Ingresos"]}
        />
        <Legend 
            verticalAlign="top" 
            align="right" 
            wrapperStyle={{paddingBottom: '20px'}}
        />
        <Bar dataKey="total" name="Ingresos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
