import { useEffect, useState } from "react"
import { Clock, Pencil, Plus, Search, SearchX, ShieldAlert, Trash2, UserCheck, UserX, Users } from "lucide-react"
import { toast } from "sonner"
import ActionMenu from "@/components/common/ActionMenu"
import FilterSelect from "@/components/common/FilterSelect"
import Pagination from "@/components/common/Pagination"
import { PageError, PageLoading } from "@/components/common/PageState"
import DeleteUserDialog from "@/components/utilisateurs/DeleteUserDialog"
import UserForm from "@/components/utilisateurs/UserForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { describeError, updateUser, useRefreshUsers, useUsers, type ApiUser, type ApiUserRow } from "@/lib/queries"
import { useProfile } from "@/lib/useProfile"
import { cn } from "@/lib/utils"

const PER_PAGE = 8
const ALL = "all"

type UserStatus = ApiUser["statut"]

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

const statusStyles: Record<UserStatus, { label: string; badge: string; dot: string }> = {
  actif: { label: "Actif", badge: "bg-[#10B981]/10 text-[#047857]", dot: "bg-[#10B981]" },
  en_attente: { label: "En attente", badge: "bg-[#F59E0B]/15 text-[#B45309]", dot: "bg-[#F59E0B]" },
  inactif: { label: "Désactivé", badge: "bg-slate-100 text-[#475569]", dot: "bg-slate-400" },
}

