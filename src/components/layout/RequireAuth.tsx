import { Navigate, Outlet } from "react-router-dom"
import { LoaderCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

// Les pages de l'application ne sont accessibles qu'une fois connecté
export default function RequireAuth() {
  const { user, loading } = useAuth()

  // Au chargement de la page, Firebase retrouve la session : on attend sa réponse avant de décider
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <LoaderCircle className="size-8 animate-spin text-[#2563EB]" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
