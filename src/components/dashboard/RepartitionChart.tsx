import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { ChartPie } from "lucide-react"
import { toSlices } from "@/lib/dashboard"
import type { ApiDashboard } from "@/lib/queries"

export default function RepartitionChart({ repartition }: { repartition: ApiDashboard["repartition"] }) {
  const data = toSlices(repartition)
  const total = repartition.total

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
            <span className="font-semibold text-[#0F2747]">{slice.percent} %</span>
          </li>
        ))}
      </ul>
    </div>
  )
}