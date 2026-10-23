import { useState } from "react"
import { LoaderCircle, OctagonAlert, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Modal from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api"
import { deleteUser, describeError, updateUser, useRefreshUsers, type ApiUserRow } from "@/lib/queries"
import { useProfile } from "@/lib/useProfile"

export default function DeleteUserDialog({ user, onClose }: { user: ApiUserRow; onClose: () => void }) {
  const profile = useProfile()
  const refresh = useRefreshUsers()
  const [busy, setBusy] = useState(false)
  // Le serveur a refusé (il a le dernier mot : par exemple « il doit rester un administrateur actif »)
  const [refusal, setRefusal] = useState<string | null>(null)

  const isSelf = user.id === profile?.id
  const hasOperations = user.operations > 0

  // Ce qui empêche la suppression, dit avant même de proposer le bouton
  const reason = isSelf
    ? "vous ne pouvez pas supprimer votre propre compte."
    : hasOperations
      ? `a déjà ${user.operations} opération${user.operations > 1 ? "s" : ""} dans l'historique : pour garder la traçabilité, ce compte ne peut pas être supprimé.`
      : refusal
  const canDeactivate = !isSelf && hasOperations && user.statut !== "inactif"

  const confirm = async () => {
    setBusy(true)
    try {
      await deleteUser(user.id)
      void refresh()
      toast.success("Utilisateur supprimé", { description: `Le compte de ${user.nom} a été supprimé.` })
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setRefusal(err.message)
      else toast.error("Suppression impossible", { description: describeError(err) })
    } finally {
      setBusy(false)
    }
  }

  // Un compte qui a des opérations ne peut pas disparaître : on propose de le désactiver
  const deactivate = async () => {
    setBusy(true)
    try {
      await updateUser(user.id, { statut: "inactif" })
      void refresh()
      toast.success("Compte désactivé", { description: `${user.nom} ne peut plus se connecter.` })
      onClose()
    } catch (err) {
      toast.error("Action impossible", { description: describeError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={reason ? "Suppression impossible" : "Supprimer cet utilisateur ?"}
      footer={
        reason ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Compris
            </Button>
            {canDeactivate && (
              <Button onClick={deactivate} disabled={busy} className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                {busy && <LoaderCircle className="size-4 animate-spin" />}
                Désactiver ce compte
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={busy}>
              Annuler
            </Button>
            <Button onClick={confirm} disabled={busy} className="bg-[#EF4444] text-white hover:bg-[#DC2626]">
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Supprimer
            </Button>
          </>
        )
      }
    >
      {reason ? (
        <div className="flex items-start gap-3">
          <OctagonAlert className="mt-0.5 size-6 shrink-0 text-[#F59E0B]" />
          <div className="space-y-2 text-sm text-[#172033]">
            <p>
              <span className="font-semibold">{user.nom}</span> : {reason}
            </p>
            {canDeactivate && (
              <p className="text-[#64748B]">Vous pouvez désactiver son compte à la place : il ne pourra plus se connecter, et son historique est conservé.</p>
            )}
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