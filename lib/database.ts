import { createClient } from "./supabase/client"
import type { PlanType } from "./subscription-plans"

// Types
export interface Bien {
  id: string
  userId: string
  nom: string
  adresse: string
  ville: string
  codePostal: string
  typeFinancement: "CREDIT" | "CASH"
  loyerMensuel: number
  chargesMensuelles: number
  taxeFonciere: number
  chargesCopro: number
  assurance: number
  fraisGestion: number
  autresCharges: number
  montantCredit?: number | null
  tauxCredit?: number | null
  dureeCredit?: number | null
  mensualiteCredit?: number | null
  dateDebutCredit?: string | null
  capitalRestantDu?: number | null
  prixAchat?: number | null
  fraisNotaire?: number | null
  travauxInitiaux?: number | null
  autresFrais?: number | null
  dateAcquisition?: string | null
  dateMiseEnLocation?: string | null
  revenusAnterieursOverride?: number | null
  chargesAnterieuresOverride?: number | null
  enrichissementFinancement: boolean
  enrichissementInvestissement: boolean
  enrichissementHistorique: boolean
  enrichissementRentabilite: boolean
  enrichissementCharges: boolean
  enrichissementLocataire: boolean
  enrichissementDepenses: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  userId: string
  email: string
  name?: string | null
  plan: PlanType
  createdAt: string
  updatedAt: string
}

// Fonctions pour les biens
export async function getBiens(userId: string, supabaseClient?: any): Promise<Bien[]> {
  // Si un client est fourni (pour Server Components), l'utiliser
  // Sinon, utiliser le client par défaut (pour Client Components)
  const supabase = supabaseClient || createClient()
  
  const { data, error } = await supabase
    .from("biens")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erreur getBiens:", error)
    throw error
  }

  return (data || []).map(convertBienFromSupabase)
}

export async function getBien(bienId: string): Promise<Bien | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("biens")
    .select("*")
    .eq("id", bienId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null // Bien non trouvé
    }
    console.error("Erreur getBien:", error)
    throw error
  }

  return data ? convertBienFromSupabase(data) : null
}

