import { z } from "zod"

/**
 * @fileoverview Schémas Zod pour la validation des locataires
 *
 * Aligné avec l'interface Locataire de lib/database.ts
 */

// ============================================
// REGEX PATTERNS
// ============================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

// ============================================
// ENUMS
// ============================================

/** Modes de paiement valides */
export const ModePaiementEnum = z.enum([
  "virement",
  "cheque",
  "especes",
  "prelevement",
])

export type ModePaiement = z.infer<typeof ModePaiementEnum>

// ============================================
// SCHÉMA PRINCIPAL
// ============================================

/**
 * Schéma pour la création et la mise à jour d'un locataire.
 *
 * Les champs email, telephone et dateEntree sont facultatifs.
 * montantAPL accepte une string (formulaire) ou un number.
 */
export const UpsertLocataireSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(1, "Le nom du locataire est obligatoire")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),

  prenom: z
    .string()
    .trim()
    .min(1, "Le prénom du locataire est obligatoire")
    .max(100, "Le prénom ne peut pas dépasser 100 caractères"),

  email: z
    .string()
    .trim()
    .regex(EMAIL_REGEX, "Format d'email invalide")
    .max(255, "L'email ne peut pas dépasser 255 caractères")
    .optional()
    .nullable()
    .or(z.literal("")),

  telephone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "Format de téléphone invalide (ex : 06 12 34 56 78)")
    .optional()
    .nullable()
    .or(z.literal("")),

  dateEntree: z
    .string()
    .regex(DATE_REGEX, "Format de date invalide (attendu : AAAA-MM-JJ)")
    .optional()
    .nullable()
    .or(z.literal("")),

  montantAPL: z.coerce
    .number({ message: "Le montant APL doit être un nombre valide" })
    .nonnegative("Le montant APL ne peut pas être négatif")
    .max(9999, "Le montant APL ne peut pas dépasser 9 999 €")
    .optional()
    .default(0),

  modePaiement: ModePaiementEnum.optional().default("virement"),
})

// ============================================
// TYPES INFÉRÉS
// ============================================

export type UpsertLocataireInput = z.infer<typeof UpsertLocataireSchema>
