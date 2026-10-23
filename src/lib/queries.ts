import { keepPreviousData, QueryClient, useQuery, useQueryClient } from "@tanstack/react-query"
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
  alerts: (filters: object) => ["alerts", filters] as const,
  dashboard: ["dashboard"] as const,
  users: (filters: object) => ["users", filters] as const,
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
  dernierMouvement?: { type: "entree" | "sortie"; date: string } | null
}

export interface ApiMovement {
  id: string
  type: "entree" | "sortie"
  quantite: number
  motif: string
  date: string
  user: { id: string; nom: string }
}

// Une ligne de l'historique : le mouvement, avec son médicament
export interface ApiHistoryItem extends ApiMovement {
  medicine: { id: string; nom: string; dosage: string; reference: string }
}

// Les filtres de l'historique : le serveur les applique tous, et pagine
export interface MovementFilters {
  page?: number
  limit?: number
  medicineId?: string
  userId?: string
  type?: "entree" | "sortie"
  from?: string
  to?: string
  search?: string
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
    dernierMouvement: m.dernierMouvement ?? null,
  }
}

// Une alerte telle que le serveur la décrit
export interface ApiAlert {
  id: string
  type: "rupture" | "faible" | "peremption"
  niveau: "critique" | "avertissement"
  statut: "active" | "prise_en_compte"
  message: string
  createdAt: string
  acknowledgedAt: string | null
  acknowledgedBy: { id: string; nom: string } | null
  medicine: { id: string; nom: string; dosage: string; reference: string }
  lot: { id: string; numero: string; dateExpiration: string | null } | null
}

// Les filtres de la liste des alertes
export interface AlertFilters {
  type?: ApiAlert["type"]
  niveau?: ApiAlert["niveau"]
  statut?: ApiAlert["statut"]
  search?: string
  page?: number
  limit?: number
}

// La liste, avec les compteurs des cartes (toutes les alertes en cours, sans filtre)
export interface AlertsPage extends Page<ApiAlert> {
  summary: { total: number; rupture: number; faible: number; peremption: number }
}

// Un utilisateur tel que le serveur le décrit (la liste ajoute le nombre d'opérations de chaque personne)
export interface ApiUser {
  id: string
  nom: string
  email: string
  telephone: string | null
  fonction: string
  role: "admin" | "gestionnaire"
  statut: "actif" | "en_attente" | "inactif"
  aDejaUnCompte: boolean
  structure: { id: string; nom: string; type: string }
  createdAt: string
}

export interface ApiUserRow extends ApiUser {
  operations: number
}

// Les filtres de la liste des utilisateurs
export interface UserFilters {
  role?: ApiUser["role"]
  statut?: ApiUser["statut"]
  search?: string
  page?: number
  limit?: number
}

// La liste, avec les compteurs des cartes (qui suivent la recherche, mais pas les filtres de rôle et de statut)
export interface UsersPage extends Page<ApiUserRow> {
  summary: { total: number; actifs: number; administrateurs: number; enAttente: number }
}

// Ce qu'on envoie pour modifier un utilisateur (l'adresse e-mail ne se modifie pas)
export interface UserInput {
  nom: string
  telephone?: string
  fonction: string
  role: ApiUser["role"]
  statut: ApiUser["statut"]
}

export interface NewUserInput extends UserInput {
  email: string
}

// Tout le tableau de bord, en un seul appel
export interface ApiDashboard {
  stats: {
    medicaments: { total: number; categories: number }
    stock: { quantiteTotale: number; variationAujourdhui: number }
    alertes: { medicamentsEnAlerte: number; faibles: number; ruptures: number; peremptions: number }
    utilisateurs: { actifs: number; administrateurs: number; enAttente: number }
  }
  // Les 7 derniers jours, du plus ancien au plus récent (jour au format AAAA-MM-JJ)
  evolution: { jour: string; entrees: number; sorties: number; stockTotal: number }[]
  repartition: { total: number; categories: { nom: string; nombre: number; pourcentage: number }[] }
  alertesRecentes: {
    id: string
    type: ApiAlert["type"]
    niveau: ApiAlert["niveau"]
    message: string
    date: string
    medicine: { id: string; nom: string; dosage: string }
  }[]
  produitsProchesRupture: {
    medicine: { id: string; nom: string; dosage: string }
    quantite: number
    seuilMin: number
    niveau: "rupture" | "faible"
  }[]
}

