import { useAccount } from "@/context/AccountContext"
import type { Profile } from "@/lib/account"

// La fiche de la personne connectée (nom, fonction, rôle, structure), lue sur le serveur.
// Dans l'application, le compte est toujours actif : null n'arrive que pendant un rechargement très court.
export function useProfile(): Profile | null {
  const { state } = useAccount()
  return state.status === "active" ? state.profile : null
}
