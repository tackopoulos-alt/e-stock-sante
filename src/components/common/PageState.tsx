import { LoaderCircle, ServerCrash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { describeError } from "@/lib/queries"

// Ce qu'on affiche à la place d'une page pendant que ses données arrivent
export function PageLoading() {
  return (
    <div role="status" aria-label="Chargement" className="flex justify-center py-24">
      <LoaderCircle className="size-8 animate-spin text-[#2563EB]" />
    </div>
  )
}

// Ce qu'on affiche quand les données n'ont pas pu être chargées
export function PageError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-[#E2E8F0] bg-white px-6 py-14 text-center shadow-sm">
      <ServerCrash className="size-9 text-[#EF4444]" />
      <p className="mt-3 font-semibold text-[#0F2747]">Impossible de charger les données</p>
      <p className="mt-1 max-w-md text-sm text-[#64748B]">{describeError(error)}</p>
      <Button onClick={onRetry} className="mt-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
        Réessayer
      </Button>
    </div>
  )
}
