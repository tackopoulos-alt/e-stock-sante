export type Role = "admin" | "gestionnaire"
export type UserStatus = "actif" | "inactif" | "en_attente"
export type MovementType = "entree" | "sortie"

export type StructureType =
  | "Centre de Santé"
  | "Poste de Santé"
  | "Hôpital"
  | "Clinique"
  | "Pharmacie hospitalière"

export type Fonction =
  | "Gestionnaire de stock"
  | "Agent de santé"
  | "Pharmacien"
  | "Responsable de pharmacie"
  | "Administrateur"

export interface User {
  id: string
  nom: string
  email: string
  telephone?: string
  typeStructure: StructureType
  nomStructure: string
  fonction: Fonction
  role: Role
  statut: UserStatus
}

export interface Medicine {
  id: string
  nom: string
  reference: string
  categorie: string
  dosage: string
  forme: string
  laboratoire: string
  seuilMin: number
  description: string
  quantite: number
}

export interface Movement {
  id: string
  medicineId: string
  type: MovementType
  quantite: number
  date: string
  userId: string
  motif: string
}

export interface Lot {
  id: string
  medicineId: string
  numero: string
  quantite: number
  entree: string
  expiration?: string
  provenance: string
}