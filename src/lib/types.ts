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

export interface Medicine {
  id: string
  nom: string
  reference: string
  categorie: string
  // L'identifiant de la catégorie côté serveur
  categoryId?: string
  dosage: string
  forme: string
  laboratoire: string
  seuilMin: number
  description: string
  quantite: number
  // La dernière entrée ou sortie, donnée par le serveur
  dernierMouvement?: { type: MovementType; date: string } | null
}