// Attend que la personne ait fini de taper avant d'interroger le serveur (sinon : une demande par lettre)
function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function Utilisateurs() {
  const profile = useProfile()
  const refresh = useRefreshUsers()
  // La gestion des utilisateurs est réservée aux administrateurs : le serveur refuse les autres, et on ne lui demande rien
  const isAdmin = profile?.role === "admin"

  const [search, setSearch] = useState("")
  const [role, setRole] = useState<ApiUser["role"] | typeof ALL>(ALL)
  const [statut, setStatut] = useState<UserStatus | typeof ALL>(ALL)
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<ApiUserRow | null>(null)
  const [deleting, setDeleting] = useState<ApiUserRow | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const debouncedSearch = useDebounced(search.trim())

  // Le serveur applique les filtres, trie par nom, pagine et calcule les cartes
  const query = useUsers(
    {
      page,
      limit: PER_PAGE,
      role: role === ALL ? undefined : role,
      statut: statut === ALL ? undefined : statut,
      search: debouncedSearch || undefined,
    },
    isAdmin,
  )
  const data = query.data
  const users = data?.items ?? []
  const summary = data?.summary ?? { total: 0, actifs: 0, administrateurs: 0, enAttente: 0 }
  const total = data?.total ?? 0

  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const start = (page - 1) * PER_PAGE
  const hasFilters = search !== "" || role !== ALL || statut !== ALL

  const reset = () => {
    setSearch("")
    setRole(ALL)
    setStatut(ALL)
    setPage(1)
  }

  const changeStatus = async (user: ApiUserRow, next: UserStatus, success: string) => {
    setBusyId(user.id)
    try {
      await updateUser(user.id, { statut: next })
      void refresh()
      toast.success(success, { description: user.nom })
    } catch (err) {
      toast.error("Action impossible", { description: describeError(err) })
    } finally {
      setBusyId(null)
    }
  }

  const cards = [
    { key: ALL, label: "Total utilisateurs", value: summary.total, hint: "Tous les comptes", icon: Users, tone: "bg-[#2563EB]/10 text-[#2563EB]" },
    { key: "actif", label: "Actifs", value: summary.actifs, hint: "Peuvent se connecter", icon: UserCheck, tone: "bg-[#10B981]/10 text-[#10B981]" },
    { key: "en_attente", label: "En attente", value: summary.enAttente, hint: "À valider", icon: Clock, tone: "bg-[#F59E0B]/15 text-[#D97706]" },
    { key: "inactif", label: "Désactivés", value: summary.total - summary.actifs - summary.enAttente, hint: "Accès suspendu", icon: UserX, tone: "bg-slate-100 text-[#475569]" },
  ] as const

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-[#E2E8F0] bg-white px-6 py-20 text-center shadow-sm">
        <ShieldAlert className="size-10 text-[#F59E0B]" />
        <h1 className="mt-4 text-xl font-bold text-[#0F2747]">Accès réservé aux administrateurs</h1>
        <p className="mt-1 max-w-md text-sm text-[#64748B]">
          La gestion des utilisateurs est réservée aux administrateurs de votre structure. Contactez l'un d'eux si vous avez besoin d'un accès.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2747]">Utilisateurs</h1>
          <p className="mt-1 text-[#64748B]">Gérez les comptes et les droits d'accès à la plateforme.</p>
        </div>
        <Button onClick={() => setAdding(true)} className="h-11 bg-[#2563EB] px-5 text-white hover:bg-[#1D4ED8]">
          <Plus className="size-4" /> Ajouter un utilisateur
        </Button>
      </div>

      {query.isPending && !data ? (
        <PageLoading />
      ) : query.isError && !data ? (
        <PageError error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ key, label, value, hint, icon: Icon, tone }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setStatut(key === ALL || statut === key ? ALL : key)
                  setPage(1)
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors hover:border-[#2563EB]/40",
                  statut === key || (key === ALL && statut === ALL) ? "border-[#2563EB] ring-1 ring-[#2563EB]/30" : "border-[#E2E8F0]",
                )}
              >
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tone)}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#64748B]">{label}</p>
                  <p className="text-2xl font-bold leading-tight text-[#0F2747]">{value}</p>
                  <p className="truncate text-xs text-[#64748B]">{hint}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="space-y-3 border-b border-[#E2E8F0] p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#64748B]" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Rechercher un nom ou une adresse e-mail..."
                  className="h-11 rounded-xl border-[#E2E8F0] bg-white pl-11"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FilterSelect label="Rôle" value={role} onChange={(v) => { setRole(v as ApiUser["role"] | typeof ALL); setPage(1) }}>
                  <option value={ALL}>Tous les rôles</option>
                  <option value="admin">Administrateur</option>
                  <option value="gestionnaire">Gestionnaire</option>
                </FilterSelect>
                <FilterSelect label="Statut" value={statut} onChange={(v) => { setStatut(v as UserStatus | typeof ALL); setPage(1) }}>
                  <option value={ALL}>Tous les statuts</option>
                  <option value="actif">Actif</option>
                  <option value="en_attente">En attente</option>
                  <option value="inactif">Désactivé</option>
                </FilterSelect>
              </div>

              {hasFilters && (
                <button type="button" onClick={reset} className="text-sm font-medium text-[#2563EB] hover:underline">
                  Réinitialiser les filtres
                </button>
              )}
            </div>

            {users.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <SearchX className="size-9 text-[#64748B]" />
                <p className="mt-3 font-semibold text-[#0F2747]">Aucun utilisateur trouvé</p>
                <p className="mt-1 text-sm text-[#64748B]">Modifiez votre recherche ou vos filtres.</p>
              </div>
            ) : (
              <div className={cn("overflow-x-auto transition-opacity", query.isPlaceholderData && "opacity-50")}>
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-left text-xs text-[#64748B]">
                      <th className="px-4 py-3 font-medium">Utilisateur</th>
                      <th className="px-4 py-3 font-medium">Fonction</th>
                      <th className="px-4 py-3 font-medium">Structure</th>
                      <th className="px-4 py-3 font-medium">Rôle</th>
                      <th className="px-4 py-3 font-medium">Statut</th>
                      <th className="px-4 py-3 text-right font-medium">Opérations</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSelf = u.id === profile?.id
                      const s = statusStyles[u.statut]

                      return (
                        <tr key={u.id} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC]">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/10 text-xs font-bold text-[#2563EB]">
                                {initials(u.nom)}
                              </span>
                              <div>
                                <p className="font-semibold text-[#0F2747]">
                                  {u.nom} {isSelf && <span className="text-xs font-normal text-[#64748B]">(vous)</span>}
                                </p>
                                <p className="text-xs text-[#64748B]">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-[#172033]">{u.fonction}</td>
                          <td className="px-4 py-3.5">
                            <p className="text-[#172033]">{u.structure.nom}</p>
                            <p className="text-xs text-[#64748B]">{u.structure.type}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-xs font-semibold",
                                u.role === "admin" ? "bg-[#2563EB]/10 text-[#1D4ED8]" : "bg-slate-100 text-[#475569]",
                              )}
                            >
                              {u.role === "admin" ? "Administrateur" : "Gestionnaire"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", s.badge)}>
                              <span className={cn("size-1.5 rounded-full", s.dot)} />
                              {s.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-semibold text-[#0F2747]">{u.operations}</td>
                          <td className="px-4 py-2 text-right">
                            <ActionMenu
                              label={u.nom}
                              items={[
                                { label: "Modifier", icon: Pencil, onClick: () => setEditing(u) },
                                ...(u.statut === "en_attente"
                                  ? [{ label: "Valider le compte", icon: UserCheck, onClick: () => void changeStatus(u, "actif", "Compte validé"), disabled: busyId === u.id }]
                                  : []),
                                ...(u.statut === "actif"
                                  ? [{ label: "Désactiver", icon: UserX, onClick: () => void changeStatus(u, "inactif", "Compte désactivé"), disabled: isSelf || busyId === u.id }]
                                  : []),
                                ...(u.statut === "inactif"
                                  ? [{ label: "Réactiver", icon: UserCheck, onClick: () => void changeStatus(u, "actif", "Compte réactivé"), disabled: busyId === u.id }]
                                  : []),
                                { label: "Supprimer", icon: Trash2, onClick: () => setDeleting(u), danger: true, separatorBefore: true },
                              ]}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination page={page} pages={pages} start={start} shown={users.length} total={total} onChange={setPage} />
          </div>
        </>
      )}

      {adding && <UserForm onClose={() => setAdding(false)} />}
      {editing && <UserForm key={editing.id} user={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteUserDialog key={deleting.id} user={deleting} onClose={() => setDeleting(null)} />}
    </div>
  )
}