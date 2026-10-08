import type { ReactNode } from "react"
import { ArrowDownRight, ArrowUpRight, Boxes, Pill, TriangleAlert, Users } from "lucide-react"
import StatCard from "@/components/dashboard/StatCard"
import { useData } from "@/context/DataContext"
import { buildAlerts } from "@/lib/stock"
import { cn } from "@/lib/utils"

const fmt = (n: number) => n.toLocaleString("fr-FR")
const plural = (n: number, singulier: string, pluriel: string) => `${n} ${n > 1 ? pluriel : singulier}`

function Chip({ className, children }: { className: string; children: ReactNode }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", className)}>{children}</span>
}

export default function StatsCards() {
  const { lots, medicines, movements, users } = useData()
  const today = new Date()
  const alerts = buildAlerts(medicines, movements, lots)

  // Carte 1
  const categories = new Set(medicines.map((m) => m.categorie)).size

  // Carte 2 : quantité totale et variation du jour (entrées - sorties)
  const totalStock = medicines.reduce((sum, m) => sum + m.quantite, 0)
  const todayNet = movements
    .filter((mv) => new Date(mv.date).toDateString() === today.toDateString())
    .reduce((sum, mv) => sum + (mv.type === "entree" ? mv.quantite : -mv.quantite), 0)

  // Carte 3 : médicaments concernés et détail par type d'alerte
  const alertMedicines = new Set(alerts.map((a) => a.medicineId)).size
  const faibles = alerts.filter((a) => a.type === "faible").length
  const ruptures = alerts.filter((a) => a.type === "rupture").length
  const peremptions = alerts.filter((a) => a.type === "peremption").length

  // Carte 4
  const activeUsers = users.filter((u) => u.statut === "actif")
  const admins = activeUsers.filter((u) => u.role === "admin").length
  const pending = users.filter((u) => u.statut === "en_attente").length

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total médicaments" value={fmt(medicines.length)} icon={<Pill className="size-6" />}>
        <p className="text-[#64748B]">dans {plural(categories, "catégorie", "catégories")}</p>
      </StatCard>

      <StatCard title="Stock en quantité" value={fmt(totalStock)} icon={<Boxes className="size-6" />}>
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

      <StatCard title="Médicaments en alerte" value={alertMedicines} icon={<TriangleAlert className="size-6" />} tone="alert">
        <div className="flex flex-wrap gap-1.5">
          <Chip className="bg-[#F59E0B]/15 text-[#B45309]">{plural(faibles, "faible", "faibles")}</Chip>
          <Chip className="bg-[#EF4444]/15 text-[#B91C1C]">{plural(ruptures, "rupture", "ruptures")}</Chip>
          <Chip className="bg-[#F97316]/15 text-[#C2410C]">{plural(peremptions, "péremption", "péremptions")}</Chip>
        </div>
      </StatCard>

      <StatCard title="Utilisateurs actifs" value={activeUsers.length} icon={<Users className="size-6" />}>
        <p className="text-[#64748B]">
          dont {plural(admins, "administrateur", "administrateurs")}
          {pending > 0 && ` · ${pending} en attente`}
        </p>
      </StatCard>
    </div>
  )
}