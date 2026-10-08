import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { CircleAlert, Eye, EyeOff, LogIn } from "lucide-react"
import { toast } from "sonner"
import AuthLayout from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="flex items-center gap-1.5 text-sm text-[#EF4444]">
      <CircleAlert className="size-4 shrink-0" />
      {message}
    </p>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next: { email?: string; password?: string } = {}

    if (!email.trim()) next.email = "Saisissez votre adresse e-mail."
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Saisissez une adresse e-mail valide."

    if (!password) next.password = "Saisissez votre mot de passe."

    setErrors(next)
    if (Object.keys(next).length > 0) return

    // La vérification des identifiants viendra avec le backend
    toast.success("Connexion réussie", {
      description: "Vous êtes redirigé vers le tableau de bord.",
    })
    navigate("/dashboard")
  }

  return (
    <AuthLayout title="Connexion" subtitle="Accédez à la gestion de votre stock de médicaments.">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#172033]">Adresse e-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="nom@structure.sn"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((x) => ({ ...x, email: undefined }))
            }}
            aria-invalid={!!errors.email}
            className={cn("h-11 border-[#E2E8F0] bg-white", errors.email && "border-[#EF4444]")}
          />
          <FieldError message={errors.email} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[#172033]">Mot de passe</Label>
            <Link to="/mot-de-passe-oublie" className="text-sm font-medium text-[#2563EB] hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((x) => ({ ...x, password: undefined }))
              }}
              aria-invalid={!!errors.password}
              className={cn("h-11 border-[#E2E8F0] bg-white pr-11", errors.password && "border-[#EF4444]")}
            />
            <button
              type="button"
              aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172033]"
            >
              {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>
          <FieldError message={errors.password} />
        </div>

        <Button type="submit" className="h-11 w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
          <LogIn className="size-4" /> Se connecter
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#E2E8F0]" />
        <span className="text-sm text-[#64748B]">ou</span>
        <div className="h-px flex-1 bg-[#E2E8F0]" />
      </div>

      <Button type="button" variant="outline" className="h-11 w-full border-[#E2E8F0] bg-white text-[#172033] hover:bg-slate-50">
        <GoogleIcon /> Continuer avec Google
      </Button>

      <p className="mt-8 text-center text-sm text-[#64748B]">
        Pas encore de compte ?{" "}
        <Link to="/register" className="font-semibold text-[#2563EB] hover:underline">
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  )
}