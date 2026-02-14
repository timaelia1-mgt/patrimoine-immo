/**
 * @fileoverview Point d'entrée des schémas de validation Zod
 *
 * Usage :
 *   import { CreateBienSchema, type CreateBienInput } from "@/lib/schemas"
 */

// Bien immobilier
export {
  CreateBienSchema,
  UpdateBienSchema,
  BienFormSchema,
  type CreateBienInput,
  type UpdateBienInput,
  type BienFormInput,
} from "./bien.schema"

// Locataire
export {
  UpsertLocataireSchema,
  ModePaiementEnum,
  type UpsertLocataireInput,
  type ModePaiement,
} from "./locataire.schema"

// Quittance
export {
  CreateQuittanceSchema,
  type CreateQuittanceInput,
} from "./quittance.schema"
