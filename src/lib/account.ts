import { ApiError } from "./api"

// L'état du compte de la personne connectée, tel que le serveur le décrit (GET /auth/me)
export type AccountStatut = "actif" | "en_attente" | "inactif"

export interface Profile {
  id: string
  nom: string
  email: string
  telephone: string | null
  fonction: string
  role: "admin" | "gestionnaire"
  statut: AccountStatut
  emailVerifie: boolean
  structure: { id: string; nom: string; type: string }
}

// Ce que la page « Terminer l'inscription » envoie à POST /auth/register
export interface RegisterInput {
  nom?: string
  telephone?: string
  fonction: string
  typeStructure: string
  nomStructure: string
}

// Quel écran afficher
export type AccountState =
  | { status: "loading" }
  | { status: "needs-verification" } // adresse e-mail pas encore vérifiée
  | { status: "needs-registration" } // vérifiée, mais pas encore de fiche
  | { status: "pending"; profile: Profile } // en attente de validation
  | { status: "disabled"; profile: Profile } // désactivé
  | { status: "active"; profile: Profile } // l'application
  | { status: "error"; error: ApiError } // le serveur n'a pas pu répondre

export function stateFromProfile(profile: Profile): AccountState {
  if (profile.statut === "actif") return { status: "active", profile }
  if (profile.statut === "en_attente") return { status: "pending", profile }
  return { status: "disabled", profile }
}

// Le serveur répond « pas encore inscrit » par un code, pas par une panne : c'est un écran à part entière
export function stateFromError(error: unknown): AccountState {
  const apiError = error instanceof ApiError ? error : new ApiError(0, "ERREUR", ["Une erreur est survenue."])
  if (apiError.code === "INSCRIPTION_INCOMPLETE") return { status: "needs-registration" }
  if (apiError.code === "EMAIL_NON_VERIFIE") return { status: "needs-verification" }
  return { status: "error", error: apiError }
}
