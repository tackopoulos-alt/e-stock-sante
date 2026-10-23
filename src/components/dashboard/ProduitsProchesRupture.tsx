import { Link } from "react-router-dom"
import { Package, ShieldCheck } from "lucide-react"
import type { ApiDashboard } from "@/lib/queries"
import { medLabel } from "@/lib/stock"
import { cn } from "@/lib/utils"

// Les cinq médicaments dont le stock a atteint le seuil, les plus proches de zéro d'abord (classés par le serveur)
export default function ProduitsProchesRupture({ rows }: { rows: ApiDashboard["produitsProchesRupture"] }) {
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
            {rows.map((row) => (
              <tr key={row.medicine.id} className="border-t border-[#E2E8F0]">
                <td className="max-w-0 truncate py-3 pr-2 font-medium text-[#0F2747]">{medLabel(row.medicine)}</td>
                <td className="py-3">
                  <span className="flex items-center gap-2 font-semibold text-[#172033]">
                    <span className={cn("size-2.5 rounded-full", row.niveau === "rupture" ? "bg-[#EF4444]" : "bg-[#F59E0B]")} />
                    {row.quantite}
                  </span>
                </td>
                <td className="py-3 text-right text-[#64748B]">{row.seuilMin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}