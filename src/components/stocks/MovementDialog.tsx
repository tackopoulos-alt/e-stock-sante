import { useState, type FormEvent } from "react"
import { ArrowRight, ChevronDown, CircleAlert, LoaderCircle, Plus } from "lucide-react"
import { toast } from "sonner"
import LevelBadge from "@/components/common/LevelBadge"
import Modal from "@/components/common/Modal"
import MedicineForm from "@/components/medicaments/MedicineForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api"
import { todayInputValue } from "@/lib/format"
import { createMovement, describeError, useMedicines, useRefreshAfterChange } from "@/lib/queries"
import { getLevel, medLabel } from "@/lib/stock"
import type { MovementType } from "@/lib/types"
import { cn } from "@/lib/utils"

const SORTIE_MOTIFS = ["Dispensation aux patients", "Transfert vers un service", "Perte ou casse", "Produit périmé", "Autre"]
const PROVENANCES = ["Fournisseur", "Don", "Autre"]
const ENTREE_MOTIF: Record<string, string> = { Fournisseur: "Réapprovisionnement", Don: "Don", Autre: "Autre entrée" }

type Errors = Partial<Record<"medicine" | "quantite" | "date" | "expiration", string>>

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

function SelectField({ id, value, onChange, placeholder, options, invalid }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; options: { value: string; label: string }[]; invalid?: boolean }) {
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

interface MovementDialogProps {
  type: MovementType
  medicineId?: string
  onClose: () => void
}

export default function MovementDialog({ type, medicineId, onClose }: MovementDialogProps) {
  const { medicines } = useMedicines()
  const refresh = useRefreshAfterChange()
  const entree = type === "entree"

  const [id, setId] = useState(medicineId ?? "")
  const [quantite, setQuantite] = useState("")
  const [date, setDate] = useState(todayInputValue())
  const [lot, setLot] = useState("")
  const [expiration, setExpiration] = useState("")
  const [provenance, setProvenance] = useState("")
  const [motif, setMotif] = useState(SORTIE_MOTIFS[0])
  const [errors, setErrors] = useState<Errors>({})
  const [creating, setCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const sorted = [...medicines].sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
  const medicine = medicines.find((m) => m.id === id)

  const qty = Number(quantite)
  const validQty = quantite.trim() !== "" && Number.isInteger(qty) && qty > 0
  const after = medicine && validQty ? medicine.quantite + (entree ? qty : -qty) : null

  // Règle : une sortie ne peut pas dépasser le stock disponible (vérifiée pendant la saisie)
  const tooMuch = !entree && !!medicine && validQty && qty > medicine.quantite
  const noStock = !entree && !!medicine && medicine.quantite === 0
  const liveError = noStock
    ? "Ce médicament n'a plus de stock : aucune sortie n'est possible."
    : tooMuch && medicine
      ? `Impossible d'effectuer une sortie de ${qty} unité(s). Stock disponible : ${medicine.quantite}.`
      : undefined

  const clear = (key: keyof Errors) => setErrors((e) => ({ ...e, [key]: undefined }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    const today = todayInputValue()

    if (!medicine) next.medicine = "Sélectionnez un médicament."
    if (!validQty) next.quantite = "Saisissez une quantité entière supérieure à 0."
    if (!date) next.date = "Choisissez une date."
    else if (date > today) next.date = "La date ne peut pas être dans le futur."
    if (entree && expiration && expiration < today) next.expiration = "Cette date d'expiration est déjà passée."

    setErrors(next)
    setFormError("")
    if (Object.keys(next).length > 0 || liveError || !medicine) return

    const before = getLevel(medicine)
    setSubmitting(true)
    try {
      const result = await createMovement(type, {
        medicineId: medicine.id,
        quantite: qty,
        date,
        motif: entree ? (ENTREE_MOTIF[provenance] ?? "Réapprovisionnement") : motif,
        // Le lot, l'expiration et la provenance ne concernent que les entrées
        ...(entree ? { numeroLot: lot.trim() || undefined, dateExpiration: expiration || undefined, provenance: provenance || undefined } : {}),
      })

      // Le serveur donne le stock réel après l'opération
      const newStock = result.medicine.quantite
      const afterLevel = getLevel({ quantite: newStock, seuilMin: medicine.seuilMin })
      let description = `${medLabel(medicine)} : stock ${medicine.quantite} → ${newStock}.`
      if (afterLevel !== "normal" && afterLevel !== before) {
        description += afterLevel === "rupture" ? " Rupture de stock : une alerte a été générée." : " Stock sous le seuil : une alerte a été générée."
      }
      if (before !== "normal" && afterLevel === "normal") description += " L'alerte de stock est levée."

      void refresh()
      toast.success(entree ? "Entrée enregistrée" : "Sortie enregistrée", { description })
      onClose()
    } catch (err) {
      // 409 : par exemple une sortie plus grande que le stock réel (quelqu'un d'autre vient de sortir des unités)
      if (err instanceof ApiError && err.status === 409) setErrors({ quantite: err.message })
      else setFormError(describeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={entree ? "Enregistrer une entrée" : "Enregistrer une sortie"}
        description={entree ? "Le stock augmente de la quantité saisie." : "Le stock diminue de la quantité saisie."}
        className="sm:max-w-xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              form="movement-form"
              disabled={!!liveError || submitting}
              className={cn("text-white", entree ? "bg-[#10B981] hover:bg-[#059669]" : "bg-[#2563EB] hover:bg-[#1D4ED8]")}
            >
              {submitting && <LoaderCircle className="size-4 animate-spin" />}
              {entree ? "Enregistrer l'entrée" : "Enregistrer la sortie"}
            </Button>
          </>
        }
      >
        <form id="movement-form" onSubmit={submit} noValidate className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          {formError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#B91C1C] sm:col-span-2">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {formError}
            </div>
          )}

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="medicament">Médicament</Label>
            <SelectField
              id="medicament"
              value={id}
              onChange={(v) => {
                setId(v)
                clear("medicine")
              }}
              placeholder="Sélectionner un médicament"
              invalid={!!errors.medicine}
              options={sorted.map((m) => ({ value: m.id, label: `${medLabel(m)} — stock : ${m.quantite}` }))}
            />
            <FieldError message={errors.medicine} />
            {entree && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 pt-0.5 text-sm font-medium text-[#2563EB] hover:underline"
              >
                <Plus className="size-4" /> Médicament absent de la liste ? Créer un nouveau médicament
              </button>
            )}
          </div>

          {medicine && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 sm:col-span-2">
              <div>
                <p className="text-xs text-[#64748B]">{entree ? "Stock actuel" : "Stock disponible"}</p>
                <p className="text-2xl font-bold text-[#0F2747]">{medicine.quantite}</p>
              </div>
              {after !== null && !tooMuch ? (
                <>
                  <ArrowRight className="size-5 text-[#64748B]" />
                  <div>
                    <p className="text-xs text-[#64748B]">Après l'opération</p>
                    <p className="text-2xl font-bold text-[#2563EB]">{after}</p>
                  </div>
                  <div className="ml-auto">
                    <LevelBadge level={getLevel({ quantite: after, seuilMin: medicine.seuilMin })} />
                  </div>
                </>
              ) : (
                <div className="ml-auto">
                  <LevelBadge level={getLevel(medicine)} />
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="quantite">{entree ? "Quantité" : "Quantité à sortir"}</Label>
            <Input
              id="quantite"
              type="number"
              min={1}
              placeholder={entree ? "100" : "10"}
              value={quantite}
              onChange={(e) => {
                setQuantite(e.target.value)
                clear("quantite")
              }}
              aria-invalid={!!errors.quantite || !!liveError}
              className={cn(fieldCls, (errors.quantite || liveError) && invalidCls)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">{entree ? "Date d'entrée" : "Date de sortie"}</Label>
            <Input
              id="date"
              type="date"
              max={todayInputValue()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                clear("date")
              }}
              aria-invalid={!!errors.date}
              className={cn(fieldCls, errors.date && invalidCls)}
            />
            <FieldError message={errors.date} />
          </div>

          <div className="sm:col-span-2 -mt-2 space-y-1.5">
            <FieldError message={liveError ?? errors.quantite} />
          </div>

          {entree ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="lot">
                  Numéro de lot <span className="font-normal text-[#64748B]">(facultatif)</span>
                </Label>
                <Input id="lot" placeholder="LOT-2026-001" value={lot} onChange={(e) => setLot(e.target.value)} className={fieldCls} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expiration">
                  Date d'expiration <span className="font-normal text-[#64748B]">(facultatif)</span>
                </Label>
                <Input
                  id="expiration"
                  type="date"
                  value={expiration}
                  onChange={(e) => {
                    setExpiration(e.target.value)
                    clear("expiration")
                  }}
                  aria-invalid={!!errors.expiration}
                  className={cn(fieldCls, errors.expiration && invalidCls)}
                />
                <FieldError message={errors.expiration} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="provenance">
                  Provenance <span className="font-normal text-[#64748B]">(facultatif)</span>
                </Label>
                <SelectField
                  id="provenance"
                  value={provenance}
                  onChange={setProvenance}
                  placeholder="Fournisseur, don ou autre"
                  options={PROVENANCES.map((p) => ({ value: p, label: p }))}
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="motif">Motif</Label>
              <SelectField id="motif" value={motif} onChange={setMotif} options={SORTIE_MOTIFS.map((m) => ({ value: m, label: m }))} />
            </div>
          )}
        </form>
      </Modal>

      {creating && (
        <MedicineForm
          fromEntry
          onClose={() => setCreating(false)}
          onSaved={(newId) => {
            setId(newId)
            clear("medicine")
          }}
        />
      )}
    </>
  )
}