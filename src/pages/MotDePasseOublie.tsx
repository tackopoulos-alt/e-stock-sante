import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, CircleAlert, MailCheck, Send } from "lucide-react"
import { toast } from "sonner"
import AuthLayout from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!email.trim()) return setError("Saisissez votre adresse e-mail.")
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Saisissez une adresse e-mail valide.")

    // Provisoire : l'envoi réel de l'e-mail viendra avec le backend
    toast.success("Demande envoyée", {
      description: "Consultez votre boîte mail pour réinitialiser votre mot de passe.",
    })
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout title="Vérifiez votre boîte mail" subtitle="Votre demande a bien été prise en compte.">
        <div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/10 p-5">
          <MailCheck className="size-8 text-[#10B981]" />
          <p className="mt-3 text-sm text-[#172033]">
            Si un compte existe avec l'adresse <span className="font-semibold">{email.trim()}</span>, un lien de
            réinitialisation vient d'être envoyé.
          </p>
        </div>
        <Link
          to="/login"
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] text-sm font-medium text-white hover:bg-[#1D4ED8]"
        >
          <ArrowLeft className="size-4" /> Retour à la connexion
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Saisissez votre adresse e-mail. Nous vous enverrons un lien pour choisir un nouveau mot de passe."
    >
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
              setError("")
            }}
            aria-invalid={!!error}
            className={cn("h-11 border-[#E2E8F0] bg-white", error && "border-[#EF4444]")}
          />
          {error && (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-[#EF4444]">
              <CircleAlert className="size-4 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <Button type="submit" className="h-11 w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
          <Send className="size-4" /> Envoyer le lien
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-[#2563EB] hover:underline"
      >
        <ArrowLeft className="size-4" /> Retour à la connexion
      </Link>
    </AuthLayout>
  )
}
