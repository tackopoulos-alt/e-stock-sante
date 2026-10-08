import { Check, CalendarClock, PackageX, TriangleAlert, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { timeAgo } from "@/lib/format"
import { medLabel, type Alert, type AlertType } from "@/lib/stock"
import type { Medicine } from "@/lib/types"
import { cn } from "@/lib/utils"

const types: Record<AlertType, { icon: typeof PackageX; label: string }> = {
  rupture: { icon: PackageX, label: "Rupture" },
  faible: { icon: TriangleAlert, label: "Stock faible" },
  peremption: { icon: CalendarClock, label: "Péremption proche" },
}

interface AlertCardProps {
  alert: Alert
  medicine: Medicine
  acknowledged: boolean
  onRestock: () => void
  onViewStock: () => void
  onViewDetails: () => void
  onToggle: () => void
}

export default function AlertCard({ alert, medicine, acknowledged, onRestock, onViewStock, onViewDetails, onToggle }: AlertCardProps) {
  const { icon: Icon, label } = types[alert.type]
  const critique = alert.niveau === "critique"

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-3 border-l-4 px-5 py-4",
        critique ? "border-l-[#EF4444]" : "border-l-[#F59E0B]",
        acknowledged && "bg-[#F8FAFC]",
      )}
    >
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full",
          critique ? "bg-[#EF4444]/10 text-[#EF4444]" : "bg-[#F59E0B]/15 text-[#D97706]",
        )}
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1 basis-64">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-[#0F2747]">{medLabel(medicine)}</p>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-[#475569]">{label}</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              critique ? "bg-[#EF4444]/10 text-[#B91C1C]" : "bg-[#F59E0B]/15 text-[#B45309]",
            )}
          >
            {critique ? "Critique" : "Avertissement"}
          </span>
          {acknowledged ? (
            <span className="flex items-center gap-1 rounded-full bg-[#10B981]/10 px-2.5 py-0.5 text-xs font-semibold text-[#047857]">
              <Check className="size-3" /> Prise en compte
            </span>
          ) : (
            <span className="rounded-full bg-[#2563EB]/10 px-2.5 py-0.5 text-xs font-semibold text-[#1D4ED8]">Active</span>
          )}
        </div>
        <p className="mt-1 text-sm text-[#475569]">{alert.message}</p>
        <p className="mt-0.5 text-xs text-[#64748B]">{timeAgo(alert.date)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {alert.type === "peremption" ? (
          <Button type="button" variant="outline" onClick={onViewDetails} className="h-9">
            Voir les lots
          </Button>
        ) : (
          <Button type="button" onClick={onRestock} className="h-9 bg-[#10B981] text-white hover:bg-[#059669]">
            Réapprovisionner
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onViewStock} className="h-9">
          Voir le stock
        </Button>
        <Button type="button" variant="ghost" onClick={onToggle} className="h-9 text-[#475569]">
          {acknowledged ? (
            <>
              <Undo2 className="size-4" /> Annuler
            </>
          ) : (
            <>
              <Check className="size-4" /> Prendre en compte
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
