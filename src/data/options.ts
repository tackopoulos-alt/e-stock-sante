// Listes proposées dans les formulaires
import type { Fonction, StructureType } from "@/lib/types"

export const CATEGORIES = [
  "Antalgique",
  "Anti-inflammatoire",
  "Antibiotique",
  "Antipaludique",
  "Antiseptique",
  "Obstétrique",
  "Réhydratation",
  "Respiratoire",
  "Vitamines et minéraux",
  "Autre",
]

export const FORMES = ["Comprimé", "Gélule", "Sirop", "Injectable", "Sachet", "Spray", "Pommade", "Solution"]

export const STRUCTURES: StructureType[] = ["Centre de Santé", "Poste de Santé", "Hôpital", "Clinique", "Pharmacie hospitalière"]

export const FONCTIONS: Fonction[] = [
  "Gestionnaire de stock",
  "Agent de santé",
  "Pharmacien",
  "Responsable de pharmacie",
  "Administrateur",
]