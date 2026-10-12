import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"

interface AuthContextValue {
  // La personne connectée (null si personne)
  user: FirebaseUser | null
  // Vrai tant que Firebase n'a pas dit si quelqu'un est connecté (au chargement de la page)
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUpWithEmail: (nom: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  // Sert à relancer l'affichage quand le nom du compte change (Firebase modifie l'objet sans prévenir)
  const [, setVersion] = useState(0)

  // Firebase garde la session dans le navigateur : on la retrouve après un rafraîchissement
  useEffect(() => {
    return onAuthStateChanged(auth, (current) => {
      setUser(current)
      setLoading(false)
    })
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password)
  }

  const signInWithGoogle = async () => {
    auth.languageCode = "fr"
    await signInWithPopup(auth, googleProvider)
  }

  // Crée le compte (Firebase connecte aussitôt la personne), enregistre son nom, puis envoie l'e-mail de vérification
  const signUpWithEmail = async (nom: string, email: string, password: string) => {
    auth.languageCode = "fr"
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
    await updateProfile(credential.user, { displayName: nom.trim() })
    setVersion((v) => v + 1)
    // L'e-mail de vérification ne bloque rien : s'il échoue, le compte est quand même créé
    sendEmailVerification(credential.user).catch(() => {})
  }

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signInWithGoogle, signUpWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>")
  return ctx
}