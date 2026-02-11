"use client"

import { upsertLoyer, getLocataires, getLots } from "@/lib/database"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import type { QuittanceData } from "@/lib/generateQuittance"
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { LoyersHeader } from "./loyers/LoyersHeader"
import { CalendrierPaiements } from "./loyers/CalendrierPaiements"
import { LoyersStatistiques } from "./loyers/LoyersStatistiques"

// Lazy-load du modal pour réduire le bundle initial
const QuittanceModal = dynamic(
  () => import("@/components/biens/QuittanceModal").then(mod => ({ default: mod.QuittanceModal })),
  { 
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
  }
)

interface LoyersProps {
  bien: any
  lotId?: string
}

export function Loyers({ bien, lotId }: LoyersProps) {
  const router = useRouter()

  const [lot, setLot] = useState<any>(null)
  const [locataires, setLocataires] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loyersData, setLoyersData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // États pour le modal quittance
  const [quittanceOpen, setQuittanceOpen] = useState(false)
  const [quittanceData, setQuittanceData] = useState<QuittanceData | null>(null)
  
  const anneeActuelle = new Date().getFullYear()
  const moisActuel = new Date().getMonth()
  
  // États des paiements : { mois, locataire, apl, locataireId }
  const [paiements, setPaiements] = useState<Array<{ mois: number; locataire: boolean; apl: boolean; locataireId?: string | null }>>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Si lotId fourni, charger le lot spécifique
        if (lotId) {
          const lotsData = await getLots(bien.id)
          const lotTrouve = lotsData.find((l: any) => l.id === lotId)
          setLot(lotTrouve || null)
        } else {
          setLot(null)
        }

        // Appels parallèles : locataires (direct DB) + profile + loyers (API)
        const [locatairesData, profileResponse, loyersResponse] = await Promise.all([
          getLocataires(bien.id),
          fetch(`/api/user/profile`),
          fetch(`/api/biens/${bien.id}/loyers`)
        ])
        
        // Parser les réponses API en parallèle
        const [profileData, loyersApiData] = await Promise.all([
          profileResponse.ok ? profileResponse.json() : { profile: null },
          loyersResponse.ok ? loyersResponse.json() : { loyers: [] }
        ])
        
        // Traiter les données — filtrer par lot si lotId fourni
        const locatairesFiltres = lotId
          ? locatairesData.filter((loc: any) => loc.lotId === lotId)
          : locatairesData
        setLocataires(locatairesFiltres)
        
        if (profileData.profile) {
          setProfile(profileData.profile)
        }
        
        setLoyersData(loyersApiData.loyers || [])
        
        // Construire les paiements : une entrée par mois par locataire (filtrés par lot)
        const paiementsFromDB: Array<{ mois: number; locataire: boolean; apl: boolean; locataireId?: string | null }> = []
        
        for (let mois = 0; mois < 12; mois++) {
          if (locatairesFiltres.length > 0) {
            for (const loc of locatairesFiltres) {
              // Chercher un loyer spécifique à ce locataire et ce mois
              const loyerMois = (loyersApiData.loyers || []).find(
                (l: any) => l.mois === mois && l.locataireId === loc.id
              )
              // Fallback : chercher un loyer global (ancien format sans locataireId)
              const loyerGlobal = !loyerMois
                ? (loyersApiData.loyers || []).find((l: any) => l.mois === mois && !l.locataireId)
                : null
              const loyer = loyerMois || loyerGlobal
              
              paiementsFromDB.push({
                mois,
                locataire: loyer?.payeLocataire || false,
                apl: loyer?.payeAPL || false,
                locataireId: loc.id,
              })
            }
          } else {
            // Pas de locataire : paiement global
            const loyerMois = (loyersApiData.loyers || []).find((l: any) => l.mois === mois)
            paiementsFromDB.push({
              mois,
              locataire: loyerMois?.payeLocataire || false,
              apl: loyerMois?.payeAPL || false,
              locataireId: null,
            })
          }
        }
        setPaiements(paiementsFromDB)
      } catch (error: unknown) {
        logger.error('[Loyers] Erreur chargement:', error)
        toast.error('Impossible de charger les données des loyers')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [bien.id, lotId])

  // Loyer du lot si lotId fourni, sinon loyer total du bien
  const loyerMensuel = lot
    ? parseFloat(lot.loyerMensuel?.toString() || "0")
    : parseFloat(bien.loyerMensuel?.toString() || "0")

  // Calculs agrégés multi-locataires
  const totalAPL = locataires.reduce((sum, loc) => sum + parseFloat(loc.montantAPL?.toString() || "0"), 0)
  const totalLoyerNetLocataires = loyerMensuel - totalAPL

  // Calculs agrégés : compter les mois payés de façon unique (un mois = payé si au moins 1 locataire a payé)
  const moisUniquesLocatairePayes = new Set(paiements.filter(p => p.locataire).map(p => p.mois)).size
  const moisUniquesAPLPayes = new Set(paiements.filter(p => p.apl).map(p => p.mois)).size
  
  // CA calculé par locataire : somme des (resteACharge * moisPayés) pour chaque locataire
  const caLocataire = locataires.reduce((sum, loc) => {
    const moisPayes = paiements.filter(p => p.locataireId === loc.id && p.locataire).length
    const resteACharge = loyerMensuel - parseFloat(loc.montantAPL?.toString() || "0")
    return sum + (resteACharge * moisPayes)
  }, 0)
  
  const caAPL = locataires.reduce((sum, loc) => {
    const moisPayes = paiements.filter(p => p.locataireId === loc.id && p.apl).length
    const montantAPLLoc = parseFloat(loc.montantAPL?.toString() || "0")
    return sum + (montantAPLLoc * moisPayes)
  }, 0)
  
  const caTotal = caLocataire + caAPL
  const caPrevuTotal = loyerMensuel * 12

  const handleTogglePaiement = async (mois: number, type: "locataire" | "apl", locataireId: string) => {
    const previousState = [...paiements]
    
    // Mise à jour optimiste locale
    const newPaiements = paiements.map(p => {
      if (p.mois === mois && p.locataireId === locataireId) {
        return { ...p, [type === "locataire" ? "locataire" : "apl"]: !p[type === "locataire" ? "locataire" : "apl"] }
      }
      return p
    })
    setPaiements(newPaiements)
    
    // Trouver le paiement mis à jour
    const paiementUpdated = newPaiements.find(p => p.mois === mois && p.locataireId === locataireId)
    if (!paiementUpdated) return
    
    // Trouver le locataire pour calculer les montants
    const locataire = locataires.find(l => l.id === locataireId)
    if (!locataire) return
    
    const montantAPLLoc = parseFloat(locataire.montantAPL?.toString() || "0")
    const resteACharge = loyerMensuel - montantAPLLoc
    
    try {
      const annee = new Date().getFullYear()

      await upsertLoyer(bien.id, annee, mois, {
        montantLocataire: resteACharge,
        montantAPL: montantAPLLoc,
        payeLocataire: paiementUpdated.locataire,
        payeAPL: paiementUpdated.apl,
      }, undefined, locataireId)
      router.refresh()
    } catch (error) {
      logger.error('[Loyers] Erreur sauvegarde paiement:', error)
      setPaiements(previousState)
      toast.error('Erreur lors de la sauvegarde du paiement')
    }
  }

  const openQuittance = (moisIndex: number, locataireId: string) => {
    // Trouver le locataire concerné
    const locataire = locataires.find(l => l.id === locataireId)
    if (!locataire) return
    
    // Trouver le loyer spécifique (par locataire) ou global
    const loyer = loyersData.find((l) => l.mois === moisIndex && l.locataireId === locataireId)
      || loyersData.find((l) => l.mois === moisIndex && !l.locataireId)
    if (!loyer || !loyer.payeLocataire) return

    const montantAPLLoc = parseFloat(locataire.montantAPL?.toString() || "0")
    const resteACharge = loyerMensuel - montantAPLLoc

    // Calculer les dates de paiement
    const datePayeLocataireDate = loyer.datePaiementLocataire 
      ? new Date(loyer.datePaiementLocataire)
      : new Date()
    
    const datePayeAPLDate = loyer.datePaiementAPL
      ? new Date(loyer.datePaiementAPL)
      : new Date()

    setQuittanceData({
      bienId: bien.id,
      proprietaireNom: profile?.nom || 'Propriétaire',
      bienNom: bien.nom,
      bienAdresse: bien.adresse || '',
      bienVille: bien.ville || '',
      bienCodePostal: bien.codePostal || '',
      locataireNom: locataire.nom || '',
      locatairePrenom: locataire.prenom || '',
      locataireEmail: locataire.email || null,
      annee: anneeActuelle,
      mois: moisIndex + 1, // Convertir 0-11 en 1-12
      datePayeLocataire: datePayeLocataireDate.toISOString().split('T')[0],
      datePayeAPL: datePayeAPLDate.toISOString().split('T')[0],
      modePaiement: locataire.modePaiement || 'virement',
      montantLocataire: parseFloat(loyer.montantLocataire?.toString() || resteACharge.toString() || "0"),
      montantAPL: parseFloat(loyer.montantAPL?.toString() || montantAPLLoc.toString() || "0"),
    })
    setQuittanceOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Chargement des données...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <LoyersHeader
        caTotal={caTotal}
        caPrevuTotal={caPrevuTotal}
        caLocataire={caLocataire}
        loyerNetLocataire={totalLoyerNetLocataires}
        moisLocatairePayes={moisUniquesLocatairePayes}
        caAPL={caAPL}
        montantAPL={totalAPL}
        moisAPLPayes={moisUniquesAPLPayes}
        loyerMensuel={loyerMensuel}
      />
      
      <CalendrierPaiements
        paiements={paiements}
        locataires={locataires.map(l => ({
          id: l.id,
          nom: l.nom,
          prenom: l.prenom,
          montantAPL: parseFloat(l.montantAPL?.toString() || "0"),
        }))}
        loyerMensuel={loyerMensuel}
        moisActuel={moisActuel}
        anneeActuelle={anneeActuelle}
        onTogglePaiement={handleTogglePaiement}
        onOpenQuittance={openQuittance}
        lotId={lotId}
      />
      
      <LoyersStatistiques
        moisLocatairePayes={moisUniquesLocatairePayes}
        moisAPLPayes={moisUniquesAPLPayes}
        montantAPL={totalAPL}
        caPrevuTotal={caPrevuTotal}
        caTotal={caTotal}
      />
      
      {/* Modal Quittance */}
      {quittanceData && (
        <QuittanceModal
          isOpen={quittanceOpen}
          onClose={() => setQuittanceOpen(false)}
          data={quittanceData}
          locataireEmail={quittanceData.locataireEmail}
        />
      )}
    </div>
  )
}
