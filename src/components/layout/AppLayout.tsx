import { useState } from "react"
import { Outlet } from "react-router-dom"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import { useData } from "@/context/DataContext"
import { buildAlerts } from "@/lib/stock"

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { lots, medicines, movements } = useData()

  const alertCount = buildAlerts(medicines, movements, lots).length

  return (
    <div className="min-h-screen bg-[#F8FAFC] lg:pl-72">
      <Sidebar open={open} onClose={() => setOpen(false)} alertCount={alertCount} />
      <Header onMenuClick={() => setOpen(true)} alertCount={alertCount} />
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}