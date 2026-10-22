import { Navigate } from "react-router-dom"
import { LoaderCircle } from "lucide-react"
import AccountGate from "@/components/account/AccountGate"
import { useAuth } from "@/context/AuthContext"

// Les pages de l'application ne sont accessibles qu'une fois connecté, avec un compte actif
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

  // Connecté à Firebase : l'application n'est montrée que si le compte est actif, sinon l'écran qui dit ce qu'il reste à faire
  return <AccountGate />
}