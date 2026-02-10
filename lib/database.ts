import { createClient } from "./supabase/client"
import type { PlanType } from "./stripe"
import { PLANS, canAddBien, getPlanMaxBiens } from "./stripe"
import { logger } from "./logger"

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

export interface Lot {
  id: string
  bienId: string
  userId: string
  numeroLot: string
  superficie?: number | null
  loyerMensuel: number
  estLotDefaut: boolean
  createdAt: string
  updatedAt: string
}

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'payment_failed' | 'trialing' | null

export interface UserProfile {
  id: string
  userId: string
  email: string
  name?: string | null
  plan: PlanType
  currency?: string
  rentPaymentDay?: number
  paymentDelayDays?: number
  emailAlertsEnabled?: boolean
  appNotificationsEnabled?: boolean
  // Champs Stripe
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  subscriptionStatus?: SubscriptionStatus
  createdAt: string
  updatedAt: string
}

// =====================================================
// BIENS - Opérations CRUD
// =====================================================

/**
 * Récupère tous les biens immobiliers d'un utilisateur
 * 
 * Les biens sont triés par date de création (plus récent en premier).
 * 
 * @param userId - L'ID de l'utilisateur propriétaire des biens
 * @param supabaseClient - Client Supabase optionnel (pour Server Components)
 * @returns Promise<Bien[]> - Liste des biens de l'utilisateur
 * @throws {Error} Si la requête Supabase échoue
 * 
 * @example
 * // Côté client
 * const biens = await getBiens('user-123')
 * console.log(`${biens.length} biens trouvés`)
 * 
 * @example
 * // Côté serveur
 * const supabase = await createClient()
 * const biens = await getBiens(user.id, supabase)
 */
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

/**
 * Récupère un bien immobilier par son ID
 * 
 * @param bienId - L'ID unique (UUID) du bien
 * @param supabaseClient - Client Supabase optionnel (pour Server Components)
 * @returns Promise<Bien | null> - Le bien trouvé ou null si non trouvé
 * @throws {Error} Si la requête Supabase échoue (autre que "non trouvé")
 * 
 * @example
 * const bien = await getBien('bien-uuid-123')
 * if (bien) {
 *   console.log(`Bien: ${bien.nom}`)
 * }
 */
