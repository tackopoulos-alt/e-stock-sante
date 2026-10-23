import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CircleCheck,
  Eye,
  History,
  Minus,
  PackageX,
  Plus,
  Search,
  SearchX,
  TriangleAlert,
  X,
} from "lucide-react"
import ActionMenu from "@/components/common/ActionMenu"
import FilterSelect from "@/components/common/FilterSelect"
import LevelBadge from "@/components/common/LevelBadge"
import Pagination from "@/components/common/Pagination"
import { PageError, PageLoading } from "@/components/common/PageState"
import DernieresOperations from "@/components/dashboard/DernieresOperations"
import MedicineDetails from "@/components/medicaments/MedicineDetails"
import MovementDialog from "@/components/stocks/MovementDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMedicines } from "@/lib/queries"
import { getLevel, medLabel, type StockLevel } from "@/lib/stock"
import type { Medicine, MovementType } from "@/lib/types"
import { cn } from "@/lib/utils"

const PER_PAGE = 8
const ALL = "all"

type Sort = "nom" | "stock-asc" | "stock-desc" | "rupture"

// "Paracétamol" est trouvé en tapant "paracetamol"
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

// Plus le chiffre est petit, plus le médicament est proche de la rupture
const closeness = (m: Medicine) => (m.seuilMin > 0 ? m.quantite / m.seuilMin : m.quantite > 0 ? Infinity : 0)
const byName = (a: Medicine, b: Medicine) => a.nom.localeCompare(b.nom, "fr")

const sorters: Record<Sort, (a: Medicine, b: Medicine) => number> = {
  nom: byName,
  "stock-asc": (a, b) => a.quantite - b.quantite || byName(a, b),
  "stock-desc": (a, b) => b.quantite - a.quantite || byName(a, b),
  rupture: (a, b) => closeness(a) - closeness(b) || byName(a, b),
}

