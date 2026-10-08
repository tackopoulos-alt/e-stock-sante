
import { Link } from "react-router-dom"
import { Package, ShieldCheck } from "lucide-react"
import { medicines } from "@/data/mockData"
import { getLevel, medLabel } from "@/lib/stock"
import { cn } from "@/lib/utils"

export default function ProduitsProchesRupture() {
  // Stock qui a atteint son seuil minimum, les plus proches de zéro d'abord
  const rows = medicines
    .filter((m) => getLevel(m) !== "normal")
    .sort((a, b) => a.quantite / a.seuilMin - b.quantite / b.seuilMin)
    .slice(0, 5)

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Package className="size-5 text-[#2563EB]" />
          <h2 className="text-base font-semibold text-[#0F2747]">Produits proches de la rupture</h2>
        </div>
        <Link to="/stocks" className="shrink-0 text-sm font-medium text-[#2563EB] hover:underline">
          Voir tout →
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <ShieldCheck className="size-8 text-[#10B981]" />
          <p className="mt-2 text-sm font-medium text-[#0F2747]">Aucun produit à surveiller</p>
          <p className="text-sm text-[#64748B]">Tous les stocks sont au-dessus de leur seuil.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#64748B]">
              <th className="py-2 font-medium">Médicament</th>
              <th className="py-2 font-medium">Stock</th>
              <th className="py-2 text-right font-medium">Seuil</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const rupture = getLevel(m) === "rupture"
              return (
                <tr key={m.id} className="border-t border-[#E2E8F0]">
                  <td className="max-w-0 truncate py-3 pr-2 font-medium text-[#0F2747]">{medLabel(m)}</td>
                  <td className="py-3">
                    <span className="flex items-center gap-2 font-semibold text-[#172033]">
                      <span className={cn("size-2.5 rounded-full", rupture ? "bg-[#EF4444]" : "bg-[#F59E0B]")} />
                      {m.quantite}
                    </span>
                  </td>
                  <td className="py-3 text-right text-[#64748B]">{m.seuilMin}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}