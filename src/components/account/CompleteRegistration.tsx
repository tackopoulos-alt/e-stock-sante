import { useState, type FormEvent } from "react"
import { Building2, CircleAlert, LoaderCircle, UserCog, UserPlus } from "lucide-react"
import { LogoutButton, Notice } from "@/components/account/AccountScreens"
import AuthLayout from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccount } from "@/context/AccountContext"
import { useAuth } from "@/context/AuthContext"
import { FONCTIONS, STRUCTURES } from "@/data/options"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"

// « Administrateur » n'est pas proposé : le rôle d'administrateur est donné par le serveur, jamais choisi
const fonctions = FONCTIONS.filter((f) => f !== "Administrateur")

const fieldCls = "h-10 border-[#E2E8F0] bg-white"
const selectCls = "h-10 w-full border-[#E2E8F0] bg-white data-[size=default]:h-10"

type FormErrors = Partial<Record<"nom" | "fonction" | "typeStructure" | "nomStructure", string>>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="flex items-center gap-1.5 text-xs text-[#EF4444]">
      <CircleAlert className="size-3.5 shrink-0" />
      {message}
    </p>
  )
}

// L'écran « Terminer votre inscription », montré après la vérification de l'e-mail à toute personne qui n'a pas encore de fiche
// (inscription par e-mail ou par Google).
export default function CompleteRegistration() {
  const { user } = useAuth()
  const { register } = useAccount()
  const [nom, setNom] = useState(user?.displayName ?? "")
  const [telephone, setTelephone] = useState("")
  const [fonction, setFonction] = useState("")
  const [typeStructure, setTypeStructure] = useState("")
  const [nomStructure, setNomStructure] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const clear = (key: keyof FormErrors) => setErrors((x) => ({ ...x, [key]: undefined }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: FormErrors = {}
    if (nom.trim().length < 3) next.nom = "Saisissez votre nom complet."
    if (!fonction) next.fonction = "Sélectionnez votre fonction."
    if (!typeStructure) next.typeStructure = "Sélectionnez le type de structure."
    if (!nomStructure.trim()) next.nomStructure = "Saisissez le nom de la structure."

    setErrors(next)
    setFormError("")
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      await register({
        nom: nom.trim(),
        telephone: telephone.trim() || undefined,
        fonction,
        typeStructure,
        nomStructure: nomStructure.trim(),
      })
    } catch (err) {
      if (err instanceof ApiError) {
        // Les messages de validation du serveur sont en anglais : on ne les montre pas tels quels
        setFormError(err.code === "DONNEES_INVALIDES" ? "Vérifiez les informations saisies, puis réessayez." : err.message)
      } else {
        setFormError("Une erreur est survenue. Réessayez.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout wide title="Terminer votre inscription" subtitle="Dernière étape : dites-nous à quelle structure vous appartenez.">
      <form className="grid gap-x-4 gap-y-3 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
        <div className="sm:col-span-2">
          <Notice kind="info">
            Si votre structure existe déjà (même nom, même type), vous la rejoindrez et un administrateur devra valider votre compte. Sinon, elle sera
            créée et vous en serez l'administrateur, en attendant la validation de l'équipe e-Stock Santé.
          </Notice>
        </div>

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
          <Label htmlFor="telephone" className="text-[#172033]">
            Téléphone <span className="font-normal text-[#64748B]">(facultatif)</span>
          </Label>
          <Input
            id="telephone"
            type="tel"
            placeholder="+221 ..."
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className={fieldCls}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[#172033]">Fonction</Label>
          <Select value={fonction} onValueChange={(v) => { setFonction(v ?? ""); clear("fonction") }}>
            <SelectTrigger aria-invalid={!!errors.fonction} className={cn(selectCls, errors.fonction && "border-[#EF4444]")}>
              <UserCog className="size-4 text-[#64748B]" />
              <SelectValue placeholder="Sélectionnez votre rôle" />
            </SelectTrigger>
            <SelectContent>
              {fonctions.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.fonction} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[#172033]">Type de structure</Label>
          <Select value={typeStructure} onValueChange={(v) => { setTypeStructure(v ?? ""); clear("typeStructure") }}>
            <SelectTrigger aria-invalid={!!errors.typeStructure} className={cn(selectCls, errors.typeStructure && "border-[#EF4444]")}>
              <Building2 className="size-4 text-[#64748B]" />
              <SelectValue placeholder="Choisir un type" />
            </SelectTrigger>
            <SelectContent>
              {STRUCTURES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.typeStructure} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="nomStructure" className="text-[#172033]">Nom de la structure</Label>
          <Input
            id="nomStructure"
            placeholder="Hôpital Régional de Saint-Louis"
            value={nomStructure}
            onChange={(e) => { setNomStructure(e.target.value); clear("nomStructure") }}
            aria-invalid={!!errors.nomStructure}
            className={cn(fieldCls, errors.nomStructure && "border-[#EF4444]")}
          />
          <FieldError message={errors.nomStructure} />
        </div>

        <Button type="submit" disabled={submitting} className="mt-2 h-10 w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] sm:col-span-2">
          {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          {submitting ? "Enregistrement..." : "Terminer mon inscription"}
        </Button>
      </form>

      <div className="mt-4 flex justify-center">
        <LogoutButton />
      </div>
    </AuthLayout>
  )
}
