import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  pages: number
  start: number // nombre d'éléments avant cette page
  shown: number // nombre d'éléments affichés sur cette page
  total: number
  onChange: (page: number) => void
}

export default function Pagination({ page, pages, start, shown, total, onChange }: PaginationProps) {
  if (total === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] px-4 py-3 text-sm text-[#64748B]">
      <span>
        Affichage {start + 1}–{start + shown} sur {total}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Page précédente"
            disabled={page === 1}
            onClick={() => onChange(page - 1)}
            className="flex size-9 items-center justify-center rounded-lg border border-[#E2E8F0] hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "size-9 rounded-lg text-sm font-medium",
                n === page ? "bg-[#2563EB] text-white" : "border border-[#E2E8F0] text-[#172033] hover:bg-slate-50",
              )}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            aria-label="Page suivante"
            disabled={page === pages}
            onClick={() => onChange(page + 1)}
            className="flex size-9 items-center justify-center rounded-lg border border-[#E2E8F0] hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
