import { useState, type FormEvent } from "react"
import { ChevronDown, CircleAlert, Info } from "lucide-react"
import { toast } from "sonner"
import Modal from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useData } from "@/context/DataContext"
import { currentUser } from "@/data/currentUser"
import { FONCTIONS, STRUCTURES } from "@/data/options"
import type { Fonction, Role, StructureType, User, UserStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

type Values = {
  nom: string
  email: string
  telephone: string
  typeStructure: StructureType | ""
  nomStructure: string
  fonction: Fonction | ""
  role: Role
  statut: UserStatus
}
type Errors = Partial<Record<"nom" | "email" | "typeStructure" | "nomStructure" | "fonction", string>>

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

export default function UserForm({ user, onClose }: { user?: User; onClose: () => void }) {
  const { addUser, updateUser } = useData()
  const isSelf = user?.id === currentUser.id

  const [values, setValues] = useState<Values>({
    nom: user?.nom ?? "",
    email: user?.email ?? "",
    telephone: user?.telephone ?? "",
    typeStructure: user?.typeStructure ?? "",
    nomStructure: user?.nomStructure ?? "",
    fonction: user?.fonction ?? "",
    role: user?.role ?? "gestionnaire",
    statut: user?.statut ?? "actif",
  })
  const [errors, setErrors] = useState<Errors>({})

  const set = <K extends keyof Values>(key: K) => (value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}

    if (values.nom.trim().length < 3) next.nom = "Saisissez le nom complet."
    if (!values.email.trim()) next.email = "Saisissez l'adresse e-mail."
    else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = "Saisissez une adresse e-mail valide."
    if (!values.typeStructure) next.typeStructure = "Sélectionnez le type de structure."
    if (!values.nomStructure.trim()) next.nomStructure = "Saisissez le nom de la structure."
    if (!values.fonction) next.fonction = "Sélectionnez la fonction."

    setErrors(next)
    if (Object.keys(next).length > 0 || !values.typeStructure || !values.fonction) return

    const input = {
      nom: values.nom.trim(),
      email: values.email.trim(),
      telephone: values.telephone.trim() || undefined,
      typeStructure: values.typeStructure,
      nomStructure: values.nomStructure.trim(),
      fonction: values.fonction,
      role: values.role,
      statut: values.statut,
    }

    const result = user ? updateUser(user.id, input) : addUser(input)
    if (!result.ok) {
      // Une adresse déjà prise se corrige sous le champ e-mail ; les règles de sécurité s'affichent en haut
      if (result.error?.includes("e-mail")) setErrors({ email: result.error })
      else toast.error("Modification impossible", { description: result.error })
      return
    }

    toast.success(user ? "Utilisateur modifié" : "Utilisateur ajouté", { description: `Le compte de ${input.nom} a été enregistré.` })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={user ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
      className="sm:max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="user-form" className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
            {user ? "Enregistrer" : "Ajouter"}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} noValidate className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nom">Nom complet</Label>
          <Input id="nom" placeholder="Prénom Nom" value={values.nom} onChange={(e) => set("nom")(e.target.value)} aria-invalid={!!errors.nom} className={cn(fieldCls, errors.nom && invalidCls)} />
          <FieldError message={errors.nom} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input id="email" type="email" placeholder="nom@structure.sn" value={values.email} onChange={(e) => set("email")(e.target.value)} aria-invalid={!!errors.email} className={cn(fieldCls, errors.email && invalidCls)} />
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
            onChange={(v) => set("fonction")(v as Fonction)}
            placeholder="Sélectionner une fonction"
            invalid={!!errors.fonction}
            options={FONCTIONS.map((f) => ({ value: f, label: f }))}
          />
          <FieldError message={errors.fonction} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="typeStructure">Type de structure</Label>
          <SelectField
            id="typeStructure"
            value={values.typeStructure}
            onChange={(v) => set("typeStructure")(v as StructureType)}
            placeholder="Sélectionner un type"
            invalid={!!errors.typeStructure}
            options={STRUCTURES.map((s) => ({ value: s, label: s }))}
          />
          <FieldError message={errors.typeStructure} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nomStructure">Nom de la structure</Label>
          <Input id="nomStructure" placeholder="Hôpital Régional de Saint-Louis" value={values.nomStructure} onChange={(e) => set("nomStructure")(e.target.value)} aria-invalid={!!errors.nomStructure} className={cn(fieldCls, errors.nomStructure && invalidCls)} />
          <FieldError message={errors.nomStructure} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">Rôle d'accès</Label>
          <SelectField
            id="role"
            value={values.role}
            disabled={isSelf}
            onChange={(v) => set("role")(v as Role)}
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
            onChange={(v) => set("statut")(v as UserStatus)}
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
