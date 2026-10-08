import { Boxes, Eye, History, Pencil, Trash2 } from "lucide-react"
import ActionMenu from "@/components/common/ActionMenu"

interface RowMenuProps {
  label: string
  onView: () => void
  onEdit: () => void
  onStock: () => void
  onHistory: () => void
  onDelete: () => void
}

export default function RowMenu({ label, onView, onEdit, onStock, onHistory, onDelete }: RowMenuProps) {
  return (
    <ActionMenu
      label={label}
      items={[
        { label: "Voir détails", icon: Eye, onClick: onView },
        { label: "Modifier", icon: Pencil, onClick: onEdit },
        { label: "Voir le stock", icon: Boxes, onClick: onStock },
        { label: "Historique", icon: History, onClick: onHistory },
        { label: "Supprimer", icon: Trash2, onClick: onDelete, danger: true, separatorBefore: true },
      ]}
    />
  )
}