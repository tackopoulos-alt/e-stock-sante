import { useState, type FormEvent } from "react"
import { ChevronDown, CircleAlert, Info, LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import Modal from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FONCTIONS } from "@/data/options"
import { ApiError } from "@/lib/api"
import { createUser, describeError, updateUser, useRefreshUsers, type ApiUser } from "@/lib/queries"
import { useProfile } from "@/lib/useProfile"
import { cn } from "@/lib/utils"

type Values = {
  nom: string
  email: string
  telephone: string
  fonction: string
  role: ApiUser["role"]
  statut: ApiUser["statut"]
}
type Errors = Partial<Record<"nom" | "email" | "fonction", string>>

const fieldCls = "h-10 border-[#E2E8F0] bg-white"
const invalidCls = "border-[#EF4444]"

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="flex items-center gap-1.5 text-xs text-[#EF4444]">
      <CircleAlert className="size-3.5 shrink-0" />
      {message}
    </p>
  )
}

function SelectField({ id, value, onChange, placeholder, options, invalid, disabled }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; options: { value: string; label: string }[]; invalid?: boolean; disabled?: boolean }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        className={cn(
          "h-10 w-full appearance-none rounded-md border border-[#E2E8F0] bg-white pl-3 pr-9 text-sm disabled:bg-slate-50 disabled:text-[#64748B]",
          value ? "text-[#172033]" : "text-[#64748B]",
          invalid && invalidCls,
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
    </div>
  )
}

export default function UserForm({ user, onClose }: { user?: ApiUser; onClose: () => void }) {
  const profile = useProfile()
  const refresh = useRefreshUsers()
  const isSelf = !!user && user.id === profile?.id

  const [values, setValues] = useState<Values>({
    nom: user?.nom ?? "",
    email: user?.email ?? "",
    telephone: user?.telephone ?? "",
    fonction: user?.fonction ?? "",
    role: user?.role ?? "gestionnaire",
    statut: user?.statut ?? "actif",
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof Values>(key: K) => (value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}

    if (values.nom.trim().length < 3) next.nom = "Saisissez le nom complet."
    if (!user) {
      if (!values.email.trim()) next.email = "Saisissez l'adresse e-mail."
      else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = "Saisissez une adresse e-mail valide."
    }
    if (!values.fonction) next.fonction = "Sélectionnez la fonction."

    setErrors(next)
    setFormError("")
    if (Object.keys(next).length > 0) return

    const input = {
      nom: values.nom.trim(),
      // Pour une modification, une chaîne vide efface le téléphone
      telephone: user ? values.telephone.trim() : values.telephone.trim() || undefined,
      fonction: values.fonction,
      role: values.role,
      statut: values.statut,
    }

    setSubmitting(true)
    try {
      if (user) await updateUser(user.id, input)
      else await createUser({ ...input, email: values.email.trim() })
      void refresh()
      toast.success(user ? "Utilisateur modifié" : "Utilisateur ajouté", { description: `Le compte de ${input.nom} a été enregistré.` })
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && /e-mail/i.test(err.message)) setErrors({ email: err.message })
      else setFormError(describeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={user ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
      className="sm:max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" form="user-form" disabled={submitting} className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
            {submitting && <LoaderCircle className="size-4 animate-spin" />}
            {user ? "Enregistrer" : "Ajouter"}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} noValidate className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        {!user && (
          <div className="flex items-start gap-2.5 rounded-xl bg-[#2563EB]/5 px-4 py-3 text-sm text-[#1E40AF] sm:col-span-2">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              Le compte sera créé dans votre structure{profile ? <> (<strong>{profile.structure.nom}</strong>)</> : ""}. La personne se connectera avec cette
              adresse e-mail (inscription ou Google) : son compte sera relié à cette fiche, avec le rôle et le statut choisis ici.
            </span>
          </div>
        )}

        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C] sm:col-span-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {formError}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="nom">Nom complet</Label>
          <Input id="nom" placeholder="Prénom Nom" value={values.nom} onChange={(e) => set("nom")(e.target.value)} aria-invalid={!!errors.nom} className={cn(fieldCls, errors.nom && invalidCls)} />
          <FieldError message={errors.nom} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="nom@structure.sn"
            value={values.email}
            disabled={!!user}
            onChange={(e) => set("email")(e.target.value)}
            aria-invalid={!!errors.email}
            className={cn(fieldCls, errors.email && invalidCls, user && "bg-slate-50 text-[#64748B]")}
          />
          {user && <p className="text-xs text-[#64748B]">L'adresse e-mail ne peut pas être modifiée.</p>}
          <FieldError message={errors.email} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telephone">
            Téléphone <span className="font-normal text-[#64748B]">(facultatif)</span>
          </Label>
          <Input id="telephone" type="tel" placeholder="+221 ..." value={values.telephone} onChange={(e) => set("telephone")(e.target.value)} className={fieldCls} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fonction">Fonction</Label>
          <SelectField
            id="fonction"
            value={values.fonction}
            onChange={(v) => set("fonction")(v)}
            placeholder="Sélectionner une fonction"
            invalid={!!errors.fonction}
            options={FONCTIONS.map((f) => ({ value: f, label: f }))}
          />
          <FieldError message={errors.fonction} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">Rôle d'accès</Label>
          <SelectField
            id="role"
            value={values.role}
            disabled={isSelf}
            onChange={(v) => set("role")(v as ApiUser["role"])}
            options={[
              { value: "gestionnaire", label: "Gestionnaire de stock" },
              { value: "admin", label: "Administrateur" },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="statut">Statut du compte</Label>
          <SelectField
            id="statut"
            value={values.statut}
            disabled={isSelf}
            onChange={(v) => set("statut")(v as ApiUser["statut"])}
            options={[
              { value: "actif", label: "Actif" },
              { value: "en_attente", label: "En attente de validation" },
              { value: "inactif", label: "Désactivé" },
            ]}
          />
        </div>

        {isSelf && (
          <div className="flex items-start gap-2.5 rounded-xl bg-[#2563EB]/5 px-4 py-3 text-sm text-[#1E40AF] sm:col-span-2">
            <Info className="mt-0.5 size-4 shrink-0" />
            Vous ne pouvez pas modifier votre propre rôle ni désactiver votre propre compte.
          </div>
        )}
      </form>
    </Modal>
  )
}