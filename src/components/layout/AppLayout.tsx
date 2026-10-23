import { useState } from "react"
import { Outlet } from "react-router-dom"
import AuthSync from "@/components/layout/AuthSync"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import { useAlerts } from "@/lib/queries"

export default function AppLayout() {
  const [open, setOpen] = useState(false)

  // Le nombre d'alertes en cours, pour la cloche et le menu : une toute petite demande au serveur
  const alerts = useAlerts({ page: 1, limit: 1 })
  const alertCount = alerts.data?.summary.total ?? 0

  return (
    <div className="min-h-screen bg-[#F8FAFC] lg:pl-72">
      <AuthSync />
      <Sidebar open={open} onClose={() => setOpen(false)} alertCount={alertCount} />
      <Header onMenuClick={() => setOpen(true)} alertCount={alertCount} />
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}