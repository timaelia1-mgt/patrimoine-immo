"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/calculations"
import { getLocataire, getLoyers, upsertLoyer, getUserProfile } from "@/lib/database"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QuittanceModal } from "@/components/biens/QuittanceModal"
import { QuittanceData } from "@/lib/generateQuittance"

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
  
  const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]
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
        // Charger les infos locataire
        const locataireData = await getLocataire(bien.id)
        if (locataireData) {
          setLocataireInfo(locataireData)
        }

        // Charger le profile du propriétaire
        const profileData = await getUserProfile(bien.userId)
        if (profileData) {
          setProfile(profileData)
        }

        // Charger les loyers de l'année
        const annee = new Date().getFullYear()
        const loyers = await getLoyers(bien.id, annee)
        setLoyersData(loyers)

        const paiementsFromDB = Array.from({ length: 12 }, (_, i) => {
          const loyerMois = loyers.find((l) => l.mois === i)
          return {
            locataire: loyerMois?.payeLocataire || false,
            apl: loyerMois?.payeAPL || false,
          }
        })

        setPaiements(paiementsFromDB)
      } catch (error) {
        console.error("Erreur chargement données:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [bien.id, bien.userId])

  const montantAPL = parseFloat(locataireInfo?.montantAPL || "0")
  const loyerNetLocataire = loyerMensuel - montantAPL

  // Calculs
  const moisLocatairePayes = paiements.filter(p => p.locataire).length
  const moisAPLPayes = paiements.filter(p => p.apl).length
  
  const caLocataire = loyerNetLocataire * moisLocatairePayes
  const caAPL = montantAPL * moisAPLPayes
  const caTotal = caLocataire + caAPL
  
  const caPrevuLocataire = loyerNetLocataire * 12
  const caPrevuAPL = montantAPL * 12
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
      console.error("Erreur sauvegarde paiement:", error)
      // Rollback de l'état local
      setPaiements(previousState)
      // Feedback utilisateur
      alert("Erreur lors de la sauvegarde du paiement. Veuillez réessayer.")
    }
  }

  const openQuittance = (moisIndex: number) => {
    const loyer = loyersData.find((l) => l.mois === moisIndex)
    if (!loyer || !loyer.payeLocataire) return

    // Calculer les dates de début et fin du mois
    const mois = moisIndex + 1 // Convertir 0-11 en 1-12
    const debut = new Date(anneeActuelle, moisIndex, 1)
    const fin = new Date(anneeActuelle, moisIndex + 1, 0)
    
    // Date de paiement
    const datePaiementDate = loyer.datePaiementLocataire 
      ? new Date(loyer.datePaiementLocataire)
      : new Date()

    setQuittanceData({
      proprietaireNom: profile?.name || 'Propriétaire',
      bienNom: bien.nom,
      bienAdresse: bien.adresse || '',
      bienVille: bien.ville || '',
      bienCodePostal: bien.codePostal || '',
      locataireNom: locataireInfo?.nom || '',
      locatairePrenom: locataireInfo?.prenom || '',
      annee: anneeActuelle,
      mois: mois, // 1-12
      dateDebut: debut.toISOString().split('T')[0], // Format 'yyyy-MM-dd'
      dateFin: fin.toISOString().split('T')[0], // Format 'yyyy-MM-dd'
      datePaiement: datePaiementDate.toISOString().split('T')[0], // Format 'yyyy-MM-dd'
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
      {/* Résumé financier */}
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

      {/* Calendrier unifié */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Suivi des paiements {anneeActuelle}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-500 text-green-700">
                Locataire
              </Badge>
              {montantAPL > 0 && (
                <Badge variant="outline" className="border-purple-500 text-purple-700">
                  APL
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {moisNoms.map((mois, index) => {
              const paiement = paiements[index]
              const isMoisActuel = index === moisActuel
              const isFutur = index > moisActuel

              return (
                <div
                  key={index}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all
                    ${isMoisActuel ? 'ring-2 ring-blue-500' : 'border-gray-200'}
                    ${isFutur ? 'opacity-50' : ''}
                  `}
                >
                  {isMoisActuel && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-20">
                      <span className="text-white text-xs font-bold">•</span>
                    </div>
                  )}
                  
                  <div className="text-center mb-3">
                    <p className="font-semibold text-lg mb-1">{mois}</p>
                    <p className="text-xs text-muted-foreground">
                      {isFutur ? 'À venir' : anneeActuelle.toString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {/* Bouton Locataire */}
                    <div className="relative">
                      <button
                        onClick={() => !isFutur && togglePaiementLocataire(index)}
                        disabled={isFutur}
                        className={`
                          w-full p-2 rounded border-2 text-sm font-medium transition-all
                          ${paiement.locataire
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-red-500 bg-red-50 text-red-700'
                          }
                          ${isFutur ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
                        `}
                      >
                        {paiement.locataire ? '✓' : '✗'} Locataire
                        <div className="text-xs mt-1 font-semibold">
                          {formatCurrency(loyerNetLocataire)}
                        </div>
                      </button>
                      {/* Bouton Quittance (seulement si payé) */}
                      {paiement.locataire && !isFutur && (
                        <button
                          onClick={() => openQuittance(index)}
                          className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-2 py-1 rounded shadow-lg transition-colors z-10"
                          title="Générer quittance"
                        >
                          📄 Quittance
                        </button>
                      )}
                    </div>

                    {/* Bouton APL */}
                    {montantAPL > 0 && (
                      <button
                        onClick={() => !isFutur && togglePaiementAPL(index)}
                        disabled={isFutur}
                        className={`
                          w-full p-2 rounded border-2 text-sm font-medium transition-all
                          ${paiement.apl
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-orange-500 bg-orange-50 text-orange-700'
                          }
                          ${isFutur ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
                        `}
                      >
                        {paiement.apl ? '✓' : '✗'} APL
                        <div className="text-xs mt-1 font-semibold">
                          {formatCurrency(montantAPL)}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              💡 <strong>Astuce :</strong> Cliquez sur "Locataire" ou "APL" pour marquer chaque paiement indépendamment. 
              Le CA annuel se calcule automatiquement.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques détaillées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Paiements Locataire</span>
                <span className="text-sm font-medium">{moisLocatairePayes}/12 mois</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${(moisLocatairePayes / 12) * 100}%` }}
                />
              </div>
            </div>

            {montantAPL > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Paiements APL</span>
                  <span className="text-sm font-medium">{moisAPLPayes}/12 mois</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${(moisAPLPayes / 12) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reste à percevoir</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatCurrency(caPrevuTotal - caTotal)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