export async function getBien(bienId: string, supabaseClient?: any): Promise<Bien | null> {
  // Si un client est fourni (pour Server Components), l'utiliser
  // Sinon, utiliser le client par défaut (pour Client Components)
  const supabase = supabaseClient || createClient()
  
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

/**
 * Crée un nouveau bien immobilier pour un utilisateur
 * 
 * Vérifie automatiquement la limite de biens selon le plan de l'utilisateur
 * avant de créer le bien.
 * 
 * @param userId - L'ID du propriétaire du bien
 * @param bien - Les données du bien à créer (Partial<Bien>)
 * @returns Promise<Bien> - Le bien créé avec son ID généré
 * @throws {Error} Si la limite du plan est atteinte
 * @throws {Error} Si la création échoue dans Supabase
 * 
 * @example
 * const nouveauBien = await createBien('user-123', {
 *   nom: 'Appartement Paris 11',
 *   prixAchat: 250000,
 *   loyerMensuel: 1200,
 *   typeFinancement: 'CREDIT'
 * })
 * console.log(`Bien créé: ${nouveauBien.id}`)
 */
export async function createBien(userId: string, bien: Partial<Bien>): Promise<Bien> {
  const supabase = createClient()
  
  // Vérifier la limite de biens selon le plan
  const profile = await getUserProfile(userId, supabase)
  const existingBiens = await getBiens(userId, supabase)
  
  const planType = (profile?.plan || 'gratuit') as PlanType
  const currentCount = existingBiens?.length || 0
  
  if (!canAddBien(planType, currentCount)) {
    const maxBiens = getPlanMaxBiens(planType)
    const planName = PLANS[planType].name
    throw new Error(`Limite de ${maxBiens} biens atteinte pour le plan ${planName}. Passez au plan supérieur pour en créer plus.`)
  }

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
    travaux_initiaux: bien.travauxInitiaux ? parseFloat(bien.travauxInitiaux.toString()) : 0,
    type_financement: typeFinancement,
    montant_credit: bien.montantCredit ? parseFloat(bien.montantCredit.toString()) : null,
    taux_credit: bien.tauxCredit ? parseFloat(bien.tauxCredit.toString()) : null,
    duree_credit: bien.dureeCredit ? parseInt(bien.dureeCredit.toString()) : null,
    mensualite_credit: bien.mensualiteCredit ? parseFloat(bien.mensualiteCredit.toString()) : null,
    apport: 0, // Valeur par défaut, peut être enrichi plus tard
    loyer_mensuel: bien.loyerMensuel ? parseFloat(bien.loyerMensuel.toString()) : 0,
    taxe_fonciere: bien.taxeFonciere ? parseFloat(bien.taxeFonciere.toString()) : 0,
    charges_copro: bien.chargesCopro ? parseFloat(bien.chargesCopro.toString()) : 0,
    assurance: bien.assurance ? parseFloat(bien.assurance.toString()) : 0,
    frais_gestion: bien.fraisGestion ? parseFloat(bien.fraisGestion.toString()) : 0,
    autres_charges: bien.autresCharges ? parseFloat(bien.autresCharges.toString()) : 0,
    // Calculer charges_mensuelles comme somme des charges individuelles
    charges_mensuelles: (
      (bien.taxeFonciere ? parseFloat(bien.taxeFonciere.toString()) : 0) +
      (bien.chargesCopro ? parseFloat(bien.chargesCopro.toString()) : 0) +
      (bien.assurance ? parseFloat(bien.assurance.toString()) : 0) +
      (bien.fraisGestion ? parseFloat(bien.fraisGestion.toString()) : 0) +
      (bien.autresCharges ? parseFloat(bien.autresCharges.toString()) : 0)
    ) || (bien.chargesMensuelles ? parseFloat(bien.chargesMensuelles.toString()) : 0),
    date_debut_credit: bien.dateDebutCredit ? new Date(bien.dateDebutCredit).toISOString() : null,
  }
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

/**
 * Met à jour un bien immobilier existant
 * 
 * Seuls les champs fournis dans `updates` seront modifiés.
 * Les champs `id`, `createdAt` et `updatedAt` sont ignorés.
 * 
 * @param bienId - L'ID du bien à mettre à jour
 * @param updates - Les champs à modifier (Partial<Bien>)
 * @returns Promise<Bien> - Le bien mis à jour
 * @throws {Error} Si la mise à jour échoue dans Supabase
 * 
 * @example
 * const bienModifie = await updateBien('bien-uuid-123', {
 *   loyerMensuel: 1300,
 *   chargesCopro: 100
 * })
 */
export async function updateBien(bienId: string, updates: Partial<Bien>, supabaseClient?: any): Promise<Bien> {
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

  // Utiliser le client serveur si fourni, sinon fallback sur le client navigateur
  const supabase = supabaseClient || createClient()
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

/**
 * Supprime un bien immobilier
 * 
 * Cette opération supprime également en cascade :
 * - Les locataires associés
 * - Les loyers associés
 * - Les quittances associées
 * - Les investissements secondaires associés
 * 
 * @param bienId - L'ID du bien à supprimer
 * @returns Promise<void>
 * @throws {Error} Si la suppression échoue dans Supabase
 * 
 * @example
 * await deleteBien('bien-uuid-123')
 * console.log('Bien supprimé avec succès')
 */
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

// =====================================================
// PROFIL UTILISATEUR
// =====================================================

/**
 * Récupère le profil d'un utilisateur
 * 
 * Le profil contient les informations personnelles, le plan d'abonnement
 * et les préférences de l'utilisateur.
 * 
 * @param userId - L'ID de l'utilisateur (correspond à auth.users.id)
 * @param supabaseClient - Client Supabase optionnel (pour Server Components)
 * @returns Promise<UserProfile | null> - Le profil ou null si non trouvé
 * @throws {Error} Si la requête Supabase échoue
 * 
 * @example
 * const profile = await getUserProfile(user.id)
 * if (profile) {
 *   console.log(`Plan: ${profile.plan}`) // 'gratuit' | 'essentiel' | 'premium'
 * }
 */
export async function getUserProfile(userId: string, supabaseClient?: any): Promise<UserProfile | null> {
  // Si un client est fourni (pour Server Components), l'utiliser
  // Sinon, utiliser le client par défaut (pour Client Components)
  const supabase = supabaseClient || createClient()
  
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

/**
 * Crée un nouveau profil utilisateur
 * 
 * Appelé automatiquement après l'inscription pour créer le profil
 * avec le plan "découverte" par défaut.
 * 
 * @param userId - L'ID de l'utilisateur (auth.users.id)
 * @param email - L'email de l'utilisateur
 * @param name - Nom optionnel de l'utilisateur
 * @returns Promise<UserProfile> - Le profil créé
 * @throws {Error} Si la création échoue
 * 
 * @example
 * const profile = await createUserProfile(user.id, 'test@example.com', 'Jean Dupont')
 */
export async function createUserProfile(userId: string, email: string, name?: string): Promise<UserProfile> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email: email,
      plan_type: "gratuit"
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
  
  // Mapping explicite pour garantir la précision
  const fieldMapping: Record<string, string> = {
    name: "name",
    plan: "plan_type",
    currency: "currency",
    rentPaymentDay: "rent_payment_day",
    paymentDelayDays: "payment_delay_days",
    emailAlertsEnabled: "email_alerts_enabled",
    appNotificationsEnabled: "app_notifications_enabled",
  }
  
  for (const [key, value] of Object.entries(updates)) {
    if (key === "userId" || key === "id") {
      // Ne pas mettre à jour l'id
      continue
    }
    
    // Utiliser le mapping explicite si disponible, sinon conversion automatique
    const snakeKey = fieldMapping[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
    updatesSnakeCase[snakeKey] = value
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
    plan: (data.plan_type || data.plan || "gratuit") as PlanType, // Support plan_type et plan pour compatibilité
    currency: data.currency || undefined,
    rentPaymentDay: data.rent_payment_day || data.rentPaymentDay || undefined,
    paymentDelayDays: data.payment_delay_days || data.paymentDelayDays || undefined,
    emailAlertsEnabled: data.email_alerts_enabled !== undefined ? data.email_alerts_enabled : (data.emailAlertsEnabled !== undefined ? data.emailAlertsEnabled : undefined),
    appNotificationsEnabled: data.app_notifications_enabled !== undefined ? data.app_notifications_enabled : (data.appNotificationsEnabled !== undefined ? data.appNotificationsEnabled : undefined),
    // Champs Stripe
    stripeCustomerId: data.stripe_customer_id || null,
    stripeSubscriptionId: data.stripe_subscription_id || null,
    subscriptionStatus: data.subscription_status || null,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  }
}

// =====================================================
// LOCATAIRE
// =====================================================

export interface Locataire {
  id: string
  bienId: string // Garder pour compatibilité temporaire
  lotId: string // NOUVEAU : le locataire appartient à un lot
  nom: string
  prenom: string
  email?: string | null
  telephone?: string | null
  dateEntree?: string | null
  montantAPL: number
  modePaiement: string
  createdAt: string
  updatedAt: string
}

/**
 * Récupère le locataire associé à un bien
 * 
 * Un bien peut avoir au maximum un locataire actif.
 * 
 * @param bienId - L'ID du bien
 * @param supabaseClient - Client Supabase optionnel
 * @returns Promise<Locataire | null> - Le locataire ou null si aucun
 * 
 * @example
 * const locataire = await getLocataire('bien-uuid-123')
 * if (locataire) {
 *   console.log(`Locataire: ${locataire.prenom} ${locataire.nom}`)
 * }
 */
export async function getLocataire(bienId: string, supabaseClient?: any): Promise<Locataire | null> {
  const supabase = supabaseClient || createClient()
  
  const { data, error } = await supabase
    .from('locataires')
    .select('*')
    .eq('bien_id', bienId)
    .maybeSingle()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Erreur getLocataire:', error)
    return null
  }
  
  if (!data) return null
  
  return {
    id: data.id,
    bienId: data.bien_id || data.bienId,
    nom: data.nom || "",
    prenom: data.prenom || "",
    email: data.email || null,
    telephone: data.telephone || null,
    dateEntree: data.date_entree || data.dateEntree || null,
    montantAPL: parseFloat(data.montant_apl?.toString() || data.montantAPL?.toString() || "0"),
    modePaiement: data.mode_paiement || data.modePaiement || "virement",
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  }
}

/**
 * Crée ou met à jour le locataire d'un bien (upsert)
 * 
 * Si un locataire existe déjà pour ce bien, il est mis à jour.
 * Sinon, un nouveau locataire est créé.
 * 
 * @param bienId - L'ID du bien
 * @param locataireData - Les données du locataire
 * @param supabaseClient - Client Supabase optionnel
 * @returns Promise<Locataire> - Le locataire créé ou mis à jour
 * @throws {Error} Si l'opération échoue
 * 
 * @example
 * const locataire = await upsertLocataire('bien-uuid-123', {
 *   nom: 'Martin',
 *   prenom: 'Jean',
 *   email: 'jean.martin@example.com',
 *   montantAPL: 200,
 *   modePaiement: 'virement'
 * })
 */
export async function upsertLocataire(bienId: string, locataireData: Partial<Locataire>, supabaseClient?: any): Promise<Locataire> {
  const supabase = supabaseClient || createClient()
  
  const dataToUpsert: any = {
    bien_id: bienId,
    nom: locataireData.nom || "",
    prenom: locataireData.prenom || "",
    email: locataireData.email || null,
    telephone: locataireData.telephone || null,
    date_entree: locataireData.dateEntree ? new Date(locataireData.dateEntree).toISOString() : null,
    montant_apl: locataireData.montantAPL ? parseFloat(locataireData.montantAPL.toString()) : 0,
    mode_paiement: locataireData.modePaiement || "virement",
  }
  
  const { data, error } = await supabase
    .from('locataires')
    .upsert(dataToUpsert, {
      onConflict: 'bien_id'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Erreur upsertLocataire:', error)
    throw error
  }
  
  return {
    id: data.id,
    bienId: data.bien_id || data.bienId,
    nom: data.nom || "",
    prenom: data.prenom || "",
    email: data.email || null,
    telephone: data.telephone || null,
    dateEntree: data.date_entree || data.dateEntree || null,
    montantAPL: parseFloat(data.montant_apl?.toString() || data.montantAPL?.toString() || "0"),
    modePaiement: data.mode_paiement || data.modePaiement || "virement",
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  }
}

// =====================================================
// LOYERS
// =====================================================

export interface Loyer {
  id: string
  bienId: string
  annee: number
  mois: number // 0-11
  montantLocataire: number
  montantAPL: number
  payeLocataire: boolean
  payeAPL: boolean
  datePaiementLocataire?: string | null
  datePaiementAPL?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Récupère tous les loyers d'un bien pour une année donnée
 * 
 * Les loyers sont triés par mois (0 = Janvier, 11 = Décembre).
 * 
 * @param bienId - L'ID du bien
 * @param annee - L'année (ex: 2024)
 * @param supabaseClient - Client Supabase optionnel
 * @returns Promise<Loyer[]> - Liste des loyers de l'année
 * 
 * @example
 * const loyers = await getLoyers('bien-uuid-123', 2024)
 * const totalPercu = loyers
 *   .filter(l => l.payeLocataire)
 *   .reduce((sum, l) => sum + l.montantLocataire, 0)
 */
export async function getLoyers(bienId: string, annee: number, supabaseClient?: any): Promise<Loyer[]> {
  const supabase = supabaseClient || createClient()
  
  const { data, error } = await supabase
    .from('loyers')
    .select('*')
    .eq('bien_id', bienId)
    .eq('annee', annee)
    .order('mois', { ascending: true })
  
  if (error) {
    console.error('Erreur getLoyers:', error)
    return []
  }
  
  if (!data) return []
  
  return data.map((l: any) => ({
    id: l.id,
    bienId: l.bien_id || l.bienId,
    annee: l.annee,
    mois: l.mois,
    montantLocataire: parseFloat(l.montant_locataire?.toString() || l.montantLocataire?.toString() || "0"),
    montantAPL: parseFloat(l.montant_apl?.toString() || l.montantAPL?.toString() || "0"),
    payeLocataire: l.paye_locataire || l.payeLocataire || false,
    payeAPL: l.paye_apl || l.payeAPL || false,
    datePaiementLocataire: l.date_paiement_locataire || l.datePaiementLocataire || null,
    datePaiementAPL: l.date_paiement_apl || l.datePaiementAPL || null,
    createdAt: l.created_at || l.createdAt || new Date().toISOString(),
    updatedAt: l.updated_at || l.updatedAt || new Date().toISOString(),
  }))
}

/**
 * Crée ou met à jour un loyer pour un mois donné (upsert)
 * 
 * La clé unique est la combinaison (bien_id, annee, mois).
 * Si un loyer existe déjà pour ce mois, il est mis à jour.
 * 
 * @param bienId - L'ID du bien
 * @param annee - L'année (ex: 2024)
 * @param mois - Le mois (0-11, où 0 = Janvier)
 * @param paiement - Les informations de paiement
 * @param paiement.montantLocataire - Montant payé par le locataire
 * @param paiement.montantAPL - Montant de l'APL
 * @param paiement.payeLocataire - Si le locataire a payé
 * @param paiement.payeAPL - Si l'APL a été versée
 * @param supabaseClient - Client Supabase optionnel
 * @returns Promise<Loyer> - Le loyer créé ou mis à jour
 * @throws {Error} Si l'opération échoue
 * 
 * @example
 * const loyer = await upsertLoyer('bien-uuid-123', 2024, 0, {
 *   montantLocataire: 1000,
 *   montantAPL: 200,
 *   payeLocataire: true,
 *   payeAPL: true
 * })
 */
export async function upsertLoyer(
  bienId: string, 
  annee: number, 
  mois: number, 
  paiement: { 
    montantLocataire: number
    montantAPL: number
    payeLocataire: boolean
    payeAPL: boolean
  },
  supabaseClient?: any
): Promise<Loyer> {
  const supabase = supabaseClient || createClient()
  
  const now = new Date().toISOString()
  
  const dataToUpsert: any = {
    bien_id: bienId,
    annee,
    mois,
    montant_locataire: paiement.montantLocataire,
    montant_apl: paiement.montantAPL,
    paye_locataire: paiement.payeLocataire,
    paye_apl: paiement.payeAPL,
    date_paiement_locataire: paiement.payeLocataire ? now : null,
    date_paiement_apl: paiement.payeAPL ? now : null,
  }
  
  const { data, error } = await supabase
    .from('loyers')
    .upsert(dataToUpsert, {
      onConflict: 'bien_id,annee,mois'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Erreur upsertLoyer:', error)
    throw error
  }
  
  return {
    id: data.id,
    bienId: data.bien_id || data.bienId,
    annee: data.annee,
    mois: data.mois,
    montantLocataire: parseFloat(data.montant_locataire?.toString() || data.montantLocataire?.toString() || "0"),
    montantAPL: parseFloat(data.montant_apl?.toString() || data.montantAPL?.toString() || "0"),
    payeLocataire: data.paye_locataire || data.payeLocataire || false,
    payeAPL: data.paye_apl || data.payeAPL || false,
    datePaiementLocataire: data.date_paiement_locataire || data.datePaiementLocataire || null,
    datePaiementAPL: data.date_paiement_apl || data.datePaiementAPL || null,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  }
}

// ============================================
// INVESTISSEMENTS SECONDAIRES
// ============================================

export interface InvestissementSecondaire {
  id: string
  bienId: string
  date: string
  description: string
  montant: number
  createdAt?: string
  updatedAt?: string
}

/**
 * Récupère tous les investissements secondaires d'un bien
 */
export async function getInvestissementsSecondaires(
  bienId: string
): Promise<InvestissementSecondaire[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('investissements_secondaires')
    .select('*')
    .eq('bien_id', bienId)
    .order('date', { ascending: false })
  
  if (error) {
    logger.error('[getInvestissementsSecondaires] Erreur détaillée:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    throw new Error(`Impossible de récupérer les investissements secondaires: ${error.message || error.code || 'erreur inconnue'}`)
  }
  
  return (data || []).map((inv) => ({
    id: inv.id,
    bienId: inv.bien_id,
    date: inv.date,
    description: inv.description,
    montant: parseFloat(inv.montant?.toString() || '0'),
    createdAt: inv.created_at,
    updatedAt: inv.updated_at,
  }))
}

/**
 * Crée un nouvel investissement secondaire
 */
export async function createInvestissementSecondaire(
  bienId: string,
  data: {
    date: string
    description: string
    montant: number
  }
): Promise<InvestissementSecondaire> {
  const supabase = createClient()
  
  const { data: result, error } = await supabase
    .from('investissements_secondaires')
    .insert({
      bien_id: bienId,
      date: data.date,
      description: data.description,
      montant: data.montant,
    })
    .select()
    .single()
  
  if (error) {
    logger.error('[createInvestissementSecondaire] Erreur détaillée:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    throw new Error(`Impossible de créer l'investissement secondaire: ${error.message || error.code || 'erreur inconnue'}`)
  }
  
  return {
    id: result.id,
    bienId: result.bien_id,
    date: result.date,
    description: result.description,
    montant: parseFloat(result.montant?.toString() || '0'),
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  }
}

/**
 * Supprime un investissement secondaire
 */
export async function deleteInvestissementSecondaire(
  id: string
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('investissements_secondaires')
    .delete()
    .eq('id', id)
  
  if (error) {
    logger.error('[deleteInvestissementSecondaire] Erreur détaillée:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    throw new Error(`Impossible de supprimer l'investissement secondaire: ${error.message || error.code || 'erreur inconnue'}`)
  }
}

// ==================== QUITTANCES ====================

export interface QuittanceDB {
  id: string
  userId: string
  bienId: string
  mois: number
  annee: number
  locataireNom: string
  locatairePrenom: string
  locataireEmail: string | null
  montantLocataire: number
  montantAPL: number
  montantTotal: number
  datePayeLocataire: string
  datePayeAPL: string | null
  modePaiement: string
  emailEnvoye: boolean
  dateEnvoiEmail: string | null
  pdfUrl: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Crée une nouvelle quittance de loyer
 * 
 * Une quittance est un document attestant du paiement d'un loyer.
 * Elle est générée après réception du paiement complet.
 * 
 * @param data - Les données de la quittance
 * @param data.bienId - L'ID du bien concerné
 * @param data.mois - Le mois (1-12)
 * @param data.annee - L'année
 * @param data.locataireNom - Nom du locataire
 * @param data.locatairePrenom - Prénom du locataire
 * @param data.locataireEmail - Email du locataire (optionnel)
 * @param data.montantLocataire - Montant payé par le locataire
 * @param data.montantAPL - Montant de l'APL
 * @param data.montantTotal - Montant total (locataire + APL)
 * @param data.datePayeLocataire - Date de paiement (format YYYY-MM-DD)
 * @param data.datePayeAPL - Date de versement APL (optionnel)
 * @param data.modePaiement - Mode de paiement (virement, chèque, espèces, prélèvement)
 * @returns Promise<QuittanceDB> - La quittance créée
 * @throws {Error} Si une quittance existe déjà pour ce mois (code: unique_quittance_bien_mois_annee)
 * 
 * @example
 * const quittance = await createQuittance({
 *   bienId: 'bien-uuid-123',
 *   mois: 1,
 *   annee: 2024,
 *   locataireNom: 'Martin',
 *   locatairePrenom: 'Jean',
 *   locataireEmail: 'jean@example.com',
 *   montantLocataire: 1000,
 *   montantAPL: 200,
 *   montantTotal: 1200,
 *   datePayeLocataire: '2024-01-05',
 *   datePayeAPL: '2024-01-10',
 *   modePaiement: 'virement'
 * })
 */
export async function createQuittance(
  data: {
    bienId: string
    userId: string
    mois: number
    annee: number
    locataireNom: string
    locatairePrenom: string
    locataireEmail: string | null
    montantLocataire: number
    montantAPL: number
    montantTotal: number
    datePayeLocataire: string
    datePayeAPL: string | null
    modePaiement: string
    emailEnvoye?: boolean
    dateEnvoiEmail?: string | null
  },
  supabaseClient?: any
): Promise<QuittanceDB> {
  // Utiliser le client serveur si fourni, sinon fallback sur le client navigateur
  const supabase = supabaseClient || createClient()
  
  const { data: quittance, error } = await supabase
    .from('quittances')
    .insert({
      user_id: data.userId,
      bien_id: data.bienId,
      mois: data.mois,
      annee: data.annee,
      locataire_nom: data.locataireNom,
      locataire_prenom: data.locatairePrenom,
      locataire_email: data.locataireEmail,
      montant_locataire: data.montantLocataire,
      montant_apl: data.montantAPL,
      montant_total: data.montantTotal,
      date_paye_locataire: data.datePayeLocataire,
      date_paye_apl: data.datePayeAPL,
      mode_paiement: data.modePaiement,
      email_envoye: data.emailEnvoye || false,
      date_envoi_email: data.dateEnvoiEmail || null,
    })
    .select()
    .single()
  
  if (error) {
    logger.error('[createQuittance] Erreur:', error)
    throw error
  }
  
  return convertQuittanceFromSupabase(quittance)
}

/**
 * Récupère toutes les quittances d'un bien
 * 
 * Les quittances sont triées par date (plus récentes en premier).
 * 
 * @param bienId - L'ID du bien
 * @returns Promise<QuittanceDB[]> - Liste des quittances
 * @throws {Error} Si la requête échoue
 * 
 * @example
 * const quittances = await getQuittancesByBien('bien-uuid-123')
 * console.log(`${quittances.length} quittances générées`)
 */
export async function getQuittancesByBien(bienId: string, supabaseClient?: any): Promise<QuittanceDB[]> {
  const supabase = supabaseClient || createClient()
  
  const { data: quittances, error } = await supabase
    .from('quittances')
    .select('*')
    .eq('bien_id', bienId)
    .order('annee', { ascending: false })
    .order('mois', { ascending: false })
  
  if (error) {
    logger.error('[getQuittancesByBien] Erreur:', error)
    throw error
  }
  
  return (quittances || []).map(convertQuittanceFromSupabase)
}

export async function getQuittancesByUser(userId: string, supabaseClient?: any): Promise<QuittanceDB[]> {
  const supabase = supabaseClient || createClient()
  
  const { data: quittances, error } = await supabase
    .from('quittances')
    .select(`
      *,
      biens (
        nom,
        adresse,
        ville,
        code_postal
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    logger.error('[getQuittancesByUser] Erreur:', error)
    throw error
  }
  
  return (quittances || []).map(convertQuittanceFromSupabase)
}

export async function getQuittance(bienId: string, mois: number, annee: number, supabaseClient?: any): Promise<QuittanceDB | null> {
  const supabase = supabaseClient || createClient()
  
  const { data: quittance, error } = await supabase
    .from('quittances')
    .select('*')
    .eq('bien_id', bienId)
    .eq('mois', mois)
    .eq('annee', annee)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Pas trouvé
    logger.error('[getQuittance] Erreur:', error)
    throw error
  }
  
  return quittance ? convertQuittanceFromSupabase(quittance) : null
}

export async function updateQuittanceEmailStatus(
  quittanceId: string,
  emailEnvoye: boolean,
  dateEnvoiEmail?: string,
  supabaseClient?: any
): Promise<void> {
  const supabase = supabaseClient || createClient()
  
  const { error } = await supabase
    .from('quittances')
    .update({
      email_envoye: emailEnvoye,
      date_envoi_email: dateEnvoiEmail || new Date().toISOString(),
    })
    .eq('id', quittanceId)
  
  if (error) {
    logger.error('[updateQuittanceEmailStatus] Erreur:', error)
    throw error
  }
}

function convertQuittanceFromSupabase(data: any): QuittanceDB {
  return {
    id: data.id,
    userId: data.user_id,
    bienId: data.bien_id,
    mois: data.mois,
    annee: data.annee,
    locataireNom: data.locataire_nom,
    locatairePrenom: data.locataire_prenom,
    locataireEmail: data.locataire_email,
    montantLocataire: parseFloat(data.montant_locataire?.toString() || '0'),
    montantAPL: parseFloat(data.montant_apl?.toString() || '0'),
    montantTotal: parseFloat(data.montant_total?.toString() || '0'),
    datePayeLocataire: data.date_paye_locataire,
    datePayeAPL: data.date_paye_apl,
    modePaiement: data.mode_paiement,
    emailEnvoye: data.email_envoye || false,
    dateEnvoiEmail: data.date_envoi_email,
    pdfUrl: data.pdf_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}