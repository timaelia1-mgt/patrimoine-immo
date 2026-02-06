"use client"

import { upsertLoyer } from "@/lib/database"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QuittanceModal } from "@/components/biens/QuittanceModal"
import { QuittanceData } from "@/lib/generateQuittance"
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { LoyersHeader } from "./loyers/LoyersHeader"
import { CalendrierPaiements } from "./loyers/CalendrierPaiements"
import { LoyersStatistiques } from "./loyers/LoyersStatistiques"

interface LoyersProps {
  bien: any
}

export function Loyers({ bien }: LoyersProps) {
  const router = useRouter()
  const loyerMensuel = parseFloat(bien.loyerMensuel?.toString() || "0")

  const [locataireInfo, setLocataireInfo] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loyersData, setLoyersData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // États pour le modal quittance
  const [quittanceOpen, setQuittanceOpen] = useState(false)
  const [quittanceData, setQuittanceData] = useState<QuittanceData | null>(null)
  
  const anneeActuelle = new Date().getFullYear()
  const moisActuel = new Date().getMonth()
  
  // États des paiements : { locataire: boolean, apl: boolean }
  const [paiements, setPaiements] = useState<Array<{ locataire: boolean; apl: boolean }>>(
    Array.from({ length: 12 }, () => ({
      locataire: false,
      apl: false,
    }))
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les infos locataire via API
        const locataireResponse = await fetch(`/api/biens/${bien.id}/locataire`)
        if (locataireResponse.ok) {
          const data = await locataireResponse.json()
          if (data.locataire) {
            setLocataireInfo(data.locataire)
          }
        }
        
        // Charger le profile du propriétaire via API
        const profileResponse = await fetch(`/api/user/profile`)
        if (profileResponse.ok) {
          const data = await profileResponse.json()
          if (data.profile) {
            setProfile(data.profile)
          }
        }
        
        // Charger les loyers de l'année via API
        const loyersResponse = await fetch(`/api/biens/${bien.id}/loyers`)
        if (loyersResponse.ok) {
          const data = await loyersResponse.json()
          setLoyersData(data.loyers || [])
          
          const paiementsFromDB = Array.from({ length: 12 }, (_, i) => {
            const loyerMois = (data.loyers || []).find((l: any) => l.mois === i)
            return {
              locataire: loyerMois?.payeLocataire || false,
              apl: loyerMois?.payeAPL || false,
            }
          })
          setPaiements(paiementsFromDB)
        }
      } catch (error: unknown) {
        logger.error('[Loyers] Erreur chargement:', error)
        toast.error('Impossible de charger les données des loyers')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [bien.id])

  const montantAPL = parseFloat(locataireInfo?.montantAPL || "0")
  const loyerNetLocataire = loyerMensuel - montantAPL

  // Calculs
  const moisLocatairePayes = paiements.filter(p => p.locataire).length
  const moisAPLPayes = paiements.filter(p => p.apl).length
  
  const caLocataire = loyerNetLocataire * moisLocatairePayes
  const caAPL = montantAPL * moisAPLPayes
  const caTotal = caLocataire + caAPL
  
  const caPrevuTotal = loyerMensuel * 12

  const togglePaiementLocataire = async (index: number) => {
    const newPaiements = [...paiements]
    newPaiements[index] = {
      ...newPaiements[index],
      locataire: !newPaiements[index].locataire,
    }
    setPaiements(newPaiements)

    await savePaiement(index, newPaiements[index])
  }

  const togglePaiementAPL = async (index: number) => {
    const newPaiements = [...paiements]
    newPaiements[index] = {
      ...newPaiements[index],
      apl: !newPaiements[index].apl,
    }
    setPaiements(newPaiements)

    await savePaiement(index, newPaiements[index])
  }

  const savePaiement = async (
    mois: number,
    paiement: { locataire: boolean; apl: boolean }
  ) => {
    // Sauvegarder l'état précédent pour rollback
    const previousState = [...paiements]
    
    try {
      const annee = new Date().getFullYear()

      await upsertLoyer(bien.id, annee, mois, {
        montantLocataire: loyerNetLocataire,
        montantAPL: montantAPL,
        payeLocataire: paiement.locataire,
        payeAPL: paiement.apl,
      })
      router.refresh() // Refresh data after saving
    } catch (error) {
      logger.error('[Loyers] Erreur sauvegarde paiement:', error)
      // Rollback de l'état local
      setPaiements(previousState)
      // Feedback utilisateur
      toast.error('Erreur lors de la sauvegarde du paiement')
    }
  }

  const openQuittance = (moisIndex: number) => {
    const loyer = loyersData.find((l) => l.mois === moisIndex)
    if (!loyer || !loyer.payeLocataire) return

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
      locataireNom: locataireInfo?.nom || '',
      locatairePrenom: locataireInfo?.prenom || '',
      locataireEmail: locataireInfo?.email || null,
      annee: anneeActuelle,
      mois: moisIndex + 1, // Convertir 0-11 en 1-12
      datePayeLocataire: datePayeLocataireDate.toISOString().split('T')[0], // Format 'yyyy-MM-dd'
      datePayeAPL: datePayeAPLDate.toISOString().split('T')[0], // Format 'yyyy-MM-dd'
      modePaiement: locataireInfo?.modePaiement || 'virement',
      montantLocataire: parseFloat(loyer.montantLocataire?.toString() || loyerNetLocataire.toString() || "0"),
      montantAPL: parseFloat(loyer.montantAPL?.toString() || montantAPL.toString() || "0"),
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
        loyerNetLocataire={loyerNetLocataire}
        moisLocatairePayes={moisLocatairePayes}
        caAPL={caAPL}
        montantAPL={montantAPL}
        moisAPLPayes={moisAPLPayes}
        loyerMensuel={loyerMensuel}
      />
      
      <CalendrierPaiements
        paiements={paiements}
        loyerNetLocataire={loyerNetLocataire}
        montantAPL={montantAPL}
        moisActuel={moisActuel}
        anneeActuelle={anneeActuelle}
        onToggleLocataire={togglePaiementLocataire}
        onToggleAPL={togglePaiementAPL}
        onOpenQuittance={openQuittance}
      />
      
      <LoyersStatistiques
        moisLocatairePayes={moisLocatairePayes}
        moisAPLPayes={moisAPLPayes}
        montantAPL={montantAPL}
        caPrevuTotal={caPrevuTotal}
        caTotal={caTotal}
      />
      
      {/* Modal Quittance */}
      {quittanceData && (
        <QuittanceModal
          isOpen={quittanceOpen}
          onClose={() => setQuittanceOpen(false)}
          data={quittanceData}
          locataireEmail={locataireInfo?.email}
        />
      )}
    </div>
  )
}