export async function createBien(userId: string, bien: Partial<Bien>): Promise<Bien> {
  // Convertir typeFinancement en format Supabase
  const typeFinancement = bien.typeFinancement === "CREDIT" ? "credit" : "comptant"

  const bienData: any = {
    user_id: userId,
    nom: bien.nom || "",
    adresse: bien.adresse || "",
    ville: bien.ville || "",
    code_postal: bien.codePostal || "",
    prix_achat: bien.prixAchat ? parseFloat(bien.prixAchat.toString()) : 0,
    frais_notaire: bien.fraisNotaire ? parseFloat(bien.fraisNotaire.toString()) : 0,
    travaux: bien.travauxInitiaux ? parseFloat(bien.travauxInitiaux.toString()) : 0,
    type_financement: typeFinancement,
    montant_credit: bien.montantCredit ? parseFloat(bien.montantCredit.toString()) : null,
    taux_credit: bien.tauxCredit ? parseFloat(bien.tauxCredit.toString()) : null,
    duree_credit: bien.dureeCredit ? parseInt(bien.dureeCredit.toString()) : null,
    mensualite_credit: bien.mensualiteCredit ? parseFloat(bien.mensualiteCredit.toString()) : null,
    apport: 0, // Valeur par défaut, peut être enrichi plus tard
    loyer_mensuel: bien.loyerMensuel ? parseFloat(bien.loyerMensuel.toString()) : 0,
    charges_mensuelles: bien.chargesMensuelles ? parseFloat(bien.chargesMensuelles.toString()) : 0,
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("biens")
    .insert(bienData)
    .select()
    .single()

  if (error) {
    console.error("Erreur createBien:", error)
    throw error
  }

  return convertBienFromSupabase(data)
}

export async function updateBien(bienId: string, updates: Partial<Bien>): Promise<Bien> {
  // Convertir les clés camelCase en snake_case pour Supabase
  const updatesSnakeCase: any = {}
  
  // Mapping manuel pour garantir la précision
  const fieldMapping: Record<string, string> = {
    userId: "user_id",
    codePostal: "code_postal",
    typeFinancement: "type_financement",
    loyerMensuel: "loyer_mensuel",
    chargesMensuelles: "charges_mensuelles",
    taxeFonciere: "taxe_fonciere",
    chargesCopro: "charges_copro",
    fraisGestion: "frais_gestion",
    autresCharges: "autres_charges",
    montantCredit: "montant_credit",
    tauxCredit: "taux_credit",
    dureeCredit: "duree_credit",
    mensualiteCredit: "mensualite_credit",
    dateDebutCredit: "date_debut_credit",
    capitalRestantDu: "capital_restant_du",
    prixAchat: "prix_achat",
    fraisNotaire: "frais_notaire",
    travauxInitiaux: "travaux_initiaux",
    autresFrais: "autres_frais",
    dateAcquisition: "date_acquisition",
    dateMiseEnLocation: "date_mise_en_location",
    revenusAnterieursOverride: "revenus_anterieurs_override",
    chargesAnterieuresOverride: "charges_anterieures_override",
    enrichissementFinancement: "enrichissement_financement",
    enrichissementInvestissement: "enrichissement_investissement",
    enrichissementHistorique: "enrichissement_historique",
    enrichissementRentabilite: "enrichissement_rentabilite",
    enrichissementCharges: "enrichissement_charges",
    enrichissementLocataire: "enrichissement_locataire",
    enrichissementDepenses: "enrichissement_depenses",
  }

  for (const [key, value] of Object.entries(updates)) {
    if (key === "id" || key === "createdAt" || key === "updatedAt") {
      // Ne pas mettre à jour ces champs
      continue
    }
    const snakeKey = fieldMapping[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
    updatesSnakeCase[snakeKey] = value
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("biens")
    .update(updatesSnakeCase)
    .eq("id", bienId)
    .select()
    .single()

  if (error) {
    console.error("Erreur updateBien:", error)
    throw error
  }

  return convertBienFromSupabase(data)
}

export async function deleteBien(bienId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("biens")
    .delete()
    .eq("id", bienId)

  if (error) {
    console.error("Erreur deleteBien:", error)
    throw error
  }
}

// Fonctions pour le profil utilisateur
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("Erreur getUserProfile:", error)
    throw error
  }

  return data ? convertProfileFromSupabase(data) : null
}

export async function createUserProfile(userId: string, email: string, name?: string): Promise<UserProfile> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email: email,
      plan_type: "decouverte"
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error("Erreur createUserProfile:", error)
    throw error
  }

  if (!data) {
    throw new Error("Impossible de créer le profil")
  }

  return convertProfileFromSupabase(data)
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  // Convertir les clés camelCase en snake_case pour Supabase
  const updatesSnakeCase: any = {}
  for (const [key, value] of Object.entries(updates)) {
    if (key === "plan") {
      updatesSnakeCase["plan_type"] = value
    } else if (key === "userId" || key === "id") {
      // Ne pas mettre à jour l'id
      continue
    } else {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
      updatesSnakeCase[snakeKey] = value
    }
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .update(updatesSnakeCase)
    .eq("id", userId)
    .select()
    .single()

  if (error) {
    console.error("Erreur updateUserProfile:", error)
    throw error
  }

  return convertProfileFromSupabase(data)
}

