import { HeartPulse, PackageCheck } from "lucide-react"

export default function CarteVisuelle() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F2747] via-[#14346B] to-[#2563EB] p-6 text-white shadow-sm">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium leading-snug">
            Un bon stock aujourd'hui, c'est une meilleure disponibilité des médicaments demain.
          </p>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-100">
            <PackageCheck className="size-4" />
            e-Stock Santé
          </p>
        </div>

        <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
          <HeartPulse className="size-11 text-white" />
        </div>
      </div>
    </div>
  )
}