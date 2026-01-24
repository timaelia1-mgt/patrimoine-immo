"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { formatCurrency, calculerCashFlow, calculerStatutBien, calculerLoyerNet } from "@/lib/calculations"
import { cn } from "@/lib/utils"
import { VueEnsemble } from "@/components/biens/VueEnsemble"
import { Loyers } from "@/components/biens/Loyers"
import { Charges } from "@/components/biens/Charges"
import { Financement } from "@/components/biens/Financement"
import { Documents } from "@/components/biens/Documents"
import { Investissement } from "@/components/biens/Investissement"
import { Historique } from "@/components/biens/Historique"
import { Rentabilite } from "@/components/biens/Rentabilite"
import { Locataire } from "@/components/biens/Locataire"
import { FinancementForm, InvestissementForm, HistoriqueForm, ChargesForm, RentabiliteForm, LocataireForm, enrichirThemeSimple } from "@/components/biens/EnrichissementForms"

export default function BienDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [bien, setBien] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fonctionnalitesOpen, setFonctionnalitesOpen] = useState(false)
  const [financementFormOpen, setFinancementFormOpen] = useState(false)
  const [investissementFormOpen, setInvestissementFormOpen] = useState(false)
  const [historiqueFormOpen, setHistoriqueFormOpen] = useState(false)
  const [chargesFormOpen, setChargesFormOpen] = useState(false)
  const [rentabiliteFormOpen, setRentabiliteFormOpen] = useState(false)
  const [locataireFormOpen, setLocataireFormOpen] = useState(false)

  useEffect(() => {
    fetchBien()
  }, [params.id])

  const fetchBien = async () => {
    try {
      const response = await fetch(`/api/biens/${params.id}`)
      const data = await response.json()
      setBien(data)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrichir = (themeId: string) => {
    setFonctionnalitesOpen(false)  // Fermer le dialog principal
    
    // Ouvrir le formulaire correspondant
    if (themeId === 'financement') {
      setFinancementFormOpen(true)
    } else if (themeId === 'investissement') {
      setInvestissementFormOpen(true)
    } else if (themeId === 'historique') {
      setHistoriqueFormOpen(true)
    } else if (themeId === 'charges') {
      setChargesFormOpen(true)
    } else if (themeId === 'rentabilite') {
      setRentabiliteFormOpen(true)
    } else if (themeId === 'locataire') {
      setLocataireFormOpen(true)
    }
  }

  const handleDesenrichir = async (themeId: string) => {
    if (!bien) return
    if (!confirm("Êtes-vous sûr ? Les données seront conservées.")) return

    const champMap: any = {
      financement: "enrichissementFinancement",
      investissement: "enrichissementInvestissement",
      historique: "enrichissementHistorique",
      charges: "enrichissementCharges",
      locataire: "enrichissementLocataire",
      rentabilite: "enrichissementRentabilite",
    }

    const champ = champMap[themeId]
    if (!champ) return

    try {
      const response = await fetch(`/api/biens/${bien.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [champ]: false })
      })

      if (response.ok) {
        setFonctionnalitesOpen(false)
        window.location.reload()
      } else {
        const errorData = await response.json()
        console.error("Erreur API:", errorData)
        alert("Erreur lors du désenrichissement")
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors du désenrichissement")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) return

    try {
      const response = await fetch(`/api/biens/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (!bien) {
    return (
      <div className="p-6">
        <p className="text-red-600">Bien introuvable</p>
      </div>
    )
  }

  // Calculs des valeurs pour éviter les NaN
  const loyerMensuel = parseFloat(bien?.loyerMensuel?.toString() || "0")
  const totalCharges = 
    parseFloat(bien?.taxeFonciere?.toString() || "0") +
    parseFloat(bien?.chargesCopro?.toString() || "0") +
    parseFloat(bien?.assurance?.toString() || "0") +
    parseFloat(bien?.fraisGestion?.toString() || "0") +
    parseFloat(bien?.autresCharges?.toString() || "0")
  const loyerNet = loyerMensuel - totalCharges
  const mensualiteCredit = bien?.typeFinancement === "CREDIT" 
    ? parseFloat(bien?.mensualiteCredit?.toString() || "0")
    : 0
  const cashFlow = loyerNet - mensualiteCredit
  
  const statut = calculerStatutBien(bien)

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
          
          {/* Boutons enrichissement */}
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {[
                bien.enrichissementInvestissement,
                bien.enrichissementHistorique,
                bien.enrichissementLocataire,
                bien.enrichissementRentabilite,
              ].filter(Boolean).length}/4 enrichis
            </Badge>

            <Button 
              onClick={() => setFonctionnalitesOpen(true)}
              size="sm"
              variant="outline"
            >
              ⚙️ Fonctionnalités avancées
            </Button>

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
          {/* Onglets de base (toujours visibles) */}
          <TabsTrigger value="vue-ensemble">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="loyers">Loyers</TabsTrigger>
          <TabsTrigger value="charges">Charges</TabsTrigger>
          <TabsTrigger value="financement">Financement</TabsTrigger>
          
          {/* Onglets enrichis (conditionnels, dans l'ordre logique) */}
          {bien.enrichissementInvestissement && (
            <TabsTrigger value="investissement">Investissement</TabsTrigger>
          )}
          {bien.enrichissementHistorique && (
            <TabsTrigger value="historique">Historique</TabsTrigger>
          )}
          {bien.enrichissementRentabilite && (
            <TabsTrigger value="rentabilite">Rentabilité</TabsTrigger>
          )}
          {bien.enrichissementLocataire && (
            <TabsTrigger value="locataire">Locataire</TabsTrigger>
          )}
          
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Contenu des onglets de base */}
        <TabsContent value="vue-ensemble">
          <VueEnsemble bien={bien} />
        </TabsContent>

        <TabsContent value="loyers">
          <Loyers bien={bien} />
        </TabsContent>

        <TabsContent value="charges">
          <Charges bien={bien} />
        </TabsContent>

        <TabsContent value="financement">
          <Financement bien={bien} />
        </TabsContent>

        {/* Contenu des onglets enrichis */}
        {bien.enrichissementInvestissement && (
          <TabsContent value="investissement">
            <Investissement bien={bien} />
          </TabsContent>
        )}

        {bien.enrichissementHistorique && (
          <TabsContent value="historique">
            <Historique bien={bien} />
          </TabsContent>
        )}

        {bien.enrichissementRentabilite && (
          <TabsContent value="rentabilite">
            <Rentabilite bien={bien} />
          </TabsContent>
        )}

        {bien.enrichissementLocataire && (
          <TabsContent value="locataire">
            <Locataire bien={bien} />
          </TabsContent>
        )}

        <TabsContent value="documents">
          <Documents bien={bien} />
        </TabsContent>
      </Tabs>

      {/* Dialog Fonctionnalités avancées */}
      <Dialog open={fonctionnalitesOpen} onOpenChange={setFonctionnalitesOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>⚙️ Fonctionnalités avancées</DialogTitle>
                <DialogDescription>
                  Activez ou désactivez les fonctionnalités enrichies de ce bien
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => setFonctionnalitesOpen(false)}
                className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span className="sr-only">Fermer</span>
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-2">
            {/* Investissement */}
            <Card className={cn(
              "cursor-pointer transition-all",
              bien.enrichissementInvestissement ? "border-green-500 bg-green-50" : "hover:bg-muted"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <CardTitle className="text-base">Investissement</CardTitle>
                      <CardDescription className="text-sm">
                        Prix d'achat, frais notaire, travaux
                      </CardDescription>
                    </div>
                  </div>
                  {bien.enrichissementInvestissement ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-600">Activé</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDesenrichir('investissement')}
                      >
                        Désactiver
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => handleEnrichir('investissement')}
                    >
                      Activer
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Historique */}
            <Card className={cn(
              "cursor-pointer transition-all",
              bien.enrichissementHistorique ? "border-green-500 bg-green-50" : "hover:bg-muted"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <CardTitle className="text-base">Historique</CardTitle>
                      <CardDescription className="text-sm">
                        Dates d'acquisition et mise en location
                      </CardDescription>
                    </div>
                  </div>
                  {bien.enrichissementHistorique ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-600">Activé</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDesenrichir('historique')}
                      >
                        Désactiver
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => handleEnrichir('historique')}
                    >
                      Activer
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Rentabilité */}
            <Card className={cn(
              "cursor-pointer transition-all",
              bien.enrichissementRentabilite ? "border-green-500 bg-green-50" : "hover:bg-muted"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                      <CardTitle className="text-base">Rentabilité</CardTitle>
                      <CardDescription className="text-sm">
                        Revenus et charges cumulés, bilan
                      </CardDescription>
                    </div>
                  </div>
                  {bien.enrichissementRentabilite ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-600">Activé</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDesenrichir('rentabilite')}
                      >
                        Désactiver
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => handleEnrichir('rentabilite')}
                    >
                      Activer
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Locataire */}
            <Card className={cn(
              "cursor-pointer transition-all",
              bien.enrichissementLocataire ? "border-green-500 bg-green-50" : "hover:bg-muted"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <CardTitle className="text-base">Locataire & APL</CardTitle>
                      <CardDescription className="text-sm">
                        Infos locataire, mode de paiement
                      </CardDescription>
                    </div>
                  </div>
                  {bien.enrichissementLocataire ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-600">Activé</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDesenrichir('locataire')}
                      >
                        Désactiver
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => handleEnrichir('locataire')}
                    >
                      Activer
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs de formulaire d'enrichissement */}
      <FinancementForm 
        open={financementFormOpen} 
        onOpenChange={setFinancementFormOpen}
        bienId={bien.id}
        onSuccess={() => window.location.reload()}
      />

      <InvestissementForm 
        open={investissementFormOpen} 
        onOpenChange={setInvestissementFormOpen}
        bienId={bien.id}
        onSuccess={() => window.location.reload()}
      />

      <HistoriqueForm 
        open={historiqueFormOpen} 
        onOpenChange={setHistoriqueFormOpen}
        bienId={bien.id}
        onSuccess={() => window.location.reload()}
      />

      <ChargesForm 
        open={chargesFormOpen} 
        onOpenChange={setChargesFormOpen}
        bienId={bien.id}
        onSuccess={() => window.location.reload()}
      />

      <RentabiliteForm 
        open={rentabiliteFormOpen} 
        onOpenChange={setRentabiliteFormOpen}
        bienId={bien.id}
        onSuccess={() => window.location.reload()}
      />

      <LocataireForm 
        open={locataireFormOpen} 
        onOpenChange={setLocataireFormOpen}
        bienId={bien.id}
        onSuccess={() => window.location.reload()}
      />

    </div>
  )
}
