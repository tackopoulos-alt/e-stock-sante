import type { Lot, Medicine, Movement } from "@/lib/types"

export type StockLevel = "normal" | "faible" | "rupture"
export type AlertType = "rupture" | "faible" | "peremption"
export type AlertPriority = "critique" | "avertissement"

export interface Alert {
  id: string
  medicineId: string
  type: AlertType
  niveau: AlertPriority
  message: string
  date: string
  // Change quand la situation change (le stock bouge) : sert à savoir si une alerte prise en compte est toujours la même
  signature: string
}

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

// Une alerte = rupture, stock faible, ou lot qui expire dans 90 jours ou moins
export function buildAlerts(medicines: Medicine[], movements: Movement[], lots: Lot[]): Alert[] {
  const lastMovement: Record<string, string> = {}
  for (const mv of movements) {
    if (!lastMovement[mv.medicineId] || mv.date > lastMovement[mv.medicineId]) lastMovement[mv.medicineId] = mv.date
  }

  const now = new Date().toISOString()
  const alerts: Alert[] = []

  for (const m of medicines) {
    const level = getLevel(m)
    if (level === "rupture") {
      alerts.push({
        id: `${m.id}-rupture`,
        medicineId: m.id,
        type: "rupture",
        niveau: "critique",
        date: lastMovement[m.id] ?? now,
        message: "Stock épuisé",
        signature: "0",
      })
    } else if (level === "faible") {
      alerts.push({
        id: `${m.id}-faible`,
        medicineId: m.id,
        type: "faible",
        niveau: "avertissement",
        date: lastMovement[m.id] ?? now,
        message: `Stock faible : ${m.quantite} restant(s) pour un seuil de ${m.seuilMin}`,
        signature: String(m.quantite),
      })
    }
  }

  for (const lot of lots) {
    if (lot.quantite <= 0 || !lot.expiration) continue
    const days = daysUntil(lot.expiration)
    if (days > 90) continue

    // L'alerte existe depuis le jour où le lot est passé sous les 90 jours
    const started = new Date(lot.expiration + "T00:00:00")
    started.setDate(started.getDate() - 90)

    alerts.push({
      id: `${lot.id}-peremption`,
      medicineId: lot.medicineId,
      type: "peremption",
      niveau: days <= 30 ? "critique" : "avertissement",
      date: started.toISOString(),
      signature: String(lot.quantite),
      message: days < 0 ? `Lot ${lot.numero} expiré depuis ${-days} jour(s)` : `Expiration dans ${days} jour(s) (lot ${lot.numero})`,
    })
  }

  // Les critiques d'abord, puis les plus récentes
  return alerts.sort((a, b) =>
    a.niveau === b.niveau ? b.date.localeCompare(a.date) : a.niveau === "critique" ? -1 : 1,
  )
}