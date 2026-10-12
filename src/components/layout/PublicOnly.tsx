import { Navigate, Outlet } from "react-router-dom"
import { LoaderCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

// Les pages de connexion et d'inscription n'ont pas de sens pour quelqu'un déjà connecté
export default function PublicOnly() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <LoaderCircle className="size-8 animate-spin text-[#2563EB]" />
      </div>
    )
  }

  if (user) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