// Fonctions de conversion
function convertBienFromSupabase(data: any): Bien {
  // Fonction helper pour lire snake_case ou camelCase
  const getValue = (snakeKey: string, camelKey: string) => {
    return data[snakeKey] !== undefined ? data[snakeKey] : data[camelKey]
  }

  return {
    id: data.id,
    userId: getValue("user_id", "userId") || "",
    nom: data.nom || "",
    adresse: data.adresse || "",
    ville: data.ville || "",
    codePostal: getValue("code_postal", "codePostal") || "",
    typeFinancement: (() => {
      const value = getValue("type_financement", "typeFinancement")
      if (!value) return "CASH"
      const valLower = String(value).toLowerCase()
      if (valLower === "credit" || valLower === "crédit") return "CREDIT"
      if (valLower === "comptant" || valLower === "cash") return "CASH"
      return value as "CREDIT" | "CASH"
    })(),
    loyerMensuel: parseFloat(getValue("loyer_mensuel", "loyerMensuel")?.toString() || "0"),
    chargesMensuelles: parseFloat(getValue("charges_mensuelles", "chargesMensuelles")?.toString() || "0"),
    taxeFonciere: parseFloat(getValue("taxe_fonciere", "taxeFonciere")?.toString() || "0"),
    chargesCopro: parseFloat(getValue("charges_copro", "chargesCopro")?.toString() || "0"),
    assurance: parseFloat(data.assurance?.toString() || "0"),
    fraisGestion: parseFloat(getValue("frais_gestion", "fraisGestion")?.toString() || "0"),
    autresCharges: parseFloat(getValue("autres_charges", "autresCharges")?.toString() || "0"),
    montantCredit: getValue("montant_credit", "montantCredit") ? parseFloat(getValue("montant_credit", "montantCredit").toString()) : null,
    tauxCredit: getValue("taux_credit", "tauxCredit") ? parseFloat(getValue("taux_credit", "tauxCredit").toString()) : null,
    dureeCredit: getValue("duree_credit", "dureeCredit") || null,
    mensualiteCredit: getValue("mensualite_credit", "mensualiteCredit") ? parseFloat(getValue("mensualite_credit", "mensualiteCredit").toString()) : null,
    dateDebutCredit: getValue("date_debut_credit", "dateDebutCredit") || null,
    capitalRestantDu: getValue("capital_restant_du", "capitalRestantDu") ? parseFloat(getValue("capital_restant_du", "capitalRestantDu").toString()) : null,
    prixAchat: getValue("prix_achat", "prixAchat") ? parseFloat(getValue("prix_achat", "prixAchat").toString()) : null,
    fraisNotaire: getValue("frais_notaire", "fraisNotaire") ? parseFloat(getValue("frais_notaire", "fraisNotaire").toString()) : null,
    travauxInitiaux: getValue("travaux_initiaux", "travauxInitiaux") ? parseFloat(getValue("travaux_initiaux", "travauxInitiaux").toString()) : null,
    autresFrais: getValue("autres_frais", "autresFrais") ? parseFloat(getValue("autres_frais", "autresFrais").toString()) : null,
    dateAcquisition: getValue("date_acquisition", "dateAcquisition") || null,
    dateMiseEnLocation: getValue("date_mise_en_location", "dateMiseEnLocation") || null,
    revenusAnterieursOverride: getValue("revenus_anterieurs_override", "revenusAnterieursOverride") ? parseFloat(getValue("revenus_anterieurs_override", "revenusAnterieursOverride").toString()) : null,
    chargesAnterieuresOverride: getValue("charges_anterieures_override", "chargesAnterieuresOverride") ? parseFloat(getValue("charges_anterieures_override", "chargesAnterieuresOverride").toString()) : null,
    enrichissementFinancement: getValue("enrichissement_financement", "enrichissementFinancement") || false,
    enrichissementInvestissement: getValue("enrichissement_investissement", "enrichissementInvestissement") || false,
    enrichissementHistorique: getValue("enrichissement_historique", "enrichissementHistorique") || false,
    enrichissementRentabilite: getValue("enrichissement_rentabilite", "enrichissementRentabilite") || false,
    enrichissementCharges: getValue("enrichissement_charges", "enrichissementCharges") || false,
    enrichissementLocataire: getValue("enrichissement_locataire", "enrichissementLocataire") || false,
    enrichissementDepenses: getValue("enrichissement_depenses", "enrichissementDepenses") || false,
    createdAt: getValue("created_at", "createdAt") || new Date().toISOString(),
    updatedAt: getValue("updated_at", "updatedAt") || new Date().toISOString(),
  }
}

function convertProfileFromSupabase(data: any): UserProfile {
  return {
    id: data.id,
    userId: data.id, // Le userId est l'id dans la table profiles
    email: data.email || "",
    name: data.name || null, // Peut ne pas exister
    plan: (data.plan_type || data.plan || "decouverte") as PlanType, // Support plan_type et plan pour compatibilité
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  }
}
