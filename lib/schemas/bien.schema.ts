import { z } from "zod"

/**
 * @fileoverview Schémas Zod pour la validation des biens immobiliers
 *
 * Utilisés côté client (formulaires) et serveur (API routes)
 * pour garantir la cohérence et la sécurité des données.
 */

// ============================================
// REGEX PATTERNS
// ============================================

const CODE_POSTAL_REGEX = /^[0-9]{5}$/

// ============================================
// HELPERS – sanitisation XSS
// ============================================

/** Supprime les balises <script> d'une chaîne */
const sanitize = (val: string) => val.replace(/<script.*?>.*?<\/script>/gi, "")

// ============================================
// SOUS-SCHÉMAS – Informations de base
// ============================================

const BienBaseSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(1, "Le nom du bien est obligatoire")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .transform(sanitize),

  adresse: z
    .string()
    .trim()
    .min(1, "L'adresse est obligatoire")
    .max(200, "L'adresse ne peut pas dépasser 200 caractères")
    .transform(sanitize),

  ville: z
    .string()
    .trim()
    .min(1, "La ville est obligatoire")
    .max(100, "La ville ne peut pas dépasser 100 caractères")
    .transform(sanitize),

  codePostal: z
    .string()
    .trim()
    .regex(CODE_POSTAL_REGEX, "Le code postal doit contenir 5 chiffres"),
})

// ============================================
// SOUS-SCHÉMAS – Finances (montants mensuels)
// ============================================

/** Accepte un number ou une string convertible en number */
const coercePositiveNumber = (label: string) =>
  z.coerce
    .number({ message: `${label} doit être un nombre valide` })
    .positive(`${label} doit être supérieur à 0`)
    .max(9_999_999, `${label} ne peut pas dépasser 9 999 999 €`)

const coerceNonNegativeNumber = (label: string, max = 999_999) =>
  z.coerce
    .number({ message: `${label} doit être un nombre valide` })
    .nonnegative(`${label} ne peut pas être négatif`)
    .max(max, `${label} ne peut pas dépasser ${max.toLocaleString("fr-FR")} €`)

const BienFinancesSchema = z.object({
  loyerMensuel: coercePositiveNumber("Le loyer mensuel"),

  taxeFonciere: coerceNonNegativeNumber("La taxe foncière").optional().default(0),
  chargesCopro: coerceNonNegativeNumber("Les charges de copropriété").optional().default(0),
  assurance: coerceNonNegativeNumber("L'assurance").optional().default(0),
  fraisGestion: coerceNonNegativeNumber("Les frais de gestion").optional().default(0),
  autresCharges: coerceNonNegativeNumber("Les autres charges").optional().default(0),
})

// ============================================
// SOUS-SCHÉMAS – Financement
// ============================================

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

/** Financement par CRÉDIT */
const BienCreditSchema = z.object({
  typeFinancement: z.literal("CREDIT"),

  montantCredit: coercePositiveNumber("Le montant du crédit"),

  tauxCredit: z.coerce
    .number({ message: "Le taux d'intérêt doit être un nombre valide" })
    .positive("Le taux d'intérêt doit être supérieur à 0")
    .max(100, "Le taux d'intérêt ne peut pas dépasser 100 %"),

  dureeCredit: z.coerce
    .number({ message: "La durée du crédit doit être un nombre valide" })
    .int("La durée du crédit doit être un nombre entier")
    .positive("La durée du crédit doit être supérieure à 0")
    .max(600, "La durée du crédit ne peut pas dépasser 600 mois (50 ans)"),

  dateDebutCredit: z
    .string()
    .regex(dateRegex, "Format de date invalide (attendu : AAAA-MM-JJ)")
    .optional()
    .nullable()
    .or(z.literal("")),

  mensualiteCredit: z.coerce.number().positive().optional().nullable(),
})

/** Financement comptant (CASH) */
const BienCashSchema = z.object({
  typeFinancement: z.literal("CASH"),
  montantCredit: z.any().optional(),
  tauxCredit: z.any().optional(),
  dureeCredit: z.any().optional(),
  dateDebutCredit: z.any().optional(),
  mensualiteCredit: z.any().optional(),
})

// ============================================
// SCHÉMAS PRINCIPAUX
// ============================================

/**
 * Schéma de CRÉATION d'un bien immobilier.
 *
 * Combine les informations de base, les finances et le type de financement.
 * Le financement est discriminé sur `typeFinancement` ("CREDIT" | "CASH").
 */
export const CreateBienSchema = BienBaseSchema.merge(BienFinancesSchema).and(
  z.discriminatedUnion("typeFinancement", [BienCreditSchema, BienCashSchema])
)

/**
 * Schéma de MISE À JOUR d'un bien immobilier (tous champs optionnels).
 *
 * Utilisé pour les PATCH/PUT partiels.
 */
