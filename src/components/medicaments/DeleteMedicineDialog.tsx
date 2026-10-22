import { useState } from "react"
import { LoaderCircle, OctagonAlert, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Modal from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api"
import { deleteMedicine, describeError, useMedicineMovements, useRefreshAfterChange } from "@/lib/queries"
import { medLabel } from "@/lib/stock"
import type { Medicine } from "@/lib/types"

export default function DeleteMedicineDialog({ medicine, onClose }: { medicine: Medicine; onClose: () => void }) {
  // Un médicament qui a des mouvements ne se supprime pas : on le vérifie avant de proposer le bouton
  const history = useMedicineMovements(medicine.id, 1)
  const refresh = useRefreshAfterChange()
  const [submitting, setSubmitting] = useState(false)
  // Le serveur a refusé (il a le dernier mot, même si la vérification ci-dessus n'avait rien vu)
  const [refused, setRefused] = useState(false)

  const blocked = (history.data?.total ?? 0) > 0 || refused
  const checking = history.isPending

  const confirm = async () => {
    setSubmitting(true)
    try {
      await deleteMedicine(medicine.id)
      void refresh()
      toast.success("Médicament supprimé", { description: `${medLabel(medicine)} a été retiré du référentiel.` })
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setRefused(true)
      else toast.error("Suppression impossible", { description: describeError(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={blocked ? "Suppression impossible" : "Supprimer ce médicament ?"}
      footer={
        blocked ? (
          <Button onClick={onClose} className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
            Compris
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={confirm} disabled={checking || submitting} className="bg-[#EF4444] text-white hover:bg-[#DC2626]">
              {checking || submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {checking ? "Vérification..." : "Supprimer"}
            </Button>
          </>
        )
      }
    >
      {blocked ? (
        <div className="flex items-start gap-3">
          <OctagonAlert className="mt-0.5 size-6 shrink-0 text-[#F59E0B]" />
          <p className="text-sm text-[#172033]">
            <span className="font-semibold">{medLabel(medicine)}</span> a déjà des entrées ou des sorties enregistrées. Pour garder la
            traçabilité des opérations, il ne peut pas être supprimé.
          </p>
        </div>
      ) : (
        <p className="text-sm text-[#172033]">
          <span className="font-semibold">{medLabel(medicine)}</span> sera supprimé définitivement du référentiel. Cette action est
          irréversible.
        </p>
      )}
    </Modal>
  )
}