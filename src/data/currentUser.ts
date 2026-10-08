import type { User } from "@/lib/types"

// Provisoire : l'utilisateur connecté viendra du backend
export const currentUser: User = {
  id: "u1",
  nom: "Awa Diop",
  email: "admin@estock.sn",
  typeStructure: "Hôpital",
  nomStructure: "Hôpital Régional de Saint-Louis",
  fonction: "Administrateur",
  role: "admin",
  statut: "actif",
}

export const currentUserInitials = currentUser.nom
  .split(" ")
  .map((part) => part[0])
  .join("")
  .toUpperCase()