export const UpdateBienSchema = z.object({
  nom: z.string().trim().min(1).max(100).transform(sanitize).optional(),
  adresse: z.string().trim().min(1).max(200).transform(sanitize).optional(),
  ville: z.string().trim().min(1).max(100).transform(sanitize).optional(),
  codePostal: z.string().trim().regex(CODE_POSTAL_REGEX, "Code postal invalide").optional(),

  loyerMensuel: z.coerce.number().positive().optional(),
  taxeFonciere: z.coerce.number().nonnegative().optional(),
  chargesCopro: z.coerce.number().nonnegative().optional(),
  assurance: z.coerce.number().nonnegative().optional(),
  fraisGestion: z.coerce.number().nonnegative().optional(),
  autresCharges: z.coerce.number().nonnegative().optional(),

  typeFinancement: z.enum(["CREDIT", "CASH"]).optional(),
  montantCredit: z.coerce.number().positive().optional().nullable(),
  tauxCredit: z.coerce.number().positive().max(100).optional().nullable(),
  dureeCredit: z.coerce.number().int().positive().max(600).optional().nullable(),
  dateDebutCredit: z.string().regex(dateRegex).optional().nullable().or(z.literal("")),
  mensualiteCredit: z.coerce.number().positive().optional().nullable(),

  // Champs investissement (optionnels, utilisés par l'enrichissement)
  prixAchat: z.coerce.number().nonnegative().optional().nullable(),
  fraisNotaire: z.coerce.number().nonnegative().optional().nullable(),
  travauxInitiaux: z.coerce.number().nonnegative().optional().nullable(),
  autresFrais: z.coerce.number().nonnegative().optional().nullable(),
  dateAcquisition: z.string().regex(dateRegex).optional().nullable().or(z.literal("")),
  dateMiseEnLocation: z.string().regex(dateRegex).optional().nullable().or(z.literal("")),
})

// ============================================
// SCHÉMA FORMULAIRE (react-hook-form + zodResolver)
// ============================================

/**
 * Convertit les chaînes vides en undefined pour les champs numériques optionnels.
 * Permet à `.optional()` d'intercepter avant `z.coerce.number()`.
 */
const emptyToUndefined = (val: unknown) =>
  val === "" || val === undefined || val === null ? undefined : val

/**
 * Schéma de FORMULAIRE pour création/édition d'un bien.
 *
 * Optimisé pour react-hook-form + zodResolver :
 * - Flat z.object (pas d'intersection / discriminatedUnion)
 * - Champs crédit `.optional()` + `superRefine` pour validation conditionnelle
 * - `z.preprocess(emptyToUndefined, ...)` pour accepter "" quand le champ est masqué
 */
export const BienFormSchema = z
  .object({
    nom: z
      .string()
      .trim()
      .min(1, "Le nom du bien est obligatoire")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .transform(sanitize),

    adresse: z
      .string()
      .trim()
      .min(1, "L'adresse est obligatoire")
      .max(200, "L'adresse ne peut pas dépasser 200 caractères")
      .transform(sanitize),

    ville: z
      .string()
      .trim()
      .min(1, "La ville est obligatoire")
      .max(100, "La ville ne peut pas dépasser 100 caractères")
      .transform(sanitize),

    codePostal: z
      .string()
      .trim()
      .regex(CODE_POSTAL_REGEX, "Le code postal doit contenir 5 chiffres"),

    loyerMensuel: coercePositiveNumber("Le loyer mensuel"),

    taxeFonciere: coerceNonNegativeNumber("La taxe foncière").optional().default(0),
    chargesCopro: coerceNonNegativeNumber("Les charges de copropriété").optional().default(0),
    assurance: coerceNonNegativeNumber("L'assurance").optional().default(0),
    fraisGestion: coerceNonNegativeNumber("Les frais de gestion").optional().default(0),
    autresCharges: coerceNonNegativeNumber("Les autres charges").optional().default(0),

    typeFinancement: z.enum(["CREDIT", "CASH"]),

    // Champs crédit – optional car non rendus (donc vides) en mode CASH
    montantCredit: z.preprocess(
      emptyToUndefined,
      coercePositiveNumber("Le montant du crédit").optional(),
    ),
    tauxCredit: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ message: "Le taux d'intérêt doit être un nombre valide" })
        .positive("Le taux d'intérêt doit être supérieur à 0")
        .max(100, "Le taux d'intérêt ne peut pas dépasser 100 %")
        .optional(),
    ),
    dureeCredit: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ message: "La durée du crédit doit être un nombre valide" })
        .int("La durée du crédit doit être un nombre entier")
        .positive("La durée du crédit doit être supérieure à 0")
        .max(600, "La durée ne peut pas dépasser 600 mois (50 ans)")
        .optional(),
    ),
    dateDebutCredit: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.typeFinancement === "CREDIT") {
      if (data.montantCredit === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le montant emprunté est obligatoire pour un crédit",
          path: ["montantCredit"],
        })
      }
      if (data.tauxCredit === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le taux d'intérêt est obligatoire pour un crédit",
          path: ["tauxCredit"],
        })
      }
      if (data.dureeCredit === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La durée du crédit est obligatoire pour un crédit",
          path: ["dureeCredit"],
        })
      }
    }
  })

export type BienFormInput = z.infer<typeof BienFormSchema>

// ============================================
// TYPES INFÉRÉS
// ============================================

export type CreateBienInput = z.infer<typeof CreateBienSchema>
export type UpdateBienInput = z.infer<typeof UpdateBienSchema>
