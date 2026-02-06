import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/database'
import { PLANS } from '@/lib/stripe'
import { logger } from '@/lib/logger'
// Papa est importé dynamiquement pour réduire le bundle initial

interface CSVRow {
  nom?: string
  adresse?: string
  codepostal?: string
  ville?: string
  typefinancement?: string
  prixachat?: string
  fraisnotaire?: string
  travauxinitiaux?: string
  autresfrais?: string
  montantcredit?: string
  tauxcredit?: string
  dureecredit?: string
  mensualitecredit?: string
  loyermensuel?: string
  taxefonciere?: string
  chargescopro?: string
  assurance?: string
  fraisgestion?: string
  autrescharges?: string
  dateacquisition?: string
  datemiseenlocation?: string
  datedebutcredit?: string
}

export async function POST(request: NextRequest) {
  try {
    // 1. VÉRIFIER L'AUTHENTIFICATION
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('[API import-csv] Tentative non authentifiée')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    logger.info('[API import-csv] Import CSV demandé', { userId: user.id })
    
    // 2. VÉRIFIER LE PLAN ET LA LIMITE DE BIENS
    const profile = await getUserProfile(user.id, supabase)
    const plan = profile?.plan || 'decouverte'
    const maxBiens = PLANS[plan as keyof typeof PLANS]?.maxBiens
    
    // Récupérer le nombre de biens actuels
    const { count: currentBiensCount } = await supabase
      .from('biens')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    // 3. RÉCUPÉRER LE FICHIER
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }
    
    // Vérifier l'extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Le fichier doit être au format CSV' },
        { status: 400 }
      )
    }
    
    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux (max 5MB)' },
        { status: 400 }
      )
    }
    
    // 4. LIRE LE FICHIER
    const text = await file.text()
    
    // 5. PARSER LE CSV
    // Import dynamique de PapaParse pour réduire le bundle initial (~40KB)
    const Papa = await import('papaparse')
    
    const parseResult = Papa.default.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normaliser les headers : minuscules, sans espaces, sans accents
        return header
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
          .replace(/\s+/g, '') // Supprimer espaces
          .replace(/[^a-z0-9]/g, '') // Garder que alphanum
      },
    })
    
    if (parseResult.errors.length > 0) {
      logger.error('[API import-csv] Erreurs de parsing:', parseResult.errors)
      return NextResponse.json(
        { error: 'Erreur lors de la lecture du CSV', details: parseResult.errors.slice(0, 5) },
        { status: 400 }
      )
    }
    
    const rows = parseResult.data
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Le fichier CSV est vide' },
        { status: 400 }
      )
    }
    
    // Limiter à 50 biens par import
    if (rows.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 biens par import' },
        { status: 400 }
      )
    }
    
    // Vérifier la limite du plan
    if (maxBiens !== null && (currentBiensCount || 0) + rows.length > maxBiens) {
      const restants = maxBiens - (currentBiensCount || 0)
      return NextResponse.json(
        { 
          error: `Limite du plan ${plan} atteinte. Vous pouvez importer maximum ${restants} bien(s) supplémentaire(s).`,
          limit: restants
        },
        { status: 400 }
      )
    }
    
    // 6. VALIDER ET PRÉPARER LES DONNÉES
    const biensToInsert = []
    const errors: Array<{ row: number; field: string; error: string }> = []
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 car ligne 1 = header, et index commence à 0
      
      // Validation : nom obligatoire
      if (!row.nom || row.nom.trim() === '') {
        errors.push({ row: rowNum, field: 'nom', error: 'Le nom est obligatoire' })
        continue
      }
      
      // Parser les nombres avec validation
      const parseNumber = (value: string | undefined, fieldName: string): number | null => {
        if (!value || value.trim() === '') return null
        const cleaned = value.replace(/[€\s]/g, '').replace(',', '.')
        const num = parseFloat(cleaned)
        if (isNaN(num)) {
          errors.push({ row: rowNum, field: fieldName, error: `Valeur numérique invalide: ${value}` })
          return null
        }
        return num
      }
      
      // Parser les dates
      const parseDate = (value: string | undefined): string | null => {
        if (!value || value.trim() === '') return null
        // Essayer différents formats
        const formats = [
          /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
          /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
          /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
        ]
        
        for (const format of formats) {
          const match = value.match(format)
          if (match) {
            if (format.source.startsWith('^(\\d{4})')) {
              // YYYY-MM-DD
              return value
            } else {
              // DD/MM/YYYY ou DD-MM-YYYY
              return `${match[3]}-${match[2]}-${match[1]}`
            }
          }
        }
        return null
      }
      
      // Déterminer le type de financement
      const typeFinancementRaw = row.typefinancement?.toLowerCase().trim() || ''
      const typeFinancement = 
        typeFinancementRaw === 'credit' || 
        typeFinancementRaw === 'crédit' || 
        typeFinancementRaw === 'emprunt' 
          ? 'credit' 
          : 'comptant'
      
      // Calculer charges mensuelles
      const taxeFonciere = parseNumber(row.taxefonciere, 'taxeFonciere') || 0
      const chargesCopro = parseNumber(row.chargescopro, 'chargesCopro') || 0
      const assurance = parseNumber(row.assurance, 'assurance') || 0
      const fraisGestion = parseNumber(row.fraisgestion, 'fraisGestion') || 0
      const autresCharges = parseNumber(row.autrescharges, 'autresCharges') || 0
      const chargesMensuelles = taxeFonciere + chargesCopro + assurance + fraisGestion + autresCharges
      
      // Préparer les données pour insertion
      const bien = {
        user_id: user.id,
        nom: row.nom.trim().substring(0, 100), // Limiter la longueur
        adresse: (row.adresse?.trim() || '').substring(0, 200),
        code_postal: (row.codepostal?.trim() || '').substring(0, 10),
        ville: (row.ville?.trim() || '').substring(0, 100),
        type_financement: typeFinancement,
        prix_achat: parseNumber(row.prixachat, 'prixAchat'),
        frais_notaire: parseNumber(row.fraisnotaire, 'fraisNotaire'),
        travaux_initiaux: parseNumber(row.travauxinitiaux, 'travauxInitiaux'),
        autres_frais: parseNumber(row.autresfrais, 'autresFrais'),
        montant_credit: parseNumber(row.montantcredit, 'montantCredit'),
        taux_credit: parseNumber(row.tauxcredit, 'tauxCredit'),
        duree_credit: parseNumber(row.dureecredit, 'dureeCredit'),
        mensualite_credit: parseNumber(row.mensualitecredit, 'mensualiteCredit'),
        loyer_mensuel: parseNumber(row.loyermensuel, 'loyerMensuel') || 0,
        taxe_fonciere: taxeFonciere,
        charges_copro: chargesCopro,
        assurance: assurance,
        frais_gestion: fraisGestion,
        autres_charges: autresCharges,
        charges_mensuelles: chargesMensuelles,
        date_acquisition: parseDate(row.dateacquisition),
        date_mise_en_location: parseDate(row.datemiseenlocation),
        date_debut_credit: parseDate(row.datedebutcredit),
        apport: 0,
      }
      
      biensToInsert.push(bien)
    }
    
    // Si toutes les lignes ont des erreurs critiques (pas de nom)
    if (biensToInsert.length === 0) {
      return NextResponse.json(
        { 
          error: 'Aucun bien valide trouvé',
          message: 'Vérifiez que la colonne "nom" est bien renseignée pour chaque bien.',
          errors: errors.slice(0, 10) 
        },
        { status: 400 }
      )
    }
    
    // 7. INSÉRER DANS LA DB
    const { data: insertedBiens, error: insertError } = await supabase
      .from('biens')
      .insert(biensToInsert)
      .select('id, nom')
    
    if (insertError) {
      logger.error('[API import-csv] Erreur insertion DB:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'insertion en base de données', details: insertError.message },
        { status: 500 }
      )
    }
    
    logger.info('[API import-csv] Import réussi', {
      userId: user.id,
      nbBiens: insertedBiens?.length || 0,
      nbWarnings: errors.length
    })
    
    return NextResponse.json({
      success: true,
      imported: insertedBiens?.length || 0,
      biens: insertedBiens?.map(b => b.nom),
      warnings: errors.length > 0 ? errors.slice(0, 10) : undefined,
    })
    
  } catch (error: unknown) {
    logger.error('[API import-csv] Erreur:', error)
    
    return NextResponse.json(
      { error: 'Erreur lors de l\'import CSV' },
      { status: 500 }
    )
  }
}
