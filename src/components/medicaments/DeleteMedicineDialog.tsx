import { OctagonAlert, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Modal from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { useData } from "@/context/DataContext"
import { medLabel } from "@/lib/stock"
import type { Medicine } from "@/lib/types"

export default function DeleteMedicineDialog({ medicine, onClose }: { medicine: Medicine | null; onClose: () => void }) {
  const { canDeleteMedicine, deleteMedicine } = useData()
  if (!medicine) return null

  const blocked = !canDeleteMedicine(medicine.id)

  const confirm = () => {
    const result = deleteMedicine(medicine.id)
    if (!result.ok) {
      toast.error("Suppression impossible", { description: result.error })
      return
    }
    toast.success("Médicament supprimé", { description: `${medLabel(medicine)} a été retiré du référentiel.` })
    onClose()
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
            <Button onClick={confirm} className="bg-[#EF4444] text-white hover:bg-[#DC2626]">
              <Trash2 className="size-4" /> Supprimer
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