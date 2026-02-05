"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/calculations'

interface ChargesBreakdownProps {
  taxeFonciere: number
  chargesCopro: number
  assurance: number
  fraisGestion: number
  autresCharges: number
  mensualiteCredit: number
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']

export function ChargesBreakdown({
  taxeFonciere,
  chargesCopro,
  assurance,
  fraisGestion,
  autresCharges,
  mensualiteCredit,
}: ChargesBreakdownProps) {
  const data = [
    { name: 'Mensualité crédit', value: mensualiteCredit, color: COLORS[0] },
    { name: 'Taxe foncière', value: taxeFonciere / 12, color: COLORS[1] },
    { name: 'Charges copro', value: chargesCopro, color: COLORS[2] },
    { name: 'Assurance', value: assurance, color: COLORS[3] },
    { name: 'Frais gestion', value: fraisGestion, color: COLORS[4] },
    { name: 'Autres', value: autresCharges, color: COLORS[5] },
  ].filter(item => item.value > 0)
  
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      const percentage = ((item.value / total) * 100).toFixed(1)
      
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded shadow-lg">
          <p className="font-medium mb-1">{item.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {formatCurrency(item.value)} ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }
  
  const renderCustomLabel = (entry: any) => {
    const percentage = ((entry.value / total) * 100).toFixed(0)
    return parseInt(percentage) > 5 ? `${percentage}%` : ''
  }
  
  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Répartition des charges mensuelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>Aucune charge renseignée</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition des charges mensuelles</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value, entry: any) => (
                <span className="text-sm">
                  {value}: {formatCurrency(entry.payload.value)}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground text-center mt-4">
          💰 Total mensuel: {formatCurrency(total)}
        </p>
      </CardContent>
    </Card>
  )
}
