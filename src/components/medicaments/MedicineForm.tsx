import { useState, type FormEvent } from "react"
import { ChevronDown, CircleAlert, Info, LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import Modal from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FORMES } from "@/data/options"
import { ApiError } from "@/lib/api"
import { createMedicine, describeError, updateMedicine, useCategories, useMedicines, useRefreshAfterChange, type MedicineInput } from "@/lib/queries"
import type { Medicine } from "@/lib/types"
import { cn } from "@/lib/utils"

type Values = {
  nom: string
  reference: string
  categorie: string
  dosage: string
  forme: string
  laboratoire: string
  seuilMin: string
  stockInitial: string
  description: string
}
type Errors = Partial<Record<"nom" | "reference" | "categorie" | "dosage" | "forme" | "seuilMin" | "stockInitial", string>>

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

function SelectField({ id, value, onChange, placeholder, options, invalid }: { id: string; value: string; onChange: (v: string) => void; placeholder: string; options: string[]; invalid: boolean }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        className={cn(
          "h-10 w-full appearance-none rounded-md border border-[#E2E8F0] bg-white pl-3 pr-9 text-sm",
          value ? "text-[#172033]" : "text-[#64748B]",
          invalid && invalidCls,
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
    </div>
  )
}

interface MedicineFormProps {
  medicine?: Medicine
  onClose: () => void
  // Appelé avec l'id du médicament créé
  onSaved?: (id: string) => void
  // Ouvert depuis une entrée de stock : le stock vient de cette entrée, pas du formulaire
  fromEntry?: boolean
}

export default function MedicineForm({ medicine, onClose, onSaved, fromEntry = false }: MedicineFormProps) {
  const { medicines } = useMedicines()
  const { categories, loading: loadingCategories } = useCategories()
  const refresh = useRefreshAfterChange()
  const [values, setValues] = useState<Values>({
    nom: medicine?.nom ?? "",
    reference: medicine?.reference ?? `MED-${String(medicines.length + 1).padStart(3, "0")}`,
    categorie: medicine?.categorie ?? "",
    dosage: medicine?.dosage ?? "",
    forme: medicine?.forme ?? "",
    laboratoire: medicine?.laboratoire ?? "",
    seuilMin: medicine ? String(medicine.seuilMin) : "",
    stockInitial: "",
    description: medicine?.description ?? "",
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}

    if (values.nom.trim().length < 2) next.nom = "Saisissez le nom du médicament."
    if (!values.reference.trim()) next.reference = "Saisissez la référence."
    if (!values.categorie) next.categorie = "Sélectionnez une catégorie."
    if (!values.dosage.trim()) next.dosage = "Saisissez le dosage."
    if (!values.forme) next.forme = "Sélectionnez une forme."

    const seuil = Number(values.seuilMin)
    if (values.seuilMin.trim() === "" || !Number.isInteger(seuil) || seuil < 0) {
      next.seuilMin = "Saisissez un nombre entier (0 ou plus)."
    }

    // Le stock de départ est facultatif et ne s'applique qu'à un nouveau médicament
    let stock = 0
    if (!medicine && !fromEntry && values.stockInitial.trim() !== "") {
      stock = Number(values.stockInitial)
      if (!Number.isInteger(stock) || stock < 0) next.stockInitial = "Saisissez un nombre entier (0 ou plus)."
    }

    // Le serveur range les catégories par identifiant
    const category = categories.find((c) => c.nom === values.categorie)
    if (values.categorie && !category) next.categorie = "Catégorie introuvable : rechargez la page."

    setErrors(next)
    setFormError("")
    if (Object.keys(next).length > 0 || !category) return

    const input: MedicineInput = {
      nom: values.nom.trim(),
      reference: values.reference.trim(),
      categoryId: category.id,
      dosage: values.dosage.trim(),
      forme: values.forme,
      laboratoire: values.laboratoire.trim(),
      seuilMin: seuil,
      description: values.description.trim(),
    }

    setSubmitting(true)
    try {
      if (medicine) {
        await updateMedicine(medicine.id, input)
        void refresh()
        toast.success("Médicament modifié", { description: `${input.nom} ${input.dosage} a été mis à jour.` })
      } else {
        const result = await createMedicine(input, stock)
        void refresh()
        onSaved?.(result.id)
        if (result.stockError) {
          toast.warning("Médicament ajouté, mais son stock initial n'a pas été enregistré", {
            description: `${result.stockError} Enregistrez l'entrée depuis la page Stocks.`,
          })
        } else {
          toast.success("Médicament ajouté", {
            description:
              stock > 0
                ? `${input.nom} ${input.dosage} démarre avec un stock de ${stock}.`
                : `${input.nom} ${input.dosage} est dans le référentiel. Enregistrez une entrée pour alimenter son stock.`,
          })
        }
      }
      onClose()
    } catch (err) {
      // 409 : la référence existe déjà dans cette structure
      if (err instanceof ApiError && err.status === 409) setErrors({ reference: err.message })
      else setFormError(describeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={medicine ? "Modifier le médicament" : "Ajouter un médicament"}
      className="sm:max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" form="medicine-form" disabled={submitting} className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
            {submitting && <LoaderCircle className="size-4 animate-spin" />}
            {medicine ? "Enregistrer" : "Ajouter"}
          </Button>
        </>
      }
    >
      <form id="medicine-form" onSubmit={submit} noValidate className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <div className="flex items-start gap-2.5 rounded-xl bg-[#2563EB]/5 px-4 py-3 text-sm text-[#1E40AF] sm:col-span-2">
          <Info className="mt-0.5 size-4 shrink-0" />
          {fromEntry
            ? "Le stock sera ajouté par l'entrée que vous êtes en train d'enregistrer."
            : "Le stock évolue ensuite avec les entrées et les sorties. Le stock initial ci-dessous est facultatif."}
        </div>

        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C] sm:col-span-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {formError}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="nom">Nom du médicament</Label>
          <Input id="nom" placeholder="Amoxicilline" value={values.nom} onChange={(e) => set("nom")(e.target.value)} aria-invalid={!!errors.nom} className={cn(fieldCls, errors.nom && invalidCls)} />
          <FieldError message={errors.nom} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reference">Référence</Label>
          <Input id="reference" placeholder="MED-011" value={values.reference} onChange={(e) => set("reference")(e.target.value)} aria-invalid={!!errors.reference} className={cn(fieldCls, errors.reference && invalidCls)} />
          <FieldError message={errors.reference} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categorie">Catégorie</Label>
          <SelectField
            id="categorie"
            value={values.categorie}
            onChange={set("categorie")}
            placeholder={loadingCategories ? "Chargement des catégories..." : "Sélectionner une catégorie"}
            options={categories.map((c) => c.nom)}
            invalid={!!errors.categorie}
          />
          <FieldError message={errors.categorie} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dosage">Dosage</Label>
          <Input id="dosage" placeholder="500 mg" value={values.dosage} onChange={(e) => set("dosage")(e.target.value)} aria-invalid={!!errors.dosage} className={cn(fieldCls, errors.dosage && invalidCls)} />
          <FieldError message={errors.dosage} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="forme">Forme pharmaceutique</Label>
          <SelectField id="forme" value={values.forme} onChange={set("forme")} placeholder="Sélectionner une forme" options={FORMES} invalid={!!errors.forme} />
          <FieldError message={errors.forme} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="laboratoire">
            Laboratoire <span className="font-normal text-[#64748B]">(facultatif)</span>
          </Label>
          <Input id="laboratoire" placeholder="Pfizer" value={values.laboratoire} onChange={(e) => set("laboratoire")(e.target.value)} className={fieldCls} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="seuilMin">Seuil minimum</Label>
          <Input id="seuilMin" type="number" min={0} placeholder="40" value={values.seuilMin} onChange={(e) => set("seuilMin")(e.target.value)} aria-invalid={!!errors.seuilMin} className={cn(fieldCls, errors.seuilMin && invalidCls)} />
          <p className="text-xs text-[#64748B]">Une alerte se déclenche quand le stock atteint ce seuil.</p>
          <FieldError message={errors.seuilMin} />
        </div>

        {!medicine && !fromEntry && (
          <div className="space-y-1.5">
            <Label htmlFor="stockInitial">
              Stock initial <span className="font-normal text-[#64748B]">(facultatif)</span>
            </Label>
            <Input id="stockInitial" type="number" min={0} placeholder="0" value={values.stockInitial} onChange={(e) => set("stockInitial")(e.target.value)} aria-invalid={!!errors.stockInitial} className={cn(fieldCls, errors.stockInitial && invalidCls)} />
            <p className="text-xs text-[#64748B]">Crée une entrée « Stock initial » dans l'historique.</p>
            <FieldError message={errors.stockInitial} />
          </div>
        )}

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">
            Description <span className="font-normal text-[#64748B]">(facultatif)</span>
          </Label>
          <textarea
            id="description"
            rows={3}
            value={values.description}
            onChange={(e) => set("description")(e.target.value)}
            className="w-full resize-none rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm"
          />
        </div>
      </form>
    </Modal>
  )
}