import type { ApiDashboard } from "@/lib/queries"

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#06B6D4"]
const OTHERS_COLOR = "#94A3B8"

// Les 7 derniers jours donnés par le serveur : entrées, sorties et stock total à la fin de chaque jour
export function toChartData(evolution: ApiDashboard["evolution"]) {
  return evolution.map((d) => ({
    jour: new Date(`${d.jour}T00:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    Entrées: d.entrees,
    Sorties: d.sorties,
    "Stock total": d.stockTotal,
  }))
}

// Le serveur donne les 5 plus grandes catégories, et le reste dans "Autres", avec les pourcentages
export function toSlices(repartition: ApiDashboard["repartition"]) {
  return repartition.categories.map((c, i) => ({
    name: c.nom,
    value: c.nombre,
    percent: c.pourcentage,
    color: c.nom === "Autres" ? OTHERS_COLOR : COLORS[i % COLORS.length],
  }))
}
