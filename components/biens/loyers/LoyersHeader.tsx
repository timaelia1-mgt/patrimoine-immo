"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/calculations"

interface LoyersHeaderProps {
  caTotal: number
  caPrevuTotal: number
  caLocataire: number
  loyerNetLocataire: number
  moisLocatairePayes: number
  caAPL: number
  montantAPL: number
  moisAPLPayes: number
  loyerMensuel: number
}

export function LoyersHeader({
  caTotal,
  caPrevuTotal,
  caLocataire,
  loyerNetLocataire,
  moisLocatairePayes,
  caAPL,
  montantAPL,
  moisAPLPayes,
  loyerMensuel,
}: LoyersHeaderProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">CA total annuel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(caTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            sur {formatCurrency(caPrevuTotal)} prévus
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">CA Locataire</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(caLocataire)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {moisLocatairePayes} mois × {formatCurrency(loyerNetLocataire)}
          </p>
        </CardContent>
      </Card>
      
      {montantAPL > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">CA APL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(caAPL)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {moisAPLPayes} mois × {formatCurrency(montantAPL)}
            </p>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Loyer mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(loyerMensuel)}
          </p>
          {montantAPL > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(loyerNetLocataire)} + {formatCurrency(montantAPL)} APL
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
