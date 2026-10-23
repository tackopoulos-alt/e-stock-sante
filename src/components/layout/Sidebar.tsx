import { NavLink, useNavigate } from "react-router-dom"
import { BellRing, Boxes, History, LayoutDashboard, LogOut, PackageCheck, Pill, UserCircle, Users, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { initials } from "@/lib/format"
import { useProfile } from "@/lib/useProfile"
import { cn } from "@/lib/utils"

const links = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/medicaments", label: "Médicaments", icon: Pill },
  { to: "/stocks", label: "Stocks", icon: Boxes },
  { to: "/alertes", label: "Alertes", icon: BellRing },
  { to: "/historique", label: "Historique", icon: History },
  { to: "/utilisateurs", label: "Utilisateurs", icon: Users },
  { to: "/profil", label: "Mon profil", icon: UserCircle },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  alertCount: number
}

export default function Sidebar({ open, onClose, alertCount }: SidebarProps) {
  const navigate = useNavigate()
  const profile = useProfile()
  const nom = profile?.nom ?? ""
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    toast.success("Vous êtes déconnecté")
    navigate("/login")
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-[#0F2747]/60 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#0F2747] text-white transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="relative flex size-11 items-center justify-center rounded-xl bg-white">
              <PackageCheck className="size-6 text-[#2563EB]" />
              <span className="absolute -right-1 -top-1 size-3 rounded-full bg-[#F97316] ring-2 ring-[#0F2747]" />
            </div>
            <span className="text-xl font-bold">e-Stock Santé</span>
          </div>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors",
                  isActive ? "bg-[#2563EB] text-white shadow-md" : "text-blue-100/80 hover:bg-white/10 hover:text-white",
                )
              }
            >
              <Icon className="size-5" />
              <span className="flex-1">{label}</span>
              {to === "/alertes" && alertCount > 0 && (
                <span className="flex size-6 items-center justify-center rounded-full bg-[#F97316] text-xs font-bold text-white">
                  {alertCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold">
              {initials(nom)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{nom}</p>
              <p className="truncate text-xs text-blue-200">{profile?.fonction}</p>
            </div>
            <button
              type="button"
              aria-label="Se déconnecter"
              title="Se déconnecter"
              onClick={handleLogout}
              className="rounded-lg p-2 text-blue-200 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}