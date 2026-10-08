import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Fenêtres ouvertes, de la plus ancienne à la plus récente : Échap ne ferme que celle du dessus
const openModals: object[] = []

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export default function Modal({ open, onClose, title, description, children, footer, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Échap ferme la fenêtre, et la page derrière ne défile plus
  useEffect(() => {
    if (!open) return

    const token = {}
    openModals.push(token)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openModals[openModals.length - 1] === token) onCloseRef.current()
    }
    document.addEventListener("keydown", onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    panelRef.current?.focus()

    return () => {
      openModals.splice(openModals.indexOf(token), 1)
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[#0F2747]/50 backdrop-blur-[2px]" onClick={onClose} />

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-in fade-in-0 zoom-in-95 relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl outline-none duration-200 sm:max-w-lg sm:rounded-2xl",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0F2747]">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-[#64748B]">{description}</p>}
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100 hover:text-[#172033]"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4 sm:rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  )
}