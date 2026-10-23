import type { ReactNode } from "react"
import { ArrowDownRight, ArrowUpRight, Boxes, Pill, TriangleAlert, Users } from "lucide-react"
import StatCard from "@/components/dashboard/StatCard"
import type { ApiDashboard } from "@/lib/queries"
import { cn } from "@/lib/utils"

const fmt = (n: number) => n.toLocaleString("fr-FR")
const plural = (n: number, singulier: string, pluriel: string) => `${n} ${n > 1 ? pluriel : singulier}`

function Chip({ className, children }: { className: string; children: ReactNode }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", className)}>{children}</span>
}

// Les quatre cartes du haut : les chiffres viennent du serveur
export default function StatsCards({ stats }: { stats: ApiDashboard["stats"] }) {
  const { medicaments, stock, alertes, utilisateurs } = stats
  const todayNet = stock.variationAujourdhui

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total médicaments" value={fmt(medicaments.total)} icon={<Pill className="size-6" />}>
        <p className="text-[#64748B]">dans {plural(medicaments.categories, "catégorie", "catégories")}</p>
      </StatCard>

      <StatCard title="Stock en quantité" value={fmt(stock.quantiteTotale)} icon={<Boxes className="size-6" />}>
        {todayNet === 0 ? (
          <p className="text-[#64748B]">Aucun mouvement aujourd'hui</p>
        ) : (
          <p className={cn("flex items-center gap-1 font-medium", todayNet > 0 ? "text-[#10B981]" : "text-[#64748B]")}>
            {todayNet > 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
            {todayNet > 0 ? "+" : "−"}
            {fmt(Math.abs(todayNet))} aujourd'hui
          </p>
        )}
      </StatCard>

      <StatCard title="Médicaments en alerte" value={alertes.medicamentsEnAlerte} icon={<TriangleAlert className="size-6" />} tone="alert">
        <div className="flex flex-wrap gap-1.5">
          <Chip className="bg-[#F59E0B]/15 text-[#B45309]">{plural(alertes.faibles, "faible", "faibles")}</Chip>
          <Chip className="bg-[#EF4444]/15 text-[#B91C1C]">{plural(alertes.ruptures, "rupture", "ruptures")}</Chip>
          <Chip className="bg-[#F97316]/15 text-[#C2410C]">{plural(alertes.peremptions, "péremption", "péremptions")}</Chip>
        </div>
      </StatCard>

      <StatCard title="Utilisateurs actifs" value={utilisateurs.actifs} icon={<Users className="size-6" />}>
        <p className="text-[#64748B]">
          dont {plural(utilisateurs.administrateurs, "administrateur", "administrateurs")}
          {utilisateurs.enAttente > 0 && ` · ${utilisateurs.enAttente} en attente`}
        </p>
      </StatCard>
    </div>
  )
}