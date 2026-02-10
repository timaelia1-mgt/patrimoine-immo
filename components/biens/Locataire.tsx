"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard, 
  DollarSign,
  Wallet,
  Landmark,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/biens/KPICard"
import { formatCurrency } from "@/lib/calculations"
import { upsertLocataire } from "@/lib/database"
import { createClient } from "@/lib/supabase/client"
import { validateAndShowErrors, validateDatesCoherence } from "@/lib/validations"
import { logger } from "@/lib/logger"
import { toast } from "sonner"

interface LocataireProps {
  bien: any
}

const MODE_PAIEMENT_OPTIONS = [
  { value: "virement", label: "Virement", variant: "emerald" },
  { value: "prelevement", label: "Prélèvement", variant: "sky" },
  { value: "cheque", label: "Chèque", variant: "purple" },
  { value: "especes", label: "Espèces", variant: "orange" },
] as const

export function Locataire({ bien }: LocataireProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [locataire, setLocataire] = useState<any>(null)

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    dateEntree: "",
    montantAPL: "0",
    modePaiement: "virement",
  })

  const hasLocataire = !!locataire

  // Calculs
  const loyerMensuel = parseFloat(bien.loyerMensuel?.toString() || "0")
  const montantAPL = parseFloat(formData.montantAPL || "0")
  const loyerNetLocataire = loyerMensuel - montantAPL

  // Charger locataire
  useEffect(() => {
    const fetchLocataire = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/biens/${bien.id}/locataire`)
        if (response.ok) {
          const { locataire: data } = await response.json()
          if (data) {
            setLocataire(data)
            setFormData({
              nom: data.nom || "",
              prenom: data.prenom || "",
              email: data.email || "",
              telephone: data.telephone || "",
              dateEntree: data.dateEntree ? new Date(data.dateEntree).toISOString().split("T")[0] : "",
              montantAPL: data.montantAPL?.toString() || "0",
              modePaiement: data.modePaiement || "virement",
            })
          }
        }
      } catch (error: unknown) {
        logger.error("[Locataire] Erreur chargement:", error)
        toast.error("Impossible de charger les informations du locataire")
      } finally {
        setLoading(false)
      }
    }
    fetchLocataire()
  }, [bien.id])

  const handleSave = async () => {
    // Validation
    if (!formData.nom || !formData.prenom) {
      toast.error("Le nom et le prénom sont obligatoires")
      return
    }

    // Validation cohérence dates
    if (bien.dateMiseEnLocation && formData.dateEntree) {
      const isValid = validateAndShowErrors({
        dateMiseEnLocation: bien.dateMiseEnLocation,
        dateEntreeLocataire: formData.dateEntree,
      })

      if (!isValid) {
        const result = validateDatesCoherence({
          dateMiseEnLocation: bien.dateMiseEnLocation,
          dateEntreeLocataire: formData.dateEntree,
        })

        const hasHardErrors = result.errors.some((e) => !e.startsWith("⚠️"))

        if (hasHardErrors) {
          return
        }
      }
    }

    try {
      setSaving(true)

      // Récupérer le lot par défaut du bien
      const supabase = createClient()
      const { data: defaultLot, error: lotError } = await supabase
        .from("lots")
        .select("id")
        .eq("bien_id", bien.id)
        .eq("est_lot_defaut", true)
        .single()

      if (lotError || !defaultLot) {
        toast.error("Erreur : aucun lot par défaut trouvé")
        return
      }

      // Appeler upsertLocataire avec les 3 paramètres (bienId, lotId, data)
      await upsertLocataire(bien.id, defaultLot.id, {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email || null,
        telephone: formData.telephone || null,
        dateEntree: formData.dateEntree || null,
        montantAPL: parseFloat(formData.montantAPL || "0"),
        modePaiement: formData.modePaiement,
      })

      toast.success("Informations locataire enregistrées")
      setEditing(false)
      router.refresh()

      // Recharger les données
      const response = await fetch(`/api/biens/${bien.id}/locataire`)
      if (response.ok) {
        const { locataire: data } = await response.json()
        if (data) {
          setLocataire(data)
        }
      }
    } catch (error: unknown) {
      logger.error("[Locataire] Erreur sauvegarde:", error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (locataire) {
      setFormData({
        nom: locataire.nom || "",
        prenom: locataire.prenom || "",
        email: locataire.email || "",
        telephone: locataire.telephone || "",
        dateEntree: locataire.dateEntree ? new Date(locataire.dateEntree).toISOString().split("T")[0] : "",
        montantAPL: locataire.montantAPL?.toString() || "0",
        modePaiement: locataire.modePaiement || "virement",
      })
    }
    setEditing(false)
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    )
  }

  // Aucun locataire
  if (!hasLocataire && !editing) {
    return (
      <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-200 mb-1">
              Aucun locataire configuré
            </p>
            <p className="text-xs text-amber-300/80 mb-3">
              Configurez les informations du locataire pour suivre les loyers et les paiements.
            </p>
            <Button
              onClick={() => setEditing(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white"
            >
              Configurer le locataire
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs financiers (mode lecture uniquement) */}
      {hasLocataire && !editing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            icon={Wallet}
            label="Loyer mensuel total"
            value={formatCurrency(loyerMensuel)}
            subtext="Charges comprises"
            variant="amber"
            delay={0}
          />

          <KPICard
            icon={Landmark}
            label="Dont APL"
            value={formatCurrency(montantAPL)}
            subtext="Aide au logement"
            variant="purple"
            delay={100}
          />

          <KPICard
            icon={DollarSign}
            label="Reste à charge locataire"
            value={formatCurrency(loyerNetLocataire)}
            subtext="Part locataire"
            variant="emerald"
            delay={200}
          />
        </div>
      )}

      {/* Mode lecture : Informations locataire */}
      {hasLocataire && !editing && (
        <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-200">Informations du locataire</CardTitle>
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              >
                Modifier
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom complet */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Nom complet</p>
                  <p className="text-sm font-medium text-slate-200">
                    {locataire.prenom} {locataire.nom}
                  </p>
                </div>
              </div>

              {/* Email */}
              {locataire.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-sm font-medium text-slate-200">{locataire.email}</p>
                  </div>
                </div>
              )}

              {/* Téléphone */}
              {locataire.telephone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Téléphone</p>
                    <p className="text-sm font-medium text-slate-200">{locataire.telephone}</p>
                  </div>
                </div>
              )}

              {/* Date d&apos;entrée */}
              {locataire.dateEntree && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Date d&apos;entrée</p>
                    <p className="text-sm font-medium text-slate-200">
                      {new Date(locataire.dateEntree).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Mode de paiement */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Mode de paiement</p>
                  <Badge
                    variant="outline"
                    className={`
                      ${locataire.modePaiement === "virement" ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" : ""}
                      ${locataire.modePaiement === "prelevement" ? "border-sky-500/50 text-sky-400 bg-sky-500/10" : ""}
                      ${locataire.modePaiement === "cheque" ? "border-purple-500/50 text-purple-400 bg-purple-500/10" : ""}
                      ${locataire.modePaiement === "especes" ? "border-orange-500/50 text-orange-400 bg-orange-500/10" : ""}
                    `}
                  >
                    {MODE_PAIEMENT_OPTIONS.find((opt) => opt.value === locataire.modePaiement)?.label || locataire.modePaiement}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Note APL */}
            {montantAPL > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm text-purple-200">
                  💡 <strong>APL :</strong> Ce locataire bénéficie d&apos;une aide au logement de{" "}
                  <strong>{formatCurrency(montantAPL)}/mois</strong>. Pensez à vérifier les paiements
                  séparément dans l&apos;onglet Loyers.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mode édition : Formulaire */}
      {editing && (
        <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-slate-200">
              {hasLocataire ? "Modifier le locataire" : "Ajouter un locataire"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nom */}
              <div>
                <Label htmlFor="nom" className="text-slate-300">
                  Nom <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="nom"
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  placeholder="Dupont"
                />
              </div>

              {/* Prénom */}
              <div>
                <Label htmlFor="prenom" className="text-slate-300">
                  Prénom <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="prenom"
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  placeholder="Jean"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  placeholder="jean.dupont@email.com"
                />
              </div>

              {/* Téléphone */}
              <div>
                <Label htmlFor="telephone" className="text-slate-300">
                  Téléphone
                </Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  placeholder="06 12 34 56 78"
                />
              </div>

              {/* Date d'entrée */}
              <div>
                <Label htmlFor="dateEntree" className="text-slate-300">
                  Date d&apos;entrée
                </Label>
                <Input
                  id="dateEntree"
                  type="date"
                  value={formData.dateEntree}
                  onChange={(e) => setFormData({ ...formData, dateEntree: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Montant APL */}
              <div>
                <Label htmlFor="montantAPL" className="text-slate-300">
                  Montant APL (€/mois)
                </Label>
                <Input
                  id="montantAPL"
                  type="number"
                  step="0.01"
                  value={formData.montantAPL}
                  onChange={(e) => setFormData({ ...formData, montantAPL: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  placeholder="0"
                />
              </div>

              {/* Mode de paiement */}
              <div className="md:col-span-2">
                <Label htmlFor="modePaiement" className="text-slate-300">
                  Mode de paiement
                </Label>
                <select
                  id="modePaiement"
                  value={formData.modePaiement}
                  onChange={(e) => setFormData({ ...formData, modePaiement: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                >
                  {MODE_PAIEMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Aperçu calculs */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Loyer mensuel</p>
                  <p className="text-lg font-bold text-amber-400">{formatCurrency(loyerMensuel)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">APL</p>
                  <p className="text-lg font-bold text-purple-400">{formatCurrency(montantAPL)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Reste à charge</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(loyerNetLocataire)}</p>
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={saving}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
