import { cn } from "@/lib/utils"
import type { StockLevel } from "@/lib/stock"

const styles: Record<StockLevel, { label: string; badge: string; dot: string }> = {
  normal: { label: "Normal", badge: "bg-[#10B981]/10 text-[#047857]", dot: "bg-[#10B981]" },
  faible: { label: "Stock faible", badge: "bg-[#F59E0B]/15 text-[#B45309]", dot: "bg-[#F59E0B]" },
  rupture: { label: "Rupture", badge: "bg-[#EF4444]/10 text-[#B91C1C]", dot: "bg-[#EF4444]" },
}

export default function LevelBadge({ level }: { level: StockLevel }) {
  const s = styles[level]

  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", s.badge)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  )
}
