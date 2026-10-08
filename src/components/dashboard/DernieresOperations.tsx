import { Link } from "react-router-dom"
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine } from "lucide-react"
import { useData } from "@/context/DataContext"
import { formatDateTime } from "@/lib/format"
import { medLabel } from "@/lib/stock"
import { cn } from "@/lib/utils"

export default function DernieresOperations() {
  const { medicines, movements } = useData()
  const last = [...movements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ArrowLeftRight className="size-5 text-[#2563EB]" />
          <h2 className="text-base font-semibold text-[#0F2747]">Dernières entrées / sorties</h2>
        </div>
        <Link to="/historique" className="shrink-0 text-sm font-medium text-[#2563EB] hover:underline">
          Voir tout →
        </Link>
      </div>

      <ul className="divide-y divide-[#E2E8F0]">
        {last.map((mv) => {
          const medicine = medicines.find((m) => m.id === mv.medicineId)
          if (!medicine) return null
          const entree = mv.type === "entree"

          return (
            <li key={mv.id} className="flex items-center gap-3 py-3">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  entree ? "bg-[#10B981]/10 text-[#10B981]" : "bg-[#2563EB]/10 text-[#2563EB]",
                )}
              >
                {entree ? <ArrowDownToLine className="size-[18px]" /> : <ArrowUpFromLine className="size-[18px]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#0F2747]">{medLabel(medicine)}</p>
                <p className="text-xs text-[#64748B]">
                  {entree ? "Entrée" : "Sortie"} · {formatDateTime(mv.date)}
                </p>
              </div>
              <span className={cn("shrink-0 text-sm font-bold", entree ? "text-[#10B981]" : "text-[#2563EB]")}>
                {entree ? "+" : "−"}
                {mv.quantite}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}