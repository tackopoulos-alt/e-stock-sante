import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ArrowDownToLine, ArrowUpFromLine, History, Search, SearchX } from "lucide-react"
import FilterSelect from "@/components/common/FilterSelect"
import Pagination from "@/components/common/Pagination"
import { PageError, PageLoading } from "@/components/common/PageState"
import { Input } from "@/components/ui/input"
import { formatDateTime, initials } from "@/lib/format"
import { useMedicines, useMovements } from "@/lib/queries"
import { medLabel } from "@/lib/stock"
import type { MovementType } from "@/lib/types"
import { cn } from "@/lib/utils"

const PER_PAGE = 10
const ALL = "all"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const fmt = (n: number) => n.toLocaleString("fr-FR")

// Attend que la personne ait fini de taper avant d'interroger le serveur (sinon : une demande par lettre)
function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function Historique() {
  const { medicines } = useMedicines()
  const [params] = useSearchParams()

  const [search, setSearch] = useState("")
  // Venu du menu "Historique" d'un médicament : le filtre est déjà réglé sur lui
  const [medicineId, setMedicineId] = useState(() => {
    const id = params.get("medicament")
    return id && UUID.test(id) ? id : ALL
  })
  const [type, setType] = useState<MovementType | typeof ALL>(ALL)
  const [userId, setUserId] = useState(ALL)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)

  const invalidRange = from !== "" && to !== "" && from > to
  const debouncedSearch = useDebounced(search.trim())

  // Le serveur applique tous les filtres, trie, pagine et calcule les cartes
  const history = useMovements(
    {
      page,
      limit: PER_PAGE,
      medicineId: medicineId === ALL ? undefined : medicineId,
      userId: userId === ALL ? undefined : userId,
      type: type === ALL ? undefined : type,
      from: from || undefined,
      to: to || undefined,
      search: debouncedSearch || undefined,
    },
    !invalidRange,
  )
  const data = history.data
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const authors = data?.auteurs ?? []
  const sortedMedicines = [...medicines].sort((a, b) => a.nom.localeCompare(b.nom, "fr"))

  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const start = (page - 1) * PER_PAGE
  const hasFilters = search !== "" || medicineId !== ALL || type !== ALL || userId !== ALL || from !== "" || to !== ""

  const reset = () => {
    setSearch("")
    setMedicineId(ALL)
    setType(ALL)
    setUserId(ALL)
    setFrom("")
    setTo("")
    setPage(1)
  }

  const cards = [
    { key: ALL, label: "Opérations", value: String(data?.summary.operations ?? 0), hint: "Entrées et sorties", icon: History, tone: "bg-[#2563EB]/10 text-[#2563EB]" },
    { key: "entree", label: "Entrées", value: `+${fmt(data?.summary.entrees ?? 0)}`, hint: "Unités reçues", icon: ArrowDownToLine, tone: "bg-[#10B981]/10 text-[#10B981]" },
    { key: "sortie", label: "Sorties", value: `−${fmt(data?.summary.sorties ?? 0)}`, hint: "Unités sorties", icon: ArrowUpFromLine, tone: "bg-[#2563EB]/10 text-[#2563EB]" },
  ] as const

  const loading = history.isPending && !invalidRange && !data

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F2747]">Historique des mouvements</h1>
        <p className="mt-1 text-[#64748B]">Consultez toutes les entrées et sorties, de la plus récente à la plus ancienne.</p>
      </div>

      {loading ? (
        <PageLoading />
      ) : history.isError && !data ? (
        <PageError error={history.error} onRetry={() => void history.refetch()} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {cards.map(({ key, label, value, hint, icon: Icon, tone }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setType(key === ALL || type === key ? ALL : key)
                  setPage(1)
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors hover:border-[#2563EB]/40",
                  type === key || (key === ALL && type === ALL) ? "border-[#2563EB] ring-1 ring-[#2563EB]/30" : "border-[#E2E8F0]",
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
                  placeholder="Rechercher un médicament ou un motif..."
                  className="h-11 rounded-xl border-[#E2E8F0] bg-white pl-11"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <FilterSelect label="Médicament" value={medicineId} onChange={(v) => { setMedicineId(v); setPage(1) }}>
                  <option value={ALL}>Tous les médicaments</option>
                  {sortedMedicines.map((m) => (
                    <option key={m.id} value={m.id}>{medLabel(m)}</option>
                  ))}
                </FilterSelect>
                <FilterSelect label="Opération" value={type} onChange={(v) => { setType(v as MovementType | typeof ALL); setPage(1) }}>
                  <option value={ALL}>Toutes les opérations</option>
                  <option value="entree">Entrées</option>
                  <option value="sortie">Sorties</option>
                </FilterSelect>
                <FilterSelect label="Utilisateur" value={userId} onChange={(v) => { setUserId(v); setPage(1) }}>
                  <option value={ALL}>Tous les utilisateurs</option>
                  {authors.map((u) => (
                    <option key={u.id} value={u.id}>{u.nom}</option>
                  ))}
                </FilterSelect>
                <div className="flex items-center gap-2">
                  <label htmlFor="du" className="text-sm text-[#64748B]">Du</label>
                  <Input
                    id="du"
                    type="date"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value)
                      setPage(1)
                    }}
                    className="h-11 rounded-xl border-[#E2E8F0] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="au" className="text-sm text-[#64748B]">Au</label>
                  <Input
                    id="au"
                    type="date"
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value)
                      setPage(1)
                    }}
                    className="h-11 rounded-xl border-[#E2E8F0] bg-white"
                  />
                </div>
              </div>

              {invalidRange && (
                <p role="alert" className="text-sm text-[#EF4444]">
                  La date de début est après la date de fin.
                </p>
              )}

              {hasFilters && (
                <button type="button" onClick={reset} className="text-sm font-medium text-[#2563EB] hover:underline">
                  Réinitialiser les filtres
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <SearchX className="size-9 text-[#64748B]" />
                <p className="mt-3 font-semibold text-[#0F2747]">Aucune opération trouvée</p>
                <p className="mt-1 text-sm text-[#64748B]">Modifiez votre recherche ou vos filtres.</p>
              </div>
            ) : (
              <div className={cn("overflow-x-auto transition-opacity", history.isPlaceholderData && "opacity-50")}>
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-left text-xs text-[#64748B]">
                      <th className="px-4 py-3 font-medium">Date et heure</th>
                      <th className="px-4 py-3 font-medium">Utilisateur</th>
                      <th className="px-4 py-3 font-medium">Médicament</th>
                      <th className="px-4 py-3 font-medium">Opération</th>
                      <th className="px-4 py-3 text-right font-medium">Quantité</th>
                      <th className="px-4 py-3 font-medium">Motif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((mv) => {
                      const entree = mv.type === "entree"

                      return (
                        <tr key={mv.id} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC]">
                          <td className="whitespace-nowrap px-4 py-3.5 text-[#475569]">{formatDateTime(mv.date)}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/10 text-xs font-bold text-[#2563EB]">
                                {initials(mv.user.nom)}
                              </span>
                              <span className="text-[#172033]">{mv.user.nom}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-[#0F2747]">{medLabel(mv.medicine)}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                                entree ? "bg-[#10B981]/10 text-[#047857]" : "bg-[#2563EB]/10 text-[#1D4ED8]",
                              )}
                            >
                              {entree ? <ArrowDownToLine className="size-3.5" /> : <ArrowUpFromLine className="size-3.5" />}
                              {entree ? "Entrée" : "Sortie"}
                            </span>
                          </td>
                          <td className={cn("px-4 py-3.5 text-right font-bold", entree ? "text-[#10B981]" : "text-[#2563EB]")}>
                            {entree ? "+" : "−"}
                            {fmt(mv.quantite)}
                          </td>
                          <td className="px-4 py-3.5 text-[#475569]">{mv.motif}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination page={page} pages={pages} start={start} shown={items.length} total={total} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  )
}