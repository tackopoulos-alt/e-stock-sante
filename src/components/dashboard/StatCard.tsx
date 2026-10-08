import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  tone?: "blue" | "alert"
  children?: ReactNode
}

export default function StatCard({ title, value, icon, tone = "blue", children }: StatCardProps) {
  const alert = tone === "alert"

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        alert ? "border-[#FDBA74]/70 bg-[#FFF7ED]" : "border-[#E2E8F0] bg-white",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full [&>svg]:size-5",
            alert ? "bg-[#F97316]/15 text-[#EA580C]" : "bg-[#2563EB]/10 text-[#2563EB]",
          )}
        >
          {icon}
        </div>
        <p className="text-sm font-medium text-[#64748B]">{title}</p>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-[#0F2747]">{value}</p>
      {children && <div className="mt-1.5 text-sm">{children}</div>}
    </div>
  )
}