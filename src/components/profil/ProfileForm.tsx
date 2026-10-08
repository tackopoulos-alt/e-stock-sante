import { useState, type FormEvent } from "react"
import { CircleAlert } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useData } from "@/context/DataContext"
import { cn } from "@/lib/utils"

type Errors = Partial<Record<"nom" | "email", string>>

const fieldCls = "h-11 border-[#E2E8F0] bg-white"
const invalidCls = "border-[#EF4444]"

export default function ProfileForm() {
  const { currentUser, updateProfile } = useData()
  const [nom, setNom] = useState(currentUser.nom)
  const [email, setEmail] = useState(currentUser.email)
  const [telephone, setTelephone] = useState(currentUser.telephone ?? "")
  const [errors, setErrors] = useState<Errors>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}

    if (nom.trim().length < 3) next.nom = "Saisissez votre nom complet."
    if (!email.trim()) next.email = "Saisissez votre adresse e-mail."
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Saisissez une adresse e-mail valide."

    setErrors(next)
    if (Object.keys(next).length > 0) return

    const result = updateProfile({ nom, email, telephone })
    if (!result.ok) {
      setErrors({ email: result.error })
      return
    }
    toast.success("Profil mis à jour", { description: "Vos informations ont été enregistrées." })
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="profil-nom">Nom complet</Label>
        <Input
          id="profil-nom"
          value={nom}
          onChange={(e) => {
            setNom(e.target.value)
            setErrors((x) => ({ ...x, nom: undefined }))
          }}
          aria-invalid={!!errors.nom}
          className={cn(fieldCls, errors.nom && invalidCls)}
        />
        {errors.nom && <FieldError message={errors.nom} />}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profil-email">Adresse e-mail</Label>
        <Input
          id="profil-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setErrors((x) => ({ ...x, email: undefined }))
          }}
          aria-invalid={!!errors.email}
          className={cn(fieldCls, errors.email && invalidCls)}
        />
        {errors.email && <FieldError message={errors.email} />}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profil-tel">
          Téléphone <span className="font-normal text-[#64748B]">(facultatif)</span>
        </Label>
        <Input id="profil-tel" type="tel" placeholder="+221 ..." value={telephone} onChange={(e) => setTelephone(e.target.value)} className={fieldCls} />
      </div>

      <div className="flex items-end justify-end sm:col-span-2">
        <Button type="submit" className="h-11 bg-[#2563EB] px-6 text-white hover:bg-[#1D4ED8]">
          Enregistrer
        </Button>
      </div>
    </form>
  )
}

function FieldError({ message }: { message: string }) {
  return (
    <p role="alert" className="flex items-center gap-1.5 text-xs text-[#EF4444]">
      <CircleAlert className="size-3.5 shrink-0" />
      {message}
    </p>
  )
}
