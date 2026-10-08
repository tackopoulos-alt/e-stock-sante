import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { EllipsisVertical, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ActionItem {
  label: string
  icon: LucideIcon
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  separatorBefore?: boolean
}

interface ActionMenuProps {
  label: string
  items: ActionItem[]
}

export default function ActionMenu({ label, items }: ActionMenuProps) {
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = () => setPos(null)

  // Le menu s'ouvre vers le bas, ou vers le haut s'il n'y a pas assez de place
  const open = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const menuHeight = items.length * 40 + 24
    const right = window.innerWidth - rect.right
    const spaceBelow = window.innerHeight - rect.bottom
    setPos(spaceBelow < menuHeight + 12 ? { bottom: window.innerHeight - rect.top + 4, right } : { top: rect.bottom + 4, right })
  }

  useEffect(() => {
    if (!pos) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPos(null)
    }
    const onMove = () => setPos(null)

    document.addEventListener("keydown", onKey)
    window.addEventListener("resize", onMove)
    window.addEventListener("scroll", onMove, true)
    return () => {
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onMove)
      window.removeEventListener("scroll", onMove, true)
    }
  }, [pos])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions pour ${label}`}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        onClick={(e) => {
          e.stopPropagation()
          if (pos) close()
          else open()
        }}
        className="rounded-lg p-2 text-[#64748B] hover:bg-slate-100 hover:text-[#172033]"
      >
        <EllipsisVertical className="size-5" />
      </button>

      {pos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation()
                close()
              }}
            />
            <div
              role="menu"
              style={{ top: pos.top, bottom: pos.bottom, right: pos.right }}
              onClick={(e) => e.stopPropagation()}
              className="animate-in fade-in-0 zoom-in-95 fixed z-50 w-60 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-xl duration-150"
            >
              {items.map(({ label: itemLabel, icon: Icon, onClick, danger, disabled, separatorBefore }) => (
                <div key={itemLabel}>
                  {separatorBefore && <div className="my-1 h-px bg-[#E2E8F0]" />}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={disabled}
                    onClick={() => {
                      close()
                      onClick()
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40",
                      danger ? "font-medium text-[#B91C1C] hover:bg-[#EF4444]/10" : "text-[#172033] hover:bg-[#F8FAFC]",
                    )}
                  >
                    <Icon className={cn("size-4", danger ? "" : "text-[#64748B]")} />
                    {itemLabel}
                  </button>
                </div>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  )
}
