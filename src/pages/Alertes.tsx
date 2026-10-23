import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { BellRing, CalendarClock, PackageX, Search, SearchX, ShieldCheck, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import AlertCard from "@/components/alertes/AlertCard"
import FilterSelect from "@/components/common/FilterSelect"
import Pagination from "@/components/common/Pagination"
import { PageError, PageLoading } from "@/components/common/PageState"
import MedicineDetails from "@/components/medicaments/MedicineDetails"
import MovementDialog from "@/components/stocks/MovementDialog"
import { Input } from "@/components/ui/input"
import { acknowledgeAlert, describeError, reactivateAlert, useAlerts, useMedicines, type ApiAlert } from "@/lib/queries"
import { medLabel, type AlertPriority, type AlertType } from "@/lib/stock"
import { cn } from "@/lib/utils"

const PER_PAGE = 8
const ALL = "all"

type Status = "active" | "prise"

// Attend que la personne ait fini de taper avant d'interroger le serveur (sinon : une demande par lettre)
function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function Alertes() {
  const { medicines } = useMedicines()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [type, setType] = useState<AlertType | typeof ALL>(ALL)
  const [priorite, setPriorite] = useState<AlertPriority | typeof ALL>(ALL)
  const [statut, setStatut] = useState<Status | typeof ALL>(ALL)
  const [page, setPage] = useState(1)
  const [restockId, setRestockId] = useState<string | null>(null)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const debouncedSearch = useDebounced(search.trim())

  // Le serveur applique les filtres, trie (les critiques d'abord), pagine et calcule les cartes
  const query = useAlerts({
    page,
    limit: PER_PAGE,
    type: type === ALL ? undefined : type,
    niveau: priorite === ALL ? undefined : priorite,
    statut: statut === ALL ? undefined : statut === "prise" ? "prise_en_compte" : "active",
    search: debouncedSearch || undefined,
  })
  const data = query.data
  const alerts = data?.items ?? []
  const summary = data?.summary ?? { total: 0, rupture: 0, faible: 0, peremption: 0 }
  const total = data?.total ?? 0

  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const start = (page - 1) * PER_PAGE
  const detailsMedicine = medicines.find((m) => m.id === detailsId) ?? null
  const hasFilters = search !== "" || type !== ALL || priorite !== ALL || statut !== ALL

  const reset = () => {
    setSearch("")
    setType(ALL)
    setPriorite(ALL)
    setStatut(ALL)
    setPage(1)
  }

  // Prendre en compte, ou annuler : le serveur note la personne connectée
  const toggle = async (alert: ApiAlert) => {
    const acknowledged = alert.statut === "prise_en_compte"
    setBusyId(alert.id)
    try {
      if (acknowledged) {
        await reactivateAlert(alert.id)
        toast.success("Alerte réactivée", { description: medLabel(alert.medicine) })
      } else {
        await acknowledgeAlert(alert.id)
        toast.success("Alerte prise en compte", {
          description: `${medLabel(alert.medicine)} : elle reste visible tant que la situation n'est pas réglée.`,
        })
      }
      await Promise.all(["alerts", "dashboard"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
    } catch (err) {
      toast.error("Action impossible", { description: describeError(err) })
      // L'alerte a peut-être été résolue entre-temps : on relit la liste
      void queryClient.invalidateQueries({ queryKey: ["alerts"] })
    } finally {
      setBusyId(null)
    }
  }

  const cards = [
    { key: ALL, label: "Total alertes", value: summary.total, hint: "Toutes les alertes en cours", icon: BellRing, tone: "bg-[#2563EB]/10 text-[#2563EB]" },
    { key: "rupture", label: "Ruptures", value: summary.rupture, hint: "Stock à zéro", icon: PackageX, tone: "bg-[#EF4444]/10 text-[#EF4444]" },
    { key: "faible", label: "Stocks faibles", value: summary.faible, hint: "Seuil minimum atteint", icon: TriangleAlert, tone: "bg-[#F59E0B]/15 text-[#D97706]" },
    { key: "peremption", label: "Péremptions proches", value: summary.peremption, hint: "Lots qui expirent sous 90 jours", icon: CalendarClock, tone: "bg-[#F97316]/15 text-[#EA580C]" },
  ] as const

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F2747]">Alertes</h1>
        <p className="mt-1 text-[#64748B]">Surveillez les ruptures, les stocks faibles et les péremptions proches.</p>
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
                  placeholder="Rechercher un médicament..."
                  className="h-11 rounded-xl border-[#E2E8F0] bg-white pl-11"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <FilterSelect label="Type d'alerte" value={type} onChange={(v) => { setType(v as AlertType | typeof ALL); setPage(1) }}>
                  <option value={ALL}>Tous les types</option>
                  <option value="rupture">Rupture</option>
                  <option value="faible">Stock faible</option>
                  <option value="peremption">Péremption proche</option>
                </FilterSelect>
                <FilterSelect label="Priorité" value={priorite} onChange={(v) => { setPriorite(v as AlertPriority | typeof ALL); setPage(1) }}>
                  <option value={ALL}>Toutes les priorités</option>
                  <option value="critique">Critique</option>
                  <option value="avertissement">Avertissement</option>
                </FilterSelect>
                <FilterSelect label="Statut" value={statut} onChange={(v) => { setStatut(v as Status | typeof ALL); setPage(1) }}>
                  <option value={ALL}>Tous les statuts</option>
                  <option value="active">Actives</option>
                  <option value="prise">Prises en compte</option>
                </FilterSelect>
              </div>

              {hasFilters && (
                <button type="button" onClick={reset} className="text-sm font-medium text-[#2563EB] hover:underline">
                  Réinitialiser les filtres
                </button>
              )}
            </div>

            {summary.total === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <ShieldCheck className="size-10 text-[#10B981]" />
                <p className="mt-3 font-semibold text-[#0F2747]">Aucune alerte</p>
                <p className="mt-1 text-sm text-[#64748B]">Tous les stocks sont en ordre.</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <SearchX className="size-9 text-[#64748B]" />
                <p className="mt-3 font-semibold text-[#0F2747]">Aucune alerte ne correspond</p>
                <p className="mt-1 text-sm text-[#64748B]">Modifiez votre recherche ou vos filtres.</p>
              </div>
            ) : (
              <ul className={cn("divide-y divide-[#E2E8F0] transition-opacity", query.isPlaceholderData && "opacity-50")}>
                {alerts.map((alert) => (
                  <li key={alert.id}>
                    <AlertCard
                      alert={alert}
                      busy={busyId === alert.id}
                      onRestock={() => setRestockId(alert.medicine.id)}
                      onViewStock={() => navigate(`/stocks?medicament=${alert.medicine.id}`)}
                      onViewDetails={() => setDetailsId(alert.medicine.id)}
                      onToggle={() => void toggle(alert)}
                    />
                  </li>
                ))}
              </ul>
            )}

            <Pagination page={page} pages={pages} start={start} shown={alerts.length} total={total} onChange={setPage} />
          </div>
        </>
      )}

      <MedicineDetails medicine={detailsMedicine} onClose={() => setDetailsId(null)} />
      {restockId && <MovementDialog type="entree" medicineId={restockId} onClose={() => setRestockId(null)} />}
    </div>
  )
}