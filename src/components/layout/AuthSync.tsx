import { useEffect, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { useData } from "@/context/DataContext"

// "tacko.poulo@gmail.com" -> "Tacko Poulo" (quand le compte n'a pas de nom, par exemple une inscription par e-mail)
function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

// Copie le nom et l'e-mail du compte Firebase dans le profil affiché (sidebar, en-tête, tableau de bord).
// Ne rend rien à l'écran.
export default function AuthSync() {
  const { user } = useAuth()
  const { updateProfile, currentUser } = useData()

  const uid = user?.uid
  const name = user?.displayName?.trim() ?? ""
  const email = user?.email ?? ""

  const latest = useRef({ updateProfile, telephone: currentUser.telephone })
  useEffect(() => {
    latest.current = { updateProfile, telephone: currentUser.telephone }
  })

  useEffect(() => {
    if (!uid || !email) return
    latest.current.updateProfile({ nom: name || nameFromEmail(email), email, telephone: latest.current.telephone })
  }, [uid, name, email])

  return null
}
