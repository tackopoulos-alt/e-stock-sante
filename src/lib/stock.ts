import type { Medicine } from "@/lib/types"

export type StockLevel = "normal" | "faible" | "rupture"
export type AlertType = "rupture" | "faible" | "peremption"
export type AlertPriority = "critique" | "avertissement"

// Niveau d'un médicament : rupture à 0, faible quand le seuil minimum est atteint
export const getLevel = (m: Pick<Medicine, "quantite" | "seuilMin">): StockLevel =>
  m.quantite <= 0 ? "rupture" : m.quantite <= m.seuilMin ? "faible" : "normal"

// Nom affiché partout : "Paracétamol 500 mg"
export const medLabel = (m: Pick<Medicine, "nom" | "dosage">) => `${m.nom} ${m.dosage}`

// Nombre de jours entre aujourd'hui et une date AAAA-MM-JJ (négatif si la date est passée)
export function daysUntil(dateStr: string) {
  const target = new Date(dateStr + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}