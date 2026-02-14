import { z } from "zod"
import { ModePaiementEnum } from "./locataire.schema"

/**
 * @fileoverview Schémas Zod pour la validation des quittances de loyer
 *
 * Aligné avec les interfaces Quittance / QuittanceCreate de lib/types/quittance.ts
 */

// ============================================
// REGEX
// ============================================

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

// ============================================
// SCHÉMA PRINCIPAL
// ============================================

/**
 * Schéma de CRÉATION d'une quittance de loyer.
 *
 * Valide les montants, les dates et les informations locataire.
 */
export const CreateQuittanceSchema = z.object({
  mois: z.coerce
    .number({ message: "Le mois doit être un nombre valide" })
    .int("Le mois doit être un nombre entier")
    .min(1, "Le mois doit être entre 1 et 12")
    .max(12, "Le mois doit être entre 1 et 12"),

  annee: z.coerce
    .number({ message: "L'année doit être un nombre valide" })
    .int("L'année doit être un nombre entier")
    .min(2000, "L'année doit être entre 2000 et 2100")
    .max(2100, "L'année doit être entre 2000 et 2100"),

  locataireNom: z
    .string()
    .trim()
    .min(1, "Le nom du locataire est obligatoire")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),

  locatairePrenom: z
    .string()
    .trim()
    .min(1, "Le prénom du locataire est obligatoire")
    .max(100, "Le prénom ne peut pas dépasser 100 caractères"),

  locataireEmail: z
    .string()
    .trim()
    .email("Format d'email invalide")
    .max(255, "L'email ne peut pas dépasser 255 caractères")
    .optional()
    .nullable()
    .or(z.literal("")),

  montantLocataire: z.coerce
    .number({ message: "Le montant du locataire doit être un nombre valide" })
    .nonnegative("Le montant du locataire ne peut pas être négatif")
    .max(99_999, "Le montant du locataire ne peut pas dépasser 99 999 €"),

  montantAPL: z.coerce
    .number({ message: "Le montant APL doit être un nombre valide" })
    .nonnegative("Le montant APL ne peut pas être négatif")
    .max(99_999, "Le montant APL ne peut pas dépasser 99 999 €")
    .optional()
    .default(0),

  datePayeLocataire: z
    .string()
    .regex(DATE_REGEX, "Format de date invalide (attendu : AAAA-MM-JJ)"),

  datePayeAPL: z
    .string()
    .regex(DATE_REGEX, "Format de date invalide (attendu : AAAA-MM-JJ)")
    .optional()
    .nullable()
    .or(z.literal("")),

  modePaiement: ModePaiementEnum,

  emailEnvoye: z.boolean().optional().default(false),

  dateEnvoiEmail: z
    .string()
    .regex(DATE_REGEX, "Format de date invalide (attendu : AAAA-MM-JJ)")
    .optional()
    .nullable()
    .or(z.literal("")),
})

// ============================================
// TYPES INFÉRÉS
// ============================================

export type CreateQuittanceInput = z.infer<typeof CreateQuittanceSchema>
