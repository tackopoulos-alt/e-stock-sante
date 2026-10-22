import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { LoaderCircle } from "lucide-react"
import { DisabledScreen, ErrorScreen, PendingScreen, VerifyEmailScreen } from "@/components/account/AccountScreens"
import CompleteRegistration from "@/components/account/CompleteRegistration"
import { useAccount } from "@/context/AccountContext"

// Choisit ce qu'on affiche à une personne connectée, d'après l'état de son compte :
// l'application seulement si le compte est actif, sinon l'écran qui explique ce qu'il reste à faire.
export default function AccountGate() {
  const { state } = useAccount()
  const queryClient = useQueryClient()

  // À la déconnexion (cet écran disparaît), on oublie tout ce que le serveur avait répondu :
  // la personne suivante ne doit jamais voir les données de la précédente
  useEffect(() => () => queryClient.clear(), [queryClient])

  switch (state.status) {
    case "loading":
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <LoaderCircle className="size-8 animate-spin text-[#2563EB]" />
        </div>
      )
    case "needs-verification":
      return <VerifyEmailScreen />
    case "needs-registration":
      return <CompleteRegistration />
    case "pending":
      return <PendingScreen profile={state.profile} />
    case "disabled":
      return <DisabledScreen profile={state.profile} />
    case "error":
      return <ErrorScreen error={state.error} />
    case "active":
      return <Outlet />
  }
}