// L'historique, avec son résumé (nombre d'opérations, unités entrées, unités sorties) et les auteurs possibles du filtre
export interface MovementsPage extends Page<ApiHistoryItem> {
  summary: { operations: number; entrees: number; sorties: number }
  auteurs: { id: string; nom: string }[]
}

// Ce qu'on envoie pour enregistrer une entrée ou une sortie (le lot, l'expiration et la provenance ne concernent que les entrées)
export interface MovementInput {
  medicineId: string
  quantite: number
  date: string
  motif: string
  numeroLot?: string
  dateExpiration?: string
  provenance?: string
}

// Ce que le serveur répond : surtout le stock réel après l'opération
export interface MovementResult {
  id: string
  type: "entree" | "sortie"
  quantite: number
  medicine: { id: string; nom: string; quantite: number }
}

// ─── Les appels ────────────────────────────────────────────────────────────────────────────────────

export async function fetchMedicines(): Promise<Medicine[]> {
  return (await apiFetch<ApiMedicine[]>("/medicines")).map(toMedicine)
}

export const fetchMedicine = (id: string) => apiFetch<ApiMedicine>(`/medicines/${id}`)

export const fetchCategories = () => apiFetch<ApiCategory[]>("/categories")

export const fetchMedicineMovements = (id: string, limit: number) =>
  apiFetch<Page<ApiMovement>>("/movements", { query: { medicineId: id, limit } })

export const fetchMovements = (filters: MovementFilters) => apiFetch<MovementsPage>("/movements", { query: { ...filters } })

export const fetchAlerts = (filters: AlertFilters) => apiFetch<AlertsPage>("/alerts", { query: { ...filters } })

// « Prendre en compte » : le serveur note la personne connectée, l'alerte reste affichée
export const acknowledgeAlert = (id: string) => apiFetch<ApiAlert>(`/alerts/${id}/acknowledge`, { method: "PATCH" })

// « Annuler » : l'alerte redevient active
export const reactivateAlert = (id: string) => apiFetch<ApiAlert>(`/alerts/${id}/reactivate`, { method: "PATCH" })

export const fetchUsers = (filters: UserFilters) => apiFetch<UsersPage>("/users", { query: { ...filters } })

export const createUser = (input: NewUserInput) => apiFetch<ApiUser>("/users", { method: "POST", body: input })

export const updateUser = (id: string, input: Partial<UserInput>) => apiFetch<ApiUser>(`/users/${id}`, { method: "PATCH", body: input })

export const deleteUser = (id: string) => apiFetch<void>(`/users/${id}`, { method: "DELETE" })

export const fetchDashboard = () => apiFetch<ApiDashboard>("/dashboard")

export const createMovement = (type: "entree" | "sortie", input: MovementInput) =>
  apiFetch<MovementResult>(`/movements/${type}`, { method: "POST", body: input })

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

// L'historique, filtré et paginé par le serveur. Quand un filtre change, le tableau précédent reste affiché pendant le chargement.
export function useMovements(filters: MovementFilters, enabled = true) {
  return useQuery({
    queryKey: keys.movements(filters),
    queryFn: () => fetchMovements(filters),
    enabled,
    placeholderData: keepPreviousData,
  })
}

// Les alertes en cours, filtrées et paginées par le serveur
export function useAlerts(filters: AlertFilters) {
  return useQuery({
    queryKey: keys.alerts(filters),
    queryFn: () => fetchAlerts(filters),
    placeholderData: keepPreviousData,
  })
}

// Le tableau de bord : un seul appel, partagé par tous les blocs de la page
export function useDashboard() {
  return useQuery({ queryKey: keys.dashboard, queryFn: fetchDashboard })
}

// Les utilisateurs de la structure (réservé aux administrateurs), filtrés et paginés par le serveur.
// « enabled » reste faux pour un gestionnaire : on ne demande rien qui serait refusé.
export function useUsers(filters: UserFilters, enabled = true) {
  return useQuery({
    queryKey: keys.users(filters),
    queryFn: () => fetchUsers(filters),
    enabled,
    placeholderData: keepPreviousData,
  })
}

// Après un changement d'utilisateur : la liste, et les chiffres « utilisateurs » du tableau de bord
export function useRefreshUsers() {
  const queryClient = useQueryClient()
  return () => Promise.all(["users", "dashboard"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
}