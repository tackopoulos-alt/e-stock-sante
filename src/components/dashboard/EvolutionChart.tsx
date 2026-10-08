import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChevronDown, TrendingUp } from "lucide-react"
import { medicines, movements } from "@/data/mockData"

const fmt = (n: number) => n.toLocaleString("fr-FR")

// Entrées, sorties et stock total pour chacun des 7 derniers jours
function buildData() {
  const currentStock = medicines.reduce((sum, m) => sum + m.quantite, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date()
    day.setDate(day.getDate() - (6 - i))
    const dayKey = day.toDateString()

    const ofDay = movements.filter((mv) => new Date(mv.date).toDateString() === dayKey)
    const entrees = ofDay.filter((mv) => mv.type === "entree").reduce((s, mv) => s + mv.quantite, 0)
    const sorties = ofDay.filter((mv) => mv.type === "sortie").reduce((s, mv) => s + mv.quantite, 0)

    // Stock à la fin de ce jour = stock actuel moins l'effet des mouvements des jours suivants
    const endOfDay = new Date(day)
    endOfDay.setHours(23, 59, 59, 999)
    const effectAfter = movements
      .filter((mv) => new Date(mv.date) > endOfDay)
      .reduce((s, mv) => s + (mv.type === "entree" ? mv.quantite : -mv.quantite), 0)

    return {
      jour: day.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      Entrées: entrees,
      Sorties: sorties,
      "Stock total": currentStock - effectAfter,
    }
  })
}

export default function EvolutionChart() {
  const data = buildData()

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="size-5 text-[#2563EB]" />
          <h2 className="text-base font-semibold text-[#0F2747]">Évolution des stocks</h2>
        </div>
        <div className="relative">
          <select
            aria-label="Période"
            defaultValue="7"
            className="h-9 appearance-none rounded-lg border border-[#E2E8F0] bg-white pl-3 pr-8 text-sm text-[#172033]"
          >
            <option value="7">7 derniers jours</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="jour" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#64748B" }}
              tickFormatter={fmt}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#8B5CF6" }}
              tickFormatter={fmt}
            />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 13 }} />
            <Line yAxisId="left" type="monotone" dataKey="Entrées" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line yAxisId="left" type="monotone" dataKey="Sorties" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="Stock total" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}