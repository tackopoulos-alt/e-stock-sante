import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FirebaseError } from "firebase/app"
import { CircleAlert, Eye, EyeOff, LoaderCircle, UserPlus } from "lucide-react"
import { toast } from "sonner"
import AuthLayout from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { authErrorMessage } from "@/lib/authErrors"
import { cn } from "@/lib/utils"

const fieldCls = "h-10 border-[#E2E8F0] bg-white"
const eyeCls = "absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172033]"

type FormErrors = Partial<Record<"nom" | "email" | "password" | "confirm", string>>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="flex items-center gap-1.5 text-xs text-[#EF4444]">
      <CircleAlert className="size-3.5 shrink-0" />
      {message}
    </p>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { signUpWithEmail } = useAuth()
  const [nom, setNom] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const clear = (key: keyof FormErrors) => setErrors((x) => ({ ...x, [key]: undefined }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: FormErrors = {}

    if (nom.trim().length < 3) next.nom = "Saisissez votre nom complet."

    if (!email.trim()) next.email = "Saisissez votre adresse e-mail."
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Saisissez une adresse e-mail valide."

    if (password.length < 6) next.password = "Le mot de passe doit contenir au moins 6 caractères."

    if (!confirm) next.confirm = "Confirmez votre mot de passe."
    else if (confirm !== password) next.confirm = "Les mots de passe ne sont pas identiques."

    setErrors(next)
    setFormError("")
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      await signUpWithEmail(nom, email, password)
      toast.success("Compte créé", {
        description: "Un e-mail de vérification vous a été envoyé : cliquez sur le lien, puis revenez sur le site.",
      })
      navigate("/dashboard")
    } catch (err) {
      if (err instanceof FirebaseError && err.code === "auth/email-already-in-use") {
        setErrors({ email: "Un compte existe déjà avec cette adresse e-mail." })
      } else if (err instanceof FirebaseError && err.code === "auth/weak-password") {
        setErrors({ password: "Mot de passe trop faible : 6 caractères minimum." })
      } else {
        setFormError(authErrorMessage(err) ?? "")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      wide
      title="Créer un compte"
      subtitle="Créez votre compte. Vous indiquerez votre structure à l'étape suivante."
    >
      <form className="grid gap-x-4 gap-y-3 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C] sm:col-span-2"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {formError}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="nom" className="text-[#172033]">Nom complet</Label>
          <Input
            id="nom"
            placeholder="Prénom Nom"
            value={nom}
            onChange={(e) => { setNom(e.target.value); clear("nom") }}
            aria-invalid={!!errors.nom}
            className={cn(fieldCls, errors.nom && "border-[#EF4444]")}
          />
          <FieldError message={errors.nom} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[#172033]">Adresse e-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="nom@structure.sn"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clear("email") }}
            aria-invalid={!!errors.email}
            className={cn(fieldCls, errors.email && "border-[#EF4444]")}
          />
          <FieldError message={errors.email} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[#172033]">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
              placeholder="6 caractères minimum"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clear("password") }}
              aria-invalid={!!errors.password}
              className={cn(fieldCls, "pr-11", errors.password && "border-[#EF4444]")}
            />
            <button
              type="button"
              aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              onClick={() => setShowPwd(!showPwd)}
              className={eyeCls}
            >
              {showPwd ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>
          <FieldError message={errors.password} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-[#172033]">Confirmer le mot de passe</Label>
          <div className="relative">
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Répétez le mot de passe"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); clear("confirm") }}
              aria-invalid={!!errors.confirm}
              className={cn(fieldCls, "pr-11", errors.confirm && "border-[#EF4444]")}
            />
            <button
              type="button"
              aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
              onClick={() => setShowConfirm(!showConfirm)}
              className={eyeCls}
            >
              {showConfirm ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>
          <FieldError message={errors.confirm} />
        </div>

        <Button type="submit" disabled={submitting} className="mt-2 h-10 w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] sm:col-span-2">
          {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          {submitting ? "Création du compte..." : "Créer mon compte"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[#64748B]">
        Vous avez déjà un compte ?{" "}
        <Link to="/login" className="font-semibold text-[#2563EB] hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  )
}