import { createContext, useContext, useState, type ReactNode } from "react"
import { currentUser as session } from "@/data/currentUser"
import {
  lots as initialLots,
  medicines as initialMedicines,
  movements as initialMovements,
  users as initialUsers,
} from "@/data/mockData"
import { todayInputValue } from "@/lib/format"
import type { Alert } from "@/lib/stock"
import type { Lot, Medicine, Movement, MovementType, User, UserStatus } from "@/lib/types"

export type MedicineInput = Omit<Medicine, "id" | "quantite">
export type UserInput = Omit<User, "id">
export type ProfileInput = { nom: string; email: string; telephone?: string }

// Pourquoi un compte ne peut pas être supprimé
export interface DeletionBlock {
  code: "self" | "last-admin" | "operations"
  message: string
}

export interface MovementInput {
  medicineId: string
  type: MovementType
  quantite: number
  motif: string
  date: string // AAAA-MM-JJ
  lot?: string
  expiration?: string
  provenance?: string
}

// Motif de l'entrée créée automatiquement quand on ajoute un médicament avec un stock de départ
const INITIAL_STOCK_MOTIF = "Stock initial"

interface Result {
  ok: boolean
  error?: string
  id?: string
}

interface DataContextValue {
  medicines: Medicine[]
  movements: Movement[]
  lots: Lot[]
  users: User[]
  // L'utilisateur connecté, toujours à jour (nom, e-mail, téléphone...)
  currentUser: User
  addMedicine: (input: MedicineInput, stockInitial?: number) => Result
  updateMedicine: (id: string, input: MedicineInput) => Result
  canDeleteMedicine: (id: string) => boolean
  deleteMedicine: (id: string) => Result
  addMovement: (input: MovementInput) => Result
  isAcknowledged: (alert: Alert) => boolean
  acknowledgeAlert: (alert: Alert) => void
  restoreAlert: (alertId: string) => void
  addUser: (input: UserInput) => Result
  updateUser: (id: string, input: UserInput) => Result
  setUserStatus: (id: string, statut: UserStatus) => Result
  deletionBlock: (id: string) => DeletionBlock | null
  deleteUser: (id: string) => Result
  updateProfile: (input: ProfileInput) => Result
}

const DataContext = createContext<DataContextValue | null>(null)

