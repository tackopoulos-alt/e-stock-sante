import { useState, type FormEvent } from "react"
import { ChevronDown, CircleAlert, Info } from "lucide-react"
import { toast } from "sonner"
import Modal from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useData } from "@/context/DataContext"
import { CATEGORIES, FORMES } from "@/data/options"
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
  const { medicines, addMedicine, updateMedicine } = useData()
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

  const set = (key: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = (e: FormEvent) => {
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

    setErrors(next)
    if (Object.keys(next).length > 0) return

    const input = {
      nom: values.nom.trim(),
      reference: values.reference.trim(),
      categorie: values.categorie,
      dosage: values.dosage.trim(),
      forme: values.forme,
      laboratoire: values.laboratoire.trim(),
      seuilMin: seuil,
      description: values.description.trim(),
    }

    const result = medicine ? updateMedicine(medicine.id, input) : addMedicine(input, stock)
    if (!result.ok) {
      setErrors({ reference: result.error })
      return
    }

    if (!medicine && result.id) onSaved?.(result.id)

    if (medicine) {
      toast.success("Médicament modifié", { description: `${input.nom} ${input.dosage} a été mis à jour.` })
    } else {
      toast.success("Médicament ajouté", {
        description:
          stock > 0
            ? `${input.nom} ${input.dosage} démarre avec un stock de ${stock}.`
            : `${input.nom} ${input.dosage} est dans le référentiel. Enregistrez une entrée pour alimenter son stock.`,
      })
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={medicine ? "Modifier le médicament" : "Ajouter un médicament"}
      className="sm:max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="medicine-form" className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
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
          <SelectField id="categorie" value={values.categorie} onChange={set("categorie")} placeholder="Sélectionner une catégorie" options={CATEGORIES} invalid={!!errors.categorie} />
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