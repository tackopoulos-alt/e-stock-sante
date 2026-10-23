import { Link } from "react-router-dom"
import { BellRing, CalendarClock, PackageX, ShieldCheck, TriangleAlert } from "lucide-react"
import { timeAgo } from "@/lib/format"
import type { ApiDashboard } from "@/lib/queries"
import { medLabel, type AlertType } from "@/lib/stock"
import { cn } from "@/lib/utils"

const icons = { rupture: PackageX, faible: TriangleAlert, peremption: CalendarClock } satisfies Record<AlertType, unknown>

// Les cinq alertes les plus importantes, données par le serveur (les critiques d'abord)
export default function AlertesRecentes({ alerts }: { alerts: ApiDashboard["alertesRecentes"] }) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BellRing className="size-5 text-[#2563EB]" />
          <h2 className="text-base font-semibold text-[#0F2747]">Alertes récentes</h2>
        </div>
        <Link to="/alertes" className="text-sm font-medium text-[#2563EB] hover:underline">
          Voir tout →
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <ShieldCheck className="size-8 text-[#10B981]" />
          <p className="mt-2 text-sm font-medium text-[#0F2747]">Aucune alerte</p>
          <p className="text-sm text-[#64748B]">Tous les stocks sont en ordre.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#E2E8F0]">
          {alerts.map((alert) => {
            const Icon = icons[alert.type]
            const critique = alert.niveau === "critique"

            return (
              <li key={alert.id} className="flex items-start gap-3 py-3">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    critique ? "bg-[#EF4444]/10 text-[#EF4444]" : "bg-[#F59E0B]/15 text-[#D97706]",
                  )}
                >
                  <Icon className="size-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#0F2747]">{medLabel(alert.medicine)}</p>
                  <p className="text-sm text-[#64748B]">{alert.message}</p>
                </div>
                <span className="shrink-0 text-xs text-[#64748B]">{timeAgo(alert.date)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}