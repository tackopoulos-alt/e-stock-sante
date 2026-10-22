import { Link } from "react-router-dom"
import { ArrowRight, Pill } from "lucide-react"
import LevelBadge from "@/components/common/LevelBadge"
import Modal from "@/components/common/Modal"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/format"
import { describeError, useMedicineDetail, useMedicineMovements } from "@/lib/queries"
import { daysUntil, getLevel, medLabel } from "@/lib/stock"
import { cn } from "@/lib/utils"
import type { Medicine } from "@/lib/types"

function ExpiryBadge({ date }: { date?: string }) {
  if (!date) return <span className="text-xs text-[#64748B]">Sans date d'expiration</span>

  const days = daysUntil(date)
  const tone =
    days <= 30 ? "bg-[#EF4444]/10 text-[#B91C1C]" : days <= 90 ? "bg-[#F59E0B]/15 text-[#B45309]" : "bg-slate-100 text-[#475569]"

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
      Exp. {new Date(date + "T00:00:00").toLocaleDateString("fr-FR")}
    </span>
  )
}

export default function MedicineDetails({ medicine, onClose }: { medicine: Medicine | null; onClose: () => void }) {
  // Les lots et les derniers mouvements viennent du serveur ; rien n'est demandé tant qu'aucun médicament n'est ouvert
  const detail = useMedicineDetail(medicine?.id ?? null)
  const movements = useMedicineMovements(medicine?.id ?? null, 3)
  if (!medicine) return null

  const level = getLevel(medicine)
  const max = Math.max(medicine.seuilMin * 2, medicine.quantite, 1)
  const fill = Math.min(100, (medicine.quantite / max) * 100)
  const seuilPosition = Math.min(100, (medicine.seuilMin / max) * 100)
  const barColor = level === "normal" ? "bg-[#10B981]" : level === "faible" ? "bg-[#F59E0B]" : "bg-[#EF4444]"

  const myLots = (detail.data?.lots ?? []).filter((l) => l.quantite > 0)
  const lastMovements = movements.data?.items ?? []

  const infos: [string, string][] = [
    ["Référence", medicine.reference],
    ["Dosage", medicine.dosage],
    ["Forme", medicine.forme],
    ["Laboratoire", medicine.laboratoire || "—"],
    ["Seuil minimum", String(medicine.seuilMin)],
  ]

  return (
    <Modal
      open
      onClose={onClose}
      title="Fiche médicament"
      className="sm:max-w-xl"
      footer={
        <>
          <Link to="/historique" className="mr-auto flex items-center gap-1.5 text-sm font-medium text-[#2563EB] hover:underline">
            Voir l'historique des mouvements <ArrowRight className="size-4" />
          </Link>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/10 text-[#2563EB]">
            <Pill className="size-6" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#0F2747]">{medLabel(medicine)}</p>
            <p className="text-sm text-[#64748B]">{medicine.categorie}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {infos.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[#64748B]">{label}</dt>
              <dd className="font-semibold text-[#0F2747]">{value}</dd>
            </div>
          ))}
          {medicine.description && (
            <div className="col-span-2">
              <dt className="text-[#64748B]">Description</dt>
              <dd className="text-[#172033]">{medicine.description}</dd>
            </div>
          )}
        </dl>

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-[#64748B]">Stock actuel</p>
              <p className="text-3xl font-bold text-[#0F2747]">{medicine.quantite}</p>
            </div>
            <LevelBadge level={level} />
          </div>
          <div className="relative mt-3 h-2 rounded-full bg-slate-200" title={`Seuil minimum : ${medicine.seuilMin}`}>
            <div className={cn("h-full rounded-full", barColor)} style={{ width: `${fill}%` }} />
            <span className="absolute -top-1 h-4 w-0.5 rounded bg-[#64748B]" style={{ left: `${seuilPosition}%` }} />
          </div>
          <p className="mt-2 text-xs text-[#64748B]">Le trait marque le seuil minimum ({medicine.seuilMin}).</p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-[#0F2747]">Lots en stock</h3>
          {detail.isPending ? (
            <p className="text-sm text-[#64748B]">Chargement...</p>
          ) : detail.isError ? (
            <p className="text-sm text-[#B91C1C]">{describeError(detail.error)}</p>
          ) : myLots.length === 0 ? (
            <p className="text-sm text-[#64748B]">Aucun lot enregistré.</p>
          ) : (
            <ul className="divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0]">
              {myLots.map((lot) => (
                <li key={lot.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                  <span className="font-semibold text-[#0F2747]">{lot.numero}</span>
                  <span className="text-[#64748B]">{lot.quantite} unité(s)</span>
                  <ExpiryBadge date={lot.dateExpiration ?? undefined} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-[#0F2747]">Derniers mouvements</h3>
          {movements.isPending ? (
            <p className="text-sm text-[#64748B]">Chargement...</p>
          ) : movements.isError ? (
            <p className="text-sm text-[#B91C1C]">{describeError(movements.error)}</p>
          ) : lastMovements.length === 0 ? (
            <p className="text-sm text-[#64748B]">Aucun mouvement pour le moment.</p>
          ) : (
            <ul className="divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0]">
              {lastMovements.map((mv) => (
                <li key={mv.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="text-[#64748B]">{formatDateTime(mv.date)}</span>
                  <span className="hidden truncate text-[#172033] sm:block">{mv.user.nom}</span>
                  <span className={cn("font-bold", mv.type === "entree" ? "text-[#10B981]" : "text-[#2563EB]")}>
                    {mv.type === "entree" ? "Entrée +" : "Sortie −"}
                    {mv.quantite}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}