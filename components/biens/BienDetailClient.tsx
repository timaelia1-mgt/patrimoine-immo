"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, calculerStatutBien, calculateChargesMensuelles } from "@/lib/calculations"
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { deleteBien, type Bien } from "@/lib/database"
import { refreshSidebar } from "@/components/layout/Sidebar"
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics"

// Composant de chargement réutilisable
const TabLoading = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
  </div>
)

// Lazy-load de TOUS les onglets pour réduire le bundle initial
const VueEnsemble = dynamic(
  () => import("@/components/biens/VueEnsemble").then(mod => ({ default: mod.VueEnsemble })),
  { loading: () => <TabLoading /> }
)

const LoyersParLot = dynamic(
  () => import("@/components/biens/LoyersParLot").then(mod => ({ default: mod.LoyersParLot })),
  { loading: () => <TabLoading /> }
)

const Charges = dynamic(
  () => import("@/components/biens/Charges").then(mod => ({ default: mod.Charges })),
  { loading: () => <TabLoading /> }
)

const Financement = dynamic(
  () => import("@/components/biens/Financement").then(mod => ({ default: mod.Financement })),
  { loading: () => <TabLoading /> }
)

const Documents = dynamic(
  () => import("@/components/biens/Documents").then(mod => ({ default: mod.Documents })),
  { loading: () => <TabLoading /> }
)

const Investissement = dynamic(
  () => import("@/components/biens/Investissement").then(mod => ({ default: mod.Investissement })),
  { loading: () => <TabLoading /> }
)

const LocatairesList = dynamic(
  () => import("@/components/biens/LocatairesList").then(mod => ({ default: mod.LocatairesList })),
  { loading: () => <TabLoading /> }
)

const HistoriqueQuittances = dynamic(
  () => import("@/components/biens/HistoriqueQuittances").then(mod => ({ default: mod.HistoriqueQuittances })),
  { loading: () => <TabLoading /> }
)

interface BienDetailClientProps {
  bien: Bien
}

export function BienDetailClient({ bien: initialBien }: BienDetailClientProps) {
  const router = useRouter()
  const [bien] = useState(initialBien)

  const handleDelete = async () => {
    const shouldDelete = window.confirm("⚠️ Êtes-vous sûr de vouloir supprimer ce bien ? Cette action est irréversible.")
    if (!shouldDelete) return

    try {
      await deleteBien(bien.id)

      // Track bien deleted
      trackEvent(ANALYTICS_EVENTS.BIEN_DELETED, {
        bienId: bien.id,
      })

      toast.success("Bien supprimé avec succès")
      refreshSidebar()
      router.push("/dashboard")
    } catch (error: unknown) {
      logger.error('[BienDetail] Erreur suppression:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  // Calculs des valeurs avec fonction centralisée
  const loyerMensuel = parseFloat(bien?.loyerMensuel?.toString() || "0")

  // Utiliser la fonction centralisée pour les charges
  const totalCharges = calculateChargesMensuelles(bien)

  const loyerNet = loyerMensuel - totalCharges

  const mensualiteCredit = bien?.typeFinancement === "CREDIT" 
    ? parseFloat(bien?.mensualiteCredit?.toString() || "0")
    : 0

  const cashFlow = loyerNet - mensualiteCredit

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{bien.nom}</h1>
            <p className="text-muted-foreground">
              {bien.adresse}, {bien.codePostal} {bien.ville}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleDelete}
              variant="outline"
              size="sm"
            >
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Résumé financier simplifié */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Loyer mensuel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(loyerMensuel)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Cash-flow mensuel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${
              cashFlow > 0 ? "text-green-600" : "text-red-600"
            }`}>
              {cashFlow > 0 ? "+" : ""}{formatCurrency(cashFlow)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">après charges</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vue-ensemble" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vue-ensemble">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="loyers">Loyers</TabsTrigger>
          <TabsTrigger value="charges">Charges</TabsTrigger>
          <TabsTrigger value="financement">Financement</TabsTrigger>
          <TabsTrigger value="investissement">Investissement</TabsTrigger>
          <TabsTrigger value="locataires">Locataires</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="vue-ensemble">
          <VueEnsemble bien={bien} />
        </TabsContent>

        <TabsContent value="loyers">
          <div className="space-y-6">
            <LoyersParLot bien={bien} />
            
            {/* Historique des quittances */}
            <HistoriqueQuittances
              bienId={bien.id}
              bienNom={bien.nom}
              bienAdresse={bien.adresse}
              bienVille={bien.ville}
              bienCodePostal={bien.codePostal}
              proprietaireNom="Propriétaire"
            />
          </div>
        </TabsContent>

        <TabsContent value="charges">
          <Charges bien={bien} />
        </TabsContent>

        <TabsContent value="financement">
          <Financement bien={bien} />
        </TabsContent>

        <TabsContent value="investissement">
          <Investissement bien={bien} />
        </TabsContent>

        <TabsContent value="locataires">
          <LocatairesList bien={bien} />
        </TabsContent>

        <TabsContent value="documents">
          <Documents bien={bien} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
