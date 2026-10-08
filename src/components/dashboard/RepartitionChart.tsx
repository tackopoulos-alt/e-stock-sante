import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { ChartPie } from "lucide-react"
import { medicines } from "@/data/mockData"

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#06B6D4"]
const OTHERS_COLOR = "#94A3B8"
const MAX_SLICES = 5

// Nombre de médicaments par catégorie : les 5 plus grandes, le reste dans "Autres"
function buildData() {
  const counts = new Map<string, number>()
  for (const m of medicines) counts.set(m.categorie, (counts.get(m.categorie) ?? 0) + 1)

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
  const main = sorted.slice(0, MAX_SLICES).map(([name, value], i) => ({ name, value, color: COLORS[i] }))
  const othersCount = sorted.slice(MAX_SLICES).reduce((sum, [, value]) => sum + value, 0)

  return othersCount > 0 ? [...main, { name: "Autres", value: othersCount, color: OTHERS_COLOR }] : main
}

export default function RepartitionChart() {
  const data = buildData()
  const total = medicines.length

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2.5">
        <ChartPie className="size-5 text-[#2563EB]" />
        <h2 className="text-base font-semibold text-[#0F2747]">Répartition des médicaments</h2>
      </div>

      <div className="relative mx-auto h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={80} paddingAngle={3} stroke="none">
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#0F2747]">{total}</span>
          <span className="text-xs text-[#64748B]">médicaments</span>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-[#172033]">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              {slice.name}
            </span>
            <span className="font-semibold text-[#0F2747]">{Math.round((slice.value / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
