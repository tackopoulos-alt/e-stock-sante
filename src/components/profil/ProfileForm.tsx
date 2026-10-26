import { useState, type FormEvent } from "react"
import { CircleAlert, LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAccount } from "@/context/AccountContext"
import { describeError } from "@/lib/queries"
import { useProfile } from "@/lib/useProfile"
import { cn } from "@/lib/utils"

type Errors = Partial<Record<"nom", string>>

const fieldCls = "h-11 border-[#E2E8F0] bg-white"
const invalidCls = "border-[#EF4444]"

export default function ProfileForm() {
  const profile = useProfile()
  const { updateProfile } = useAccount()
  const [nom, setNom] = useState(profile?.nom ?? "")
  const [telephone, setTelephone] = useState(profile?.telephone ?? "")
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (nom.trim().length < 3) next.nom = "Saisissez votre nom complet."

    setErrors(next)
    setFormError("")
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      // Une chaîne vide efface le téléphone
      await updateProfile({ nom: nom.trim(), telephone: telephone.trim() })
      toast.success("Profil mis à jour", { description: "Vos informations ont été enregistrées." })
    } catch (err) {
      setFormError(describeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
      {formError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C] sm:col-span-2">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {formError}
        </div>
      )}

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
        <Input id="profil-email" type="email" value={profile?.email ?? ""} disabled className={cn(fieldCls, "bg-slate-50 text-[#64748B]")} />
        <p className="text-xs text-[#64748B]">C'est votre identifiant de connexion : elle ne peut pas être modifiée ici.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profil-tel">
          Téléphone <span className="font-normal text-[#64748B]">(facultatif)</span>
        </Label>
        <Input id="profil-tel" type="tel" placeholder="+221 ..." value={telephone} onChange={(e) => setTelephone(e.target.value)} className={fieldCls} />
      </div>

      <div className="flex items-end justify-end sm:col-span-2">
        <Button type="submit" disabled={submitting} className="h-11 bg-[#2563EB] px-6 text-white hover:bg-[#1D4ED8]">
          {submitting && <LoaderCircle className="size-4 animate-spin" />}
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