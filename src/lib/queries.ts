import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query"
import { ApiError, apiFetch } from "@/lib/api"
import type { Medicine } from "@/lib/types"

// ─── Le client de requêtes ─────────────────────────────────────────────────────────────────────────

// Garde en mémoire ce que le serveur a répondu, recharge quand c'est utile, et retente les pannes passagères
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Une panne passagère (réseau coupé, serveur qui se réveille) est retentée deux fois.
        // Un refus du serveur (400, 401, 403, 404, 409) ne l'est jamais : le retenter ne changerait rien.
        retry: (failureCount, error) => failureCount < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
    },
  })
}

// Les « clés » : le nom sous lequel chaque réponse est gardée. Les invalider force un rechargement.
export const keys = {
  medicines: ["medicines"] as const,
  medicine: (id: string) => ["medicines", id] as const,
  categories: ["categories"] as const,
  movements: (filters: object) => ["movements", filters] as const,
}

// Un message en français pour n'importe quelle erreur (les messages de validation du serveur sont en anglais)
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "DONNEES_INVALIDES") return "Vérifiez les informations saisies, puis réessayez."
    if (err.code === "SERVEUR") return "Le serveur a rencontré un problème. Réessayez dans un instant."
    return err.message
  }
  return "Une erreur est survenue. Réessayez."
}

// ─── Les formats du serveur ────────────────────────────────────────────────────────────────────────

export interface ApiCategory {
  id: string
  nom: string
}

export interface ApiLot {
  id: string
  numero: string
  quantite: number
  dateEntree: string
  dateExpiration: string | null
  provenance: string | null
}

export interface ApiMedicine {
  id: string
  nom: string
  reference: string
  dosage: string
  forme: string
  laboratoire: string | null
  seuilMin: number
  quantite: number
  description: string | null
  category: ApiCategory
  lots?: ApiLot[]
}

export interface ApiMovement {
  id: string
  type: "entree" | "sortie"
  quantite: number
  motif: string
  date: string
  user: { id: string; nom: string }
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

// Le serveur donne la catégorie en { id, nom } et peut renvoyer null ; les pages attendent un texte
export function toMedicine(m: ApiMedicine): Medicine {
  return {
    id: m.id,
    nom: m.nom,
    reference: m.reference,
    categorie: m.category.nom,
    categoryId: m.category.id,
    dosage: m.dosage,
    forme: m.forme,
    laboratoire: m.laboratoire ?? "",
    seuilMin: m.seuilMin,
    description: m.description ?? "",
    quantite: m.quantite,
  }
}

// ─── Les appels ────────────────────────────────────────────────────────────────────────────────────

export async function fetchMedicines(): Promise<Medicine[]> {
  return (await apiFetch<ApiMedicine[]>("/medicines")).map(toMedicine)
}

export const fetchMedicine = (id: string) => apiFetch<ApiMedicine>(`/medicines/${id}`)

export const fetchCategories = () => apiFetch<ApiCategory[]>("/categories")

export const fetchMedicineMovements = (id: string, limit: number) =>
  apiFetch<Page<ApiMovement>>("/movements", { query: { medicineId: id, limit } })

export interface MedicineInput {
  nom: string
  reference: string
  categoryId: string
  dosage: string
  forme: string
  laboratoire: string
  seuilMin: number
  description: string
}

// Crée le médicament, puis (si demandé) une entrée « Stock initial ». Ce sont deux demandes : si la seconde échoue,
// le médicament existe quand même, et on le dit.
export async function createMedicine(input: MedicineInput, initialStock: number): Promise<{ id: string; stockError?: string }> {
  const created = await apiFetch<ApiMedicine>("/medicines", { method: "POST", body: input })
  if (initialStock > 0) {
    try {
      await apiFetch("/movements/entree", { method: "POST", body: { medicineId: created.id, quantite: initialStock, motif: "Stock initial" } })
    } catch (err) {
      return { id: created.id, stockError: describeError(err) }
    }
  }
  return { id: created.id }
}

export const updateMedicine = (id: string, input: MedicineInput) => apiFetch<ApiMedicine>(`/medicines/${id}`, { method: "PATCH", body: input })

export const deleteMedicine = (id: string) => apiFetch<void>(`/medicines/${id}`, { method: "DELETE" })

// ─── Les hooks, utilisés par les pages ─────────────────────────────────────────────────────────────

export function useMedicines() {
  const query = useQuery({ queryKey: keys.medicines, queryFn: fetchMedicines })
  return { medicines: query.data ?? [], loading: query.isPending, error: query.isError ? query.error : null, reload: () => void query.refetch() }
}

export function useCategories() {
  const query = useQuery({ queryKey: keys.categories, queryFn: fetchCategories, staleTime: Infinity })
  return { categories: query.data ?? [], loading: query.isPending, error: query.isError ? query.error : null }
}

// La fiche d'un médicament, avec ses lots. Rien n'est demandé tant qu'aucun médicament n'est choisi.
export function useMedicineDetail(id: string | null) {
  return useQuery({ queryKey: keys.medicine(id ?? ""), queryFn: () => fetchMedicine(id!), enabled: !!id })
}

export function useMedicineMovements(id: string | null, limit: number) {
  return useQuery({
    queryKey: keys.movements({ medicineId: id, limit }),
    queryFn: () => fetchMedicineMovements(id!, limit),
    enabled: !!id,
  })
}

// Après une modification : on recharge tout ce qui peut avoir changé (médicaments, historique, alertes, tableau de bord)
export function useRefreshAfterChange() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(["medicines", "movements", "alerts", "dashboard"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
}
