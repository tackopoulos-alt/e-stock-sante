import { useState, type FormEvent } from "react"
import { CircleAlert, Eye, EyeOff, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Errors = Partial<Record<"actuel" | "nouveau" | "confirmation", string>>

function PasswordField({ id, label, value, onChange, error, autoComplete }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string }) {
  const [show, setShow] = useState(false)

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className={cn("h-11 border-[#E2E8F0] bg-white pr-11", error && "border-[#EF4444]")}
        />
        <button
          type="button"
          aria-label={show ? `Masquer : ${label}` : `Afficher : ${label}`}
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172033]"
        >
          {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-[#EF4444]">
          <CircleAlert className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

export default function PasswordCard() {
  const [actuel, setActuel] = useState("")
  const [nouveau, setNouveau] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [errors, setErrors] = useState<Errors>({})

  const change = (key: keyof Errors, setter: (v: string) => void) => (value: string) => {
    setter(value)
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}

    if (!actuel) next.actuel = "Saisissez votre mot de passe actuel."
    if (nouveau.length < 6) next.nouveau = "Le mot de passe doit contenir au moins 6 caractères."
    else if (nouveau === actuel) next.nouveau = "Le nouveau mot de passe doit être différent de l'actuel."
    if (!confirmation) next.confirmation = "Confirmez le nouveau mot de passe."
    else if (confirmation !== nouveau) next.confirmation = "Les mots de passe ne sont pas identiques."

    setErrors(next)
    if (Object.keys(next).length > 0) return

    // La vérification du mot de passe actuel et son enregistrement viendront avec le backend
    toast.success("Mot de passe modifié", { description: "Utilisez-le à votre prochaine connexion." })
    setActuel("")
    setNouveau("")
    setConfirmation("")
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-x-4 gap-y-4 sm:grid-cols-3">
      <PasswordField id="pwd-actuel" label="Mot de passe actuel" value={actuel} onChange={change("actuel", setActuel)} error={errors.actuel} autoComplete="current-password" />
      <PasswordField id="pwd-nouveau" label="Nouveau mot de passe" value={nouveau} onChange={change("nouveau", setNouveau)} error={errors.nouveau} autoComplete="new-password" />
      <PasswordField id="pwd-confirmation" label="Confirmation" value={confirmation} onChange={change("confirmation", setConfirmation)} error={errors.confirmation} autoComplete="new-password" />

      <div className="flex justify-end sm:col-span-3">
        <Button type="submit" variant="outline" className="h-11 px-5">
          <KeyRound className="size-4" /> Changer le mot de passe
        </Button>
      </div>
    </form>
  )
}
