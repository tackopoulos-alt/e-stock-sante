import { Link } from "react-router-dom"
import { BellRing, ChevronDown, Menu, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useData } from "@/context/DataContext"
import { initials } from "@/lib/format"

interface HeaderProps {
  onMenuClick: () => void
  alertCount: number
}

export default function Header({ onMenuClick, alertCount }: HeaderProps) {
  const { currentUser } = useData()

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-[#E2E8F0] bg-white/85 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        aria-label="Ouvrir le menu"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-[#172033] hover:bg-slate-100 lg:hidden"
      >
        <Menu className="size-6" />
      </button>

      <div className="relative max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#64748B]" />
        <Input
          type="search"
          placeholder="Rechercher un médicament, un stock..."
          className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white pl-11 pr-4 text-sm"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <Link
          to="/alertes"
          aria-label={`Alertes (${alertCount})`}
          className="relative rounded-xl p-2.5 text-[#172033] hover:bg-slate-100"
        >
          <BellRing className="size-6" />
          {alertCount > 0 && <span className="absolute right-2 top-2 size-2.5 rounded-full bg-[#F97316] ring-2 ring-white" />}
        </Link>

        <Link to="/profil" className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-slate-100">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
            {initials(currentUser.nom)}
          </div>
          <span className="hidden text-sm font-semibold text-[#0F2747] sm:block">{currentUser.nom}</span>
          <ChevronDown className="hidden size-4 text-[#64748B] sm:block" />
        </Link>
      </div>
    </header>
  )
}