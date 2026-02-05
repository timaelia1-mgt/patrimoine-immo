"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/calculations'

interface CashFlowChartProps {
  loyerMensuel: number
  totalCharges: number
  mensualiteCredit: number
  moisPossession: number
}

export function CashFlowChart({
  loyerMensuel,
  totalCharges,
  mensualiteCredit,
  moisPossession,
}: CashFlowChartProps) {
  // Générer les données mensuelles pour les 12 derniers mois max
  const moisAfficher = Math.min(12, moisPossession)
  
  const data = Array.from({ length: moisAfficher }, (_, i) => {
    const moisIndex = i + 1
    const revenus = loyerMensuel * moisIndex
    const charges = (totalCharges + mensualiteCredit) * moisIndex
    const cashFlow = revenus - charges
    
    return {
      mois: `Mois ${moisIndex}`,
      revenus,
      charges,
      cashFlow,
    }
  })
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded shadow-lg">
          <p className="font-medium mb-2">{payload[0].payload.mois}</p>
          <p className="text-sm text-blue-600">
            Revenus: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-orange-600">
            Charges: {formatCurrency(payload[1].value)}
          </p>
          <p className="text-sm font-bold text-green-600">
            Cash-flow: {formatCurrency(payload[2].value)}
          </p>
        </div>
      )
    }
    return null
  }
  
  if (moisAfficher === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution du cash-flow cumulé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>Aucune donnée disponible</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution du cash-flow cumulé</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="mois" 
              className="text-xs"
              stroke="#64748b"
            />
            <YAxis 
              className="text-xs"
              stroke="#64748b"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenus" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Revenus cumulés"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="charges" 
              stroke="#f97316" 
              strokeWidth={2}
              name="Charges cumulées"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="cashFlow" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Cash-flow net"
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground text-center mt-4">
          📊 Évolution sur les {moisAfficher} derniers mois
        </p>
      </CardContent>
    </Card>
  )
}
