import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { sendEmailVerification } from "firebase/auth"
import { useAuth } from "@/context/AuthContext"
import { apiFetch, ApiError } from "@/lib/api"
import { auth } from "@/lib/firebase"
import { stateFromError, stateFromProfile, type AccountState, type Profile, type RegisterInput } from "@/lib/account"

interface AccountContextValue {
  // Quel écran afficher : l'application, la vérification de l'e-mail, l'inscription, l'attente...
  state: AccountState
  // Relit l'état du compte auprès du serveur
  refresh: () => Promise<void>
  // Après un clic sur le lien de l'e-mail : relit le compte, renouvelle le jeton, puis relit l'état.
  // Renvoie false si l'adresse n'est pas encore vérifiée.
  checkVerification: () => Promise<boolean>
  resendVerification: () => Promise<void>
  // Termine l'inscription. Lance une ApiError si le serveur refuse.
  register: (input: RegisterInput) => Promise<void>
}

const AccountContext = createContext<AccountContextValue | null>(null)

// La réponse du serveur, avec le compte auquel elle correspond (pour ne jamais montrer l'état d'une autre personne)
type Remote = { uid: string; state: AccountState } | null

// Demande au serveur l'état du compte. Ne lance jamais d'erreur : une panne devient l'état « error ».
async function fetchAccountState(): Promise<AccountState> {
  try {
    return stateFromProfile(await apiFetch<Profile>("/auth/me"))
  } catch (err) {
    return stateFromError(err)
  }
}

// Après la connexion Firebase, demande au serveur qui est la personne et dans quel état est son compte
export function AccountProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [remote, setRemote] = useState<Remote>(null)
  // Sert à ignorer la réponse d'une demande devenue inutile (la personne s'est déconnectée, ou a changé de compte)
  const requestId = useRef(0)

  // Les deux cas immédiats se déduisent sans interroger le serveur ; seule sa réponse est mémorisée
  const state: AccountState = !user
    ? { status: "loading" }
    : !user.emailVerified
      ? { status: "needs-verification" }
      : remote && remote.uid === user.uid
        ? remote.state
        : { status: "loading" }

  // Appel automatique : à la connexion, et à chaque changement de compte
  useEffect(() => {
    // Tant que l'adresse n'est pas vérifiée, le serveur refuserait de toute façon : inutile de l'appeler
    if (loading || !user || !user.emailVerified) return
    const id = ++requestId.current
    const uid = user.uid
    void fetchAccountState().then((next) => {
      if (id === requestId.current) setRemote({ uid, state: next })
    })
  }, [loading, user])

  // Appel à la demande (bouton « Réessayer », « Vérifier à nouveau »)
  const refresh = useCallback(async () => {
    if (!user || !user.emailVerified) return
    const id = ++requestId.current
    setRemote(null)
    const next = await fetchAccountState()
    if (id === requestId.current) setRemote({ uid: user.uid, state: next })
  }, [user])

  const checkVerification = useCallback(async () => {
    if (!user) return false
    await user.reload()
    if (!user.emailVerified) return false
    // Le jeton garde l'ancienne mention « e-mail non vérifié » : on en demande un neuf, pour que le serveur voie la vérification
    await user.getIdToken(true)
    await refresh()
    return true
  }, [user, refresh])

  const resendVerification = useCallback(async () => {
    if (!user) return
    auth.languageCode = "fr"
    await sendEmailVerification(user)
  }, [user])

  const register = useCallback(
    async (input: RegisterInput) => {
      if (!user) return
      try {
        const profile = await apiFetch<Profile>("/auth/register", { method: "POST", body: input })
        setRemote({ uid: user.uid, state: stateFromProfile(profile) })
      } catch (err) {
        // Déjà inscrite (dans un autre onglet, par exemple) : on relit simplement l'état
        if (err instanceof ApiError && err.code === "DEJA_INSCRIT") {
          await refresh()
          return
        }
        // Le serveur ne voit pas l'adresse comme vérifiée : on repasse par l'écran de vérification
        if (err instanceof ApiError && err.code === "EMAIL_NON_VERIFIE") {
          setRemote({ uid: user.uid, state: { status: "needs-verification" } })
        }
        throw err
      }
    },
    [user, refresh],
  )

  return (
    <AccountContext.Provider value={{ state, refresh, checkVerification, resendVerification, register }}>
      {children}
    </AccountContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAccount() {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error("useAccount doit être utilisé à l'intérieur de <AccountProvider>")
  return ctx
}
