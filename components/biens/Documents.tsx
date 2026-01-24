"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DocumentsProps {
  bien: any
}

export function Documents({ bien }: DocumentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Aucun document pour le moment.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          💡 La gestion des documents (contrats, diagnostics, factures) sera disponible prochainement.
        </p>
      </CardContent>
    </Card>
  )
}