const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function DataProvider({ children }: { children: ReactNode }) {
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines)
  const [movements, setMovements] = useState<Movement[]>(initialMovements)
  const [lots, setLots] = useState<Lot[]>(initialLots)
  const [users, setUsers] = useState<User[]>(initialUsers)
  // Alertes prises en compte : identifiant de l'alerte -> signature au moment où elle a été prise en compte
  const [acks, setAcks] = useState<Record<string, string>>({})

  // Une référence ne peut exister qu'une fois
  const referenceTaken = (reference: string, exceptId?: string) =>
    medicines.some((m) => m.id !== exceptId && m.reference.toLowerCase() === reference.trim().toLowerCase())

  const addMedicine = (input: MedicineInput, stockInitial = 0): Result => {
    if (referenceTaken(input.reference)) return { ok: false, error: "Cette référence existe déjà." }

    const id = newId("m")
    const medicine: Medicine = { ...input, reference: input.reference.trim(), id, quantite: stockInitial }
    setMedicines((list) => [medicine, ...list])

    // Le stock de départ est tracé comme une entrée, pour que le stock soit toujours égal à la somme des mouvements
    if (stockInitial > 0) {
      const movement: Movement = {
        id: newId("mv"),
        medicineId: id,
        type: "entree",
        quantite: stockInitial,
        date: new Date().toISOString(),
        userId: session.id,
        motif: INITIAL_STOCK_MOTIF,
      }
      setMovements((list) => [movement, ...list])
    }
    return { ok: true, id }
  }

  const updateMedicine = (id: string, input: MedicineInput): Result => {
    if (referenceTaken(input.reference, id)) return { ok: false, error: "Cette référence est déjà utilisée par un autre médicament." }

    setMedicines((list) =>
      list.map((m) => (m.id === id ? { ...m, ...input, reference: input.reference.trim() } : m)),
    )
    return { ok: true }
  }

  // Supprimable tant qu'aucune vraie opération n'a eu lieu (le stock initial seul ne compte pas)
  const canDeleteMedicine = (id: string) =>
    !movements.some((mv) => mv.medicineId === id && mv.motif !== INITIAL_STOCK_MOTIF)

  const deleteMedicine = (id: string): Result => {
    if (!canDeleteMedicine(id)) {
      return { ok: false, error: "Ce médicament a un historique de mouvements : il ne peut pas être supprimé." }
    }

    setMedicines((list) => list.filter((m) => m.id !== id))
    setMovements((list) => list.filter((mv) => mv.medicineId !== id))
    setLots((list) => list.filter((l) => l.medicineId !== id))
    return { ok: true }
  }

  const addMovement = (input: MovementInput): Result => {
    const medicine = medicines.find((m) => m.id === input.medicineId)
    if (!medicine) return { ok: false, error: "Médicament introuvable." }

    if (!Number.isInteger(input.quantite) || input.quantite <= 0) {
      return { ok: false, error: "La quantité doit être un nombre entier supérieur à 0." }
    }

    // Règle : une sortie ne peut pas dépasser le stock disponible
    if (input.type === "sortie" && input.quantite > medicine.quantite) {
      return {
        ok: false,
        error: `Impossible d'effectuer une sortie de ${input.quantite} unité(s). Stock disponible : ${medicine.quantite}.`,
      }
    }

    if (input.date > todayInputValue()) return { ok: false, error: "La date ne peut pas être dans le futur." }

    // La date choisie, avec l'heure actuelle
    const when = new Date()
    if (input.date) {
      const [year, month, day] = input.date.split("-").map(Number)
      when.setFullYear(year, month - 1, day)
    }

    const delta = input.type === "entree" ? input.quantite : -input.quantite
    setMedicines((list) => list.map((m) => (m.id === medicine.id ? { ...m, quantite: m.quantite + delta } : m)))

    const movement: Movement = {
      id: newId("mv"),
      medicineId: medicine.id,
      type: input.type,
      quantite: input.quantite,
      date: when.toISOString(),
      userId: session.id,
      motif: input.motif.trim() || (input.type === "entree" ? "Réapprovisionnement" : "Dispensation"),
    }
    setMovements((list) => [movement, ...list])

    if (input.type === "entree") {
      // Une entrée avec un lot ou une date d'expiration crée (ou complète) un lot
      const numero = input.lot?.trim()
      const expiration = input.expiration || undefined
      if (numero || expiration) {
        setLots((list) => {
          const existing = numero ? list.find((l) => l.medicineId === medicine.id && l.numero === numero) : undefined
          if (existing) {
            return list.map((l) => (l.id === existing.id ? { ...l, quantite: l.quantite + input.quantite } : l))
          }
          const created: Lot = {
            id: newId("l"),
            medicineId: medicine.id,
            numero: numero || `LOT-${input.date.replaceAll("-", "")}-${list.length + 1}`,
            quantite: input.quantite,
            entree: input.date,
            expiration,
            provenance: input.provenance?.trim() || "—",
          }
          return [...list, created]
        })
      }
    } else {
      // Une sortie consomme d'abord les lots qui expirent le plus tôt
      setLots((list) => {
        const order = list
          .filter((l) => l.medicineId === medicine.id && l.quantite > 0)
          .sort((a, b) => (a.expiration ?? "9999").localeCompare(b.expiration ?? "9999"))

        const taken: Record<string, number> = {}
        let remaining = input.quantite
        for (const lot of order) {
          if (remaining <= 0) break
          const part = Math.min(lot.quantite, remaining)
          taken[lot.id] = part
          remaining -= part
        }
        return list.map((l) => (taken[l.id] ? { ...l, quantite: l.quantite - taken[l.id] } : l))
      })
    }

    return { ok: true }
  }

  // Une alerte prise en compte redevient active si la situation change (nouveau mouvement)
  const isAcknowledged = (alert: Alert) => acks[alert.id] === alert.signature
  const acknowledgeAlert = (alert: Alert) => setAcks((list) => ({ ...list, [alert.id]: alert.signature }))
  const restoreAlert = (alertId: string) =>
    setAcks((list) => {
      const next = { ...list }
      delete next[alertId]
      return next
    })

  // --- Utilisateurs ---------------------------------------------------------

  const emailTaken = (email: string, exceptId?: string) =>
    users.some((u) => u.id !== exceptId && u.email.toLowerCase() === email.trim().toLowerCase())

  // Il doit toujours rester au moins un administrateur actif
  const loseLastAdmin = (target: User, next: { role: User["role"]; statut: UserStatus }) =>
    target.role === "admin" &&
    target.statut === "actif" &&
    !(next.role === "admin" && next.statut === "actif") &&
    users.filter((u) => u.role === "admin" && u.statut === "actif").length <= 1

  const checkChange = (target: User, next: { role: User["role"]; statut: UserStatus }): Result => {
    if (target.id === session.id && (next.role !== "admin" || next.statut !== "actif")) {
      return { ok: false, error: "Vous ne pouvez pas modifier votre propre rôle ni désactiver votre propre compte." }
    }
    if (loseLastAdmin(target, next)) {
      return { ok: false, error: "Il doit toujours rester au moins un administrateur actif." }
    }
    return { ok: true }
  }

  const addUser = (input: UserInput): Result => {
    if (emailTaken(input.email)) return { ok: false, error: "Un compte existe déjà avec cette adresse e-mail." }

    const user: User = { ...input, id: newId("u"), nom: input.nom.trim(), email: input.email.trim() }
    setUsers((list) => [...list, user])
    return { ok: true, id: user.id }
  }

  const updateUser = (id: string, input: UserInput): Result => {
    const target = users.find((u) => u.id === id)
    if (!target) return { ok: false, error: "Utilisateur introuvable." }
    if (emailTaken(input.email, id)) return { ok: false, error: "Cette adresse e-mail est déjà utilisée par un autre compte." }

    const check = checkChange(target, input)
    if (!check.ok) return check

    setUsers((list) =>
      list.map((u) => (u.id === id ? { ...u, ...input, nom: input.nom.trim(), email: input.email.trim() } : u)),
    )
    return { ok: true }
  }

  const setUserStatus = (id: string, statut: UserStatus): Result => {
    const target = users.find((u) => u.id === id)
    if (!target) return { ok: false, error: "Utilisateur introuvable." }

    const check = checkChange(target, { role: target.role, statut })
    if (!check.ok) return check

    setUsers((list) => list.map((u) => (u.id === id ? { ...u, statut } : u)))
    return { ok: true }
  }

  // Un compte ne peut pas être supprimé s'il est celui de l'utilisateur connecté, le dernier administrateur,
  // ou s'il a déjà réalisé des opérations (l'historique doit rester traçable)
  const deletionBlock = (id: string): DeletionBlock | null => {
    const target = users.find((u) => u.id === id)
    if (!target) return null
    if (id === session.id) return { code: "self", message: "Vous ne pouvez pas supprimer votre propre compte." }
    if (loseLastAdmin(target, { role: "gestionnaire", statut: "inactif" })) {
      return { code: "last-admin", message: "Il doit toujours rester au moins un administrateur actif." }
    }
    if (movements.some((mv) => mv.userId === id)) {
      return {
        code: "operations",
        message: "Cet utilisateur a déjà réalisé des opérations de stock. Pour garder la traçabilité, son compte ne peut pas être supprimé.",
      }
    }
    return null
  }

  const deleteUser = (id: string): Result => {
    const block = deletionBlock(id)
    if (block) return { ok: false, error: block.message }

    setUsers((list) => list.filter((u) => u.id !== id))
    return { ok: true }
  }

  const currentUser = users.find((u) => u.id === session.id) ?? session

  // Chaque utilisateur peut modifier ses informations personnelles, mais pas son rôle ni son statut
  const updateProfile = (input: ProfileInput): Result => {
    if (emailTaken(input.email, currentUser.id)) {
      return { ok: false, error: "Cette adresse e-mail est déjà utilisée par un autre compte." }
    }

    setUsers((list) =>
      list.map((u) =>
        u.id === currentUser.id
          ? { ...u, nom: input.nom.trim(), email: input.email.trim(), telephone: input.telephone?.trim() || undefined }
          : u,
      ),
    )
    return { ok: true }
  }

  return (
    <DataContext.Provider
      value={{
        medicines,
        movements,
        lots,
        users,
        currentUser,
        addMedicine,
        updateMedicine,
        canDeleteMedicine,
        deleteMedicine,
        addMovement,
        isAcknowledged,
        acknowledgeAlert,
        restoreAlert,
        addUser,
        updateUser,
        setUserStatus,
        deletionBlock,
        deleteUser,
        updateProfile,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData doit être utilisé à l'intérieur de <DataProvider>")
  return ctx
}