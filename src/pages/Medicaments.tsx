import { useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, ChevronLeft, ChevronRight, CircleCheck, PackageX, Pill, Plus, Search, SearchX, TriangleAlert } from "lucide-react"
import LevelBadge from "@/components/common/LevelBadge"
import DeleteMedicineDialog from "@/components/medicaments/DeleteMedicineDialog"
import MedicineDetails from "@/components/medicaments/MedicineDetails"
import MedicineForm from "@/components/medicaments/MedicineForm"
import RowMenu from "@/components/medicaments/RowMenu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useData } from "@/context/DataContext"
import { getLevel, type StockLevel } from "@/lib/stock"
import { cn } from "@/lib/utils"
import type { Medicine } from "@/lib/types"

const PER_PAGE = 8
const ALL = "all"

// "Paracétamol" est trouvé en tapant "paracetamol"
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-[#E2E8F0] bg-white pl-3.5 pr-9 text-sm text-[#172033]"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
    </div>
  )
}

export default function Medicaments() {
  const { medicines } = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [categorie, setCategorie] = useState(ALL)
  const [forme, setForme] = useState(ALL)
  const [etat, setEtat] = useState<StockLevel | typeof ALL>(ALL)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Medicine | null>(null)
  const [deleting, setDeleting] = useState<Medicine | null>(null)

  const categories = [...new Set(medicines.map((m) => m.categorie))].sort((a, b) => a.localeCompare(b, "fr"))
  const formes = [...new Set(medicines.map((m) => m.forme))].sort((a, b) => a.localeCompare(b, "fr"))

  const counts = {
    total: medicines.length,
    normal: medicines.filter((m) => getLevel(m) === "normal").length,
    faible: medicines.filter((m) => getLevel(m) === "faible").length,
    rupture: medicines.filter((m) => getLevel(m) === "rupture").length,
  }

  const cards = [
    { key: ALL, label: "Total médicaments", value: counts.total, icon: Pill, tone: "bg-[#2563EB]/10 text-[#2563EB]" },
    { key: "normal", label: "Disponibles", value: counts.normal, icon: CircleCheck, tone: "bg-[#10B981]/10 text-[#10B981]" },
    { key: "faible", label: "Stock faible", value: counts.faible, icon: TriangleAlert, tone: "bg-[#F59E0B]/15 text-[#D97706]" },
    { key: "rupture", label: "Rupture", value: counts.rupture, icon: PackageX, tone: "bg-[#EF4444]/10 text-[#EF4444]" },
  ] as const

  const filtered = useMemo(() => {
    const q = normalize(search.trim())
    return medicines.filter(
      (m) =>
        (!q || normalize(`${m.nom} ${m.reference} ${m.laboratoire}`).includes(q)) &&
        (categorie === ALL || m.categorie === categorie) &&
        (forme === ALL || m.forme === forme) &&
        (etat === ALL || getLevel(m) === etat),
    )
  }, [medicines, search, categorie, forme, etat])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const current = Math.min(page, pages)
  const start = (current - 1) * PER_PAGE
  const visible = filtered.slice(start, start + PER_PAGE)
  const selected = medicines.find((m) => m.id === selectedId) ?? null
  const hasFilters = search !== "" || categorie !== ALL || forme !== ALL || etat !== ALL

  const reset = () => {
    setSearch("")
    setCategorie(ALL)
    setForme(ALL)
    setEtat(ALL)
    setPage(1)
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2747]">Médicaments</h1>
          <p className="mt-1 text-[#64748B]">Gérez le référentiel des médicaments disponibles dans votre structure.</p>
        </div>
        <Button onClick={() => setAdding(true)} className="h-11 bg-[#2563EB] px-5 text-white hover:bg-[#1D4ED8]">
          <Plus className="size-4" /> Ajouter un médicament
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, value, icon: Icon, tone }) => (
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
            <div>
              <p className="text-sm text-[#64748B]">{label}</p>
              <p className="text-2xl font-bold leading-tight text-[#0F2747]">{value}</p>
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
              placeholder="Rechercher par nom, référence ou laboratoire..."
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
            <FilterSelect label="Forme" value={forme} onChange={(v) => { setForme(v); setPage(1) }}>
              <option value={ALL}>Toutes les formes</option>
              {formes.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="État du stock" value={etat} onChange={(v) => { setEtat(v as StockLevel | typeof ALL); setPage(1) }}>
              <option value={ALL}>Tous les états</option>
              <option value="normal">Normal</option>
              <option value="faible">Stock faible</option>
              <option value="rupture">Rupture</option>
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
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] text-left text-xs text-[#64748B]">
                  <th className="px-4 py-3 font-medium">Médicament</th>
                  <th className="px-4 py-3 font-medium">Référence</th>
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 font-medium">Dosage</th>
                  <th className="px-4 py-3 font-medium">Forme</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Seuil</th>
                  <th className="px-4 py-3 font-medium">État</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className="cursor-pointer border-t border-[#E2E8F0] hover:bg-[#F8FAFC]"
                  >
                    <td className="px-4 py-3.5 font-semibold text-[#0F2747]">{m.nom}</td>
                    <td className="px-4 py-3.5 text-[#64748B]">{m.reference}</td>
                    <td className="px-4 py-3.5 text-[#172033]">{m.categorie}</td>
                    <td className="px-4 py-3.5 text-[#172033]">{m.dosage}</td>
                    <td className="px-4 py-3.5 text-[#172033]">{m.forme}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#0F2747]">{m.quantite}</td>
                    <td className="px-4 py-3.5 text-right text-[#64748B]">{m.seuilMin}</td>
                    <td className="px-4 py-3.5">
                      <LevelBadge level={getLevel(m)} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <RowMenu
                        label={m.nom}
                        onView={() => setSelectedId(m.id)}
                        onEdit={() => setEditing(m)}
                        onStock={() => navigate(`/stocks?medicament=${m.id}`)}
                        onHistory={() => navigate(`/historique?medicament=${m.id}`)}
                        onDelete={() => setDeleting(m)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] px-4 py-3 text-sm text-[#64748B]">
            <span>
              Affichage {start + 1}–{start + visible.length} sur {filtered.length}
            </span>
            {pages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Page précédente"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                  className="flex size-9 items-center justify-center rounded-lg border border-[#E2E8F0] hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={cn(
                      "size-9 rounded-lg text-sm font-medium",
                      n === current ? "bg-[#2563EB] text-white" : "border border-[#E2E8F0] text-[#172033] hover:bg-slate-50",
                    )}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Page suivante"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                  className="flex size-9 items-center justify-center rounded-lg border border-[#E2E8F0] hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <MedicineDetails medicine={selected} onClose={() => setSelectedId(null)} />
      {adding && <MedicineForm onClose={() => setAdding(false)} />}
      {editing && <MedicineForm key={editing.id} medicine={editing} onClose={() => setEditing(null)} />}
      <DeleteMedicineDialog medicine={deleting} onClose={() => setDeleting(null)} />
    </div>
  )
}