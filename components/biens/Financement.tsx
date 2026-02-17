"use client"

import { useState, useEffect, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Calendar, CreditCard, TrendingUp, Clock, DollarSign, Target, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { KPICard } from "@/components/biens/KPICard"
import { formatCurrency } from "@/lib/calculations"
import { toast } from "sonner"

interface FinancementProps {
  bien: any
}

export function Financement({ bien }: FinancementProps) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    dateDebutCredit: bien.dateDebutCredit
      ? new Date(bien.dateDebutCredit).toISOString().split('T')[0]
      : "",
    mensualiteCredit: bien.mensualiteCredit?.toString() || "0",
    montantCredit: bien.montantCredit?.toString() || "0",
    tauxCredit: bien.tauxCredit?.toString() || "0",
    dureeCredit: bien.dureeCredit?.toString() || "0",
  })

  // Synchroniser le formData quand React Query re-fetch le bien
  useEffect(() => {
    if (!editing) {
      setFormData({
        dateDebutCredit: bien.dateDebutCredit
          ? new Date(bien.dateDebutCredit).toISOString().split('T')[0]
          : "",
        mensualiteCredit: bien.mensualiteCredit?.toString() || "0",
        montantCredit: bien.montantCredit?.toString() || "0",
        tauxCredit: bien.tauxCredit?.toString() || "0",
        dureeCredit: bien.dureeCredit?.toString() || "0",
      })
    }
  }, [bien.dateDebutCredit, bien.mensualiteCredit, bien.montantCredit, bien.tauxCredit, bien.dureeCredit]) // eslint-disable-line react-hooks/exhaustive-deps

  // Calcul de la progression du crédit
  const progressionCredit = useMemo(() => {
    if (!bien.dateDebutCredit || !bien.dureeCredit) return null

    const dateDebut = new Date(bien.dateDebutCredit)
    const maintenant = new Date()
    const moisEcoules = Math.max(
      0,
      (maintenant.getFullYear() - dateDebut.getFullYear()) * 12 +
        (maintenant.getMonth() - dateDebut.getMonth())
    )

    const dureeTotal = parseInt(bien.dureeCredit?.toString() || "0")
    const moisRestants = Math.max(0, dureeTotal - moisEcoules)
    const progression = dureeTotal > 0 ? (moisEcoules / dureeTotal) * 100 : 0

    const montantCredit = parseFloat(bien.montantCredit?.toString() || "0")
    const tauxMensuel = parseFloat(bien.tauxCredit?.toString() || "0") / 100 / 12
    const mensualite = parseFloat(bien.mensualiteCredit?.toString() || "0")

    let capitalRestant = montantCredit
    const capitalRestantDu = bien.capitalRestantDu ? parseFloat(bien.capitalRestantDu.toString()) : null

    if (capitalRestantDu !== null && capitalRestantDu !== undefined) {
      capitalRestant = capitalRestantDu
    } else if (tauxMensuel > 0 && moisEcoules > 0 && mensualite > 0) {
      capitalRestant =
        montantCredit * Math.pow(1 + tauxMensuel, moisEcoules) -
        mensualite * ((Math.pow(1 + tauxMensuel, moisEcoules) - 1) / tauxMensuel)
      capitalRestant = Math.max(0, Math.min(montantCredit, capitalRestant))
    } else if (moisEcoules > 0 && dureeTotal > 0) {
      capitalRestant = montantCredit - (montantCredit / dureeTotal) * moisEcoules
    }

    capitalRestant = Math.max(0, capitalRestant)
    const capitalRembourse = montantCredit - capitalRestant
    const progressionCapital = montantCredit > 0 ? (capitalRembourse / montantCredit) * 100 : 0

    return {
      moisEcoules,
      moisRestants,
      dureeTotal,
      progression: Math.min(100, progression),
      progressionCapital: Math.min(100, Math.max(0, progressionCapital)),
      capitalRembourse: Math.max(0, capitalRembourse),
      capitalRestant,
      montantCredit,
    }
  }, [bien])

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch(`/api/biens/${bien.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateDebutCredit: formData.dateDebutCredit || null,
          mensualiteCredit: parseFloat(formData.mensualiteCredit || "0"),
          montantCredit: parseFloat(formData.montantCredit || "0"),
          tauxCredit: parseFloat(formData.tauxCredit || "0"),
          dureeCredit: parseInt(formData.dureeCredit || "0"),
        }),
      })

      if (!response.ok) throw new Error("Erreur lors de la sauvegarde")

      toast.success("Financement mis à jour avec succès")
      setEditing(false)
      // Invalider le cache React Query pour re-fetcher le bien à jour
      queryClient.invalidateQueries({ queryKey: ['bien', bien.id] })
      queryClient.invalidateQueries({ queryKey: ['biens'] })
    } catch (error) {
      console.error("Erreur sauvegarde financement:", error)
      toast.error("Erreur lors de la sauvegarde du financement")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      dateDebutCredit: bien.dateDebutCredit
        ? new Date(bien.dateDebutCredit).toISOString().split('T')[0]
        : "",
      mensualiteCredit: bien.mensualiteCredit?.toString() || "0",
      montantCredit: bien.montantCredit?.toString() || "0",
      tauxCredit: bien.tauxCredit?.toString() || "0",
      dureeCredit: bien.dureeCredit?.toString() || "0",
    })
    setEditing(false)
  }

  // Mode COMPTANT
  if (bien.typeFinancement === "CASH") {
    return (
      <div className="space-y-6">
        <KPICard
          icon={Wallet}
          label="Bien payé comptant"
          value="100%"
          subtext="Aucun crédit en cours"
          variant="emerald"
          size="lg"
        />
      </div>
    )
  }

  // Mode CRÉDIT
  return (
    <div className="space-y-6">
      {/* Section 1 : Informations du crédit */}
      {!editing && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              Informations du crédit
            </h3>
            <Button
              onClick={() => setEditing(true)}
              variant="outline"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
            >
              Modifier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={DollarSign}
              label="Mensualité"
              value={formatCurrency(bien.mensualiteCredit || 0)}
              subtext="Par mois"
              variant="amber"
              size="sm"
              delay={0}
            />

            <KPICard
              icon={Target}
              label="Montant emprunté"
              value={formatCurrency(bien.montantCredit || 0)}
              subtext="Capital initial"
              variant="sky"
              size="sm"
              delay={100}
            />

            <KPICard
              icon={TrendingUp}
              label="Taux d'intérêt"
              value={`${(parseFloat(bien.tauxCredit?.toString() || "0") || 0).toFixed(2)}%`}
              subtext="Annuel"
              variant="purple"
              size="sm"
              delay={200}
            />

            <KPICard
              icon={Clock}
              label="Durée"
              value={`${bien.dureeCredit || 0} mois`}
              subtext={`${Math.round((bien.dureeCredit || 0) / 12)} ans`}
              variant="slate"
              size="sm"
              delay={300}
            />
          </div>
        </div>
      )}

      {/* Formulaire édition */}
      {editing && (
        <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-slate-200">Modifier les informations du crédit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date début crédit */}
              <div>
                <Label htmlFor="dateDebutCredit" className="text-slate-300">
                  Date de début du crédit
                </Label>
                <Input
                  id="dateDebutCredit"
                  type="date"
                  value={formData.dateDebutCredit}
                  onChange={(e) => setFormData({ ...formData, dateDebutCredit: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Mensualité */}
              <div>
                <Label htmlFor="mensualiteCredit" className="text-slate-300">
                  Mensualité (€)
                </Label>
                <Input
                  id="mensualiteCredit"
                  type="number"
                  step="0.01"
                  value={formData.mensualiteCredit}
                  onChange={(e) => setFormData({ ...formData, mensualiteCredit: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Montant emprunté */}
              <div>
                <Label htmlFor="montantCredit" className="text-slate-300">
                  Montant emprunté (€)
                </Label>
                <Input
                  id="montantCredit"
                  type="number"
                  step="0.01"
                  value={formData.montantCredit}
                  onChange={(e) => setFormData({ ...formData, montantCredit: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Taux d'intérêt */}
              <div>
                <Label htmlFor="tauxCredit" className="text-slate-300">
                  Taux d'intérêt (%)
                </Label>
                <Input
                  id="tauxCredit"
                  type="number"
                  step="0.01"
                  value={formData.tauxCredit}
                  onChange={(e) => setFormData({ ...formData, tauxCredit: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>

              {/* Durée */}
              <div className="md:col-span-2">
                <Label htmlFor="dureeCredit" className="text-slate-300">
                  Durée (mois)
                </Label>
                <Input
                  id="dureeCredit"
                  type="number"
                  value={formData.dureeCredit}
                  onChange={(e) => setFormData({ ...formData, dureeCredit: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
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

      {/* Section 2 : Progression du remboursement */}
      {progressionCredit && (
        <Card className="border-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-slate-200">Progression du remboursement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Barre 1 : Progression temporelle */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Progression temporelle</span>
                <span className="text-sm font-bold text-amber-400">
                  {progressionCredit.progression.toFixed(1)}%
                </span>
              </div>
              <div className="relative w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500 ease-out shadow-lg shadow-amber-500/30"
                  style={{ width: `${progressionCredit.progression}%` }}
                />
              </div>
            </div>

            {/* Barre 2 : Capital remboursé */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Capital remboursé</span>
                <span className="text-sm font-bold text-emerald-400">
                  {progressionCredit.progressionCapital.toFixed(1)}%
                </span>
              </div>
              <div className="relative w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 ease-out shadow-lg shadow-emerald-500/30"
                  style={{ width: `${progressionCredit.progressionCapital}%` }}
                />
              </div>
            </div>

            {/* Grille Montants */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Capital remboursé</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(progressionCredit.capitalRembourse)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Capital restant dû</p>
                <p className="text-2xl font-bold text-amber-400">
                  {formatCurrency(progressionCredit.capitalRestant)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Capital total</p>
                <p className="text-2xl font-bold text-slate-200">
                  {formatCurrency(progressionCredit.montantCredit)}
                </p>
              </div>
            </div>

            {/* Grille Durées */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Mois écoulés</p>
                <p className="text-2xl font-bold text-slate-200">{progressionCredit.moisEcoules}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Mois restants</p>
                <p className="text-2xl font-bold text-amber-400">{progressionCredit.moisRestants}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Durée totale</p>
                <p className="text-2xl font-bold text-slate-200">{progressionCredit.dureeTotal} mois</p>
              </div>
            </div>

            {/* Crédit terminé */}
            {progressionCredit.moisRestants === 0 && progressionCredit.moisEcoules > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm font-medium text-emerald-400">
                  🎉 Félicitations ! Votre crédit est entièrement remboursé.
                </p>
              </div>
            )}

            {/* Date de début */}
            {bien.dateDebutCredit && (
              <div className="pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400">
                  Date de début du crédit :{" "}
                  <span className="font-medium text-slate-200">
                    {new Date(bien.dateDebutCredit).toLocaleDateString("fr-FR")}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 3 : Alerte si pas de date de début */}
      {!bien.dateDebutCredit && (
        <Card className="border-0 bg-amber-500/10 backdrop-blur-xl shadow-2xl border border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-200 mb-1">
                  Date de début du crédit manquante
                </p>
                <p className="text-xs text-amber-300/80">
                  Pour calculer la progression du remboursement, veuillez renseigner la date de début du crédit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