export default function Stocks() {
  const { medicines, loading, error, reload } = useMedicines()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const [search, setSearch] = useState("")
  const [categorie, setCategorie] = useState(ALL)
  const [etat, setEtat] = useState<StockLevel | typeof ALL>(ALL)
  const [sort, setSort] = useState<Sort>("nom")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ type: MovementType; medicineId?: string } | null>(null)

  // Venu du menu "Voir le stock" de la page Médicaments : on n'affiche que ce médicament
  const focus = medicines.find((m) => m.id === params.get("medicament")) ?? null

  const categories = [...new Set(medicines.map((m) => m.categorie))].sort((a, b) => a.localeCompare(b, "fr"))
  const totalStock = medicines.reduce((sum, m) => sum + m.quantite, 0)
  const count = (level: StockLevel) => medicines.filter((m) => getLevel(m) === level).length

  const filtered = useMemo(() => {
    const q = normalize(search.trim())
    return medicines
      .filter(
        (m) =>
          (!focus || m.id === focus.id) &&
          (!q || normalize(`${m.nom} ${m.reference} ${m.laboratoire}`).includes(q)) &&
          (categorie === ALL || m.categorie === categorie) &&
          (etat === ALL || getLevel(m) === etat),
      )
      .sort(sorters[sort])
  }, [medicines, focus, search, categorie, etat, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const current = Math.min(page, pages)
  const start = (current - 1) * PER_PAGE
  const visible = filtered.slice(start, start + PER_PAGE)
  const selected = medicines.find((m) => m.id === selectedId) ?? null
  const hasFilters = search !== "" || categorie !== ALL || etat !== ALL

  const reset = () => {
    setSearch("")
    setCategorie(ALL)
    setEtat(ALL)
    setPage(1)
  }

  const cards = [
    { key: ALL, label: "Stock total", value: totalStock.toLocaleString("fr-FR"), hint: "Quantité totale disponible", icon: Boxes, tone: "bg-[#2563EB]/10 text-[#2563EB]" },
    { key: "normal", label: "Stocks disponibles", value: count("normal"), hint: "Médicaments avec un stock normal", icon: CircleCheck, tone: "bg-[#10B981]/10 text-[#10B981]" },
    { key: "faible", label: "Stocks faibles", value: count("faible"), hint: "Seuil minimum atteint", icon: TriangleAlert, tone: "bg-[#F59E0B]/15 text-[#D97706]" },
    { key: "rupture", label: "Ruptures", value: count("rupture"), hint: "Stock actuellement à zéro", icon: PackageX, tone: "bg-[#EF4444]/10 text-[#EF4444]" },
  ] as const

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2747]">Gestion des stocks</h1>
          <p className="mt-1 text-[#64748B]">Suivez les quantités disponibles et gérez les mouvements de médicaments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDialog({ type: "entree" })} className="h-11 bg-[#10B981] px-5 text-white hover:bg-[#059669]">
            <Plus className="size-4" /> Nouvelle entrée
          </Button>
          <Button onClick={() => setDialog({ type: "sortie" })} className="h-11 bg-[#2563EB] px-5 text-white hover:bg-[#1D4ED8]">
            <Minus className="size-4" /> Nouvelle sortie
          </Button>
        </div>
      </div>

      {loading ? (
        <PageLoading />
      ) : error ? (
        <PageError error={error} onRetry={reload} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ key, label, value, hint, icon: Icon, tone }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setEtat(key === ALL || etat === key ? ALL : key)
                  setPage(1)
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors hover:border-[#2563EB]/40",
                  etat === key || (key === ALL && etat === ALL) ? "border-[#2563EB] ring-1 ring-[#2563EB]/30" : "border-[#E2E8F0]",
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
              <h2 className="text-base font-semibold text-[#0F2747]">État actuel du stock</h2>

              {focus && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-[#2563EB]/5 px-4 py-2.5 text-sm text-[#1E40AF]">
                  <span>
                    Filtré sur : <span className="font-semibold">{medLabel(focus)}</span>
                  </span>
                  <button
                    type="button"
                    aria-label="Retirer le filtre sur ce médicament"
                    onClick={() => setParams({}, { replace: true })}
                    className="rounded-lg p-1 hover:bg-[#2563EB]/10"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

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
                <FilterSelect label="Catégorie" value={categorie} onChange={(v) => { setCategorie(v); setPage(1) }}>
                  <option value={ALL}>Toutes les catégories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </FilterSelect>
                <FilterSelect label="État du stock" value={etat} onChange={(v) => { setEtat(v as StockLevel | typeof ALL); setPage(1) }}>
                  <option value={ALL}>Tous les états</option>
                  <option value="normal">Normal</option>
                  <option value="faible">Stock faible</option>
                  <option value="rupture">Rupture</option>
                </FilterSelect>
                <FilterSelect label="Trier par" value={sort} onChange={(v) => { setSort(v as Sort); setPage(1) }}>
                  <option value="nom">Trier : nom (A–Z)</option>
                  <option value="rupture">Trier : plus proche de la rupture</option>
                  <option value="stock-asc">Trier : stock croissant</option>
                  <option value="stock-desc">Trier : stock décroissant</option>
                </FilterSelect>
              </div>

              {hasFilters && (
                <button type="button" onClick={reset} className="text-sm font-medium text-[#2563EB] hover:underline">
                  Réinitialiser les filtres
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <SearchX className="size-9 text-[#64748B]" />
                <p className="mt-3 font-semibold text-[#0F2747]">Aucun médicament trouvé</p>
                <p className="mt-1 text-sm text-[#64748B]">Modifiez votre recherche ou vos filtres.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-left text-xs text-[#64748B]">
                      <th className="px-4 py-3 font-medium">Médicament</th>
                      <th className="px-4 py-3 font-medium">Catégorie</th>
                      <th className="px-4 py-3 font-medium">Stock actuel / seuil</th>
                      <th className="px-4 py-3 font-medium">État</th>
                      <th className="px-4 py-3 font-medium">Dernière opération</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((m) => {
                      const level = getLevel(m)
                      const fill = m.seuilMin > 0 ? Math.min(100, (m.quantite / m.seuilMin) * 100) : m.quantite > 0 ? 100 : 0
                      const barColor = level === "normal" ? "bg-[#10B981]" : level === "faible" ? "bg-[#F59E0B]" : "bg-[#EF4444]"
                      const last = m.dernierMouvement

                      return (
                        <tr
                          key={m.id}
                          onClick={() => setSelectedId(m.id)}
                          className="cursor-pointer border-t border-[#E2E8F0] hover:bg-[#F8FAFC]"
                        >
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-[#0F2747]">{m.nom}</p>
                            <p className="text-xs text-[#64748B]">{m.dosage} · {m.forme}</p>
                          </td>
                          <td className="px-4 py-3.5 text-[#172033]">{m.categorie}</td>
                          <td className="min-w-44 px-4 py-3.5">
                            <p className="text-[#64748B]">
                              <span className="text-base font-bold text-[#0F2747]">{m.quantite}</span> / {m.seuilMin}
                            </p>
                            <div className="mt-1.5 h-1.5 w-full max-w-36 rounded-full bg-slate-200">
                              <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${fill}%` }} />
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <LevelBadge level={level} />
                          </td>
                          <td className="px-4 py-3.5">
                            {last ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                                    last.type === "entree" ? "bg-[#10B981]/10 text-[#047857]" : "bg-[#2563EB]/10 text-[#1D4ED8]",
                                  )}
                                >
                                  {last.type === "entree" ? "Entrée" : "Sortie"}
                                </span>
                                <span className="text-xs text-[#64748B]">{new Date(last.date).toLocaleDateString("fr-FR")}</span>
                              </div>
                            ) : (
                              <span className="text-[#64748B]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <ActionMenu
                              label={m.nom}
                              items={[
                                { label: "Voir détails", icon: Eye, onClick: () => setSelectedId(m.id) },
                                { label: "Enregistrer une entrée", icon: ArrowDownToLine, onClick: () => setDialog({ type: "entree", medicineId: m.id }) },
                                { label: "Enregistrer une sortie", icon: ArrowUpFromLine, onClick: () => setDialog({ type: "sortie", medicineId: m.id }), disabled: m.quantite === 0 },
                                { label: "Voir l'historique", icon: History, onClick: () => navigate(`/historique?medicament=${m.id}`) },
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

            <Pagination page={current} pages={pages} start={start} shown={visible.length} total={filtered.length} onChange={setPage} />
          </div>
        </>
      )}

      <div className="mt-6">
        <DernieresOperations />
      </div>

      <MedicineDetails medicine={selected} onClose={() => setSelectedId(null)} />
      {dialog && <MovementDialog type={dialog.type} medicineId={dialog.medicineId} onClose={() => setDialog(null)} />}
    </div>
  )
}