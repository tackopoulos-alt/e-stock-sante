import { OctagonAlert, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Modal from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { useData } from "@/context/DataContext"
import type { User } from "@/lib/types"

export default function DeleteUserDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { deletionBlock, deleteUser, setUserStatus } = useData()
  if (!user) return null

  const block = deletionBlock(user.id)

  const confirm = () => {
    const result = deleteUser(user.id)
    if (!result.ok) {
      toast.error("Suppression impossible", { description: result.error })
      return
    }
    toast.success("Utilisateur supprimé", { description: `Le compte de ${user.nom} a été supprimé.` })
    onClose()
  }

  // Un compte qui a des opérations ne peut pas disparaître : on propose de le désactiver
  const deactivate = () => {
    const result = setUserStatus(user.id, "inactif")
    if (!result.ok) {
      toast.error("Action impossible", { description: result.error })
      return
    }
    toast.success("Compte désactivé", { description: `${user.nom} ne peut plus se connecter.` })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={block ? "Suppression impossible" : "Supprimer cet utilisateur ?"}
      footer={
        block ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Compris
            </Button>
            {block.code === "operations" && user.statut !== "inactif" && (
              <Button onClick={deactivate} className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                Désactiver ce compte
              </Button>
            )}
          </>
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
      {block ? (
        <div className="flex items-start gap-3">
          <OctagonAlert className="mt-0.5 size-6 shrink-0 text-[#F59E0B]" />
          <div className="space-y-2 text-sm text-[#172033]">
            <p>
              <span className="font-semibold">{user.nom}</span> : {block.message}
            </p>
            {block.code === "operations" && <p className="text-[#64748B]">Vous pouvez désactiver son compte à la place : il ne pourra plus se connecter, et son historique est conservé.</p>}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#172033]">
          Le compte de <span className="font-semibold">{user.nom}</span> sera supprimé définitivement. Cette action est irréversible.
        </p>
      )}
    </Modal>
  )
}
