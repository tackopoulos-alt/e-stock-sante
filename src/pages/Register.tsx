import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Building2, CircleAlert, Eye, EyeOff, UserCog, UserPlus } from "lucide-react"
import { toast } from "sonner"
import AuthLayout from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const structureTypes = ["Centre de Santé", "Poste de Santé", "Hôpital", "Clinique", "Pharmacie hospitalière"]
const fonctions = ["Gestionnaire de stock", "Agent de santé", "Pharmacien", "Responsable de pharmacie"]

const fieldCls = "h-10 border-[#E2E8F0] bg-white"
const selectCls = "h-10 w-full border-[#E2E8F0] bg-white data-[size=default]:h-10"
const eyeCls = "absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172033]"

type FormErrors = Partial<
  Record<"nom" | "email" | "fonction" | "typeStructure" | "nomStructure" | "password" | "confirm", string>
>

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
  const [nom, setNom] = useState("")
  const [email, setEmail] = useState("")
  const [telephone, setTelephone] = useState("")
  const [fonction, setFonction] = useState("")
  const [typeStructure, setTypeStructure] = useState("")
  const [nomStructure, setNomStructure] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const clear = (key: keyof FormErrors) => setErrors((x) => ({ ...x, [key]: undefined }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next: FormErrors = {}

    if (nom.trim().length < 3) next.nom = "Saisissez votre nom complet."

    if (!email.trim()) next.email = "Saisissez votre adresse e-mail."
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Saisissez une adresse e-mail valide."

    if (!fonction) next.fonction = "Sélectionnez votre fonction."
    if (!typeStructure) next.typeStructure = "Sélectionnez le type de structure."
    if (!nomStructure.trim()) next.nomStructure = "Saisissez le nom de la structure."

    if (password.length < 6) next.password = "Le mot de passe doit contenir au moins 6 caractères."

    if (!confirm) next.confirm = "Confirmez votre mot de passe."
    else if (confirm !== password) next.confirm = "Les mots de passe ne sont pas identiques."

    setErrors(next)
    if (Object.keys(next).length > 0) return

    // L'enregistrement réel du compte viendra avec le backend
    toast.success("Compte créé", {
      description: "Il sera activé après validation par un administrateur.",
    })
    navigate("/login")
  }

  return (
    <AuthLayout
      wide
      title="Créer un compte"
      subtitle="Votre compte sera activé après validation par un administrateur."
    >
      <form className="grid gap-x-4 gap-y-3 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
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
              {structureTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.typeStructure} />
        </div>

        <div className="space-y-1.5">
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

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[#172033]">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
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

        <Button type="submit" className="mt-2 h-10 w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] sm:col-span-2">
          <UserPlus className="size-4" /> Créer mon compte
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