import { CalendarDays } from "lucide-react"
import { PageError, PageLoading } from "@/components/common/PageState"
import AlertesRecentes from "@/components/dashboard/AlertesRecentes"
import CarteVisuelle from "@/components/dashboard/CarteVisuelle"
import DernieresOperations from "@/components/dashboard/DernieresOperations"
import EvolutionChart from "@/components/dashboard/EvolutionChart"
import ProduitsProchesRupture from "@/components/dashboard/ProduitsProchesRupture"
import RepartitionChart from "@/components/dashboard/RepartitionChart"
import StatsCards from "@/components/dashboard/StatsCards"
import { useDashboard } from "@/lib/queries"
import { useProfile } from "@/lib/useProfile"

export default function Dashboard() {
  const profile = useProfile()
  // Un seul appel au serveur donne tout le tableau de bord
  const dashboard = useDashboard()
  const data = dashboard.data
  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const firstName = (profile?.nom ?? "").split(" ")[0]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2747]">{firstName ? `Bonjour, ${firstName} 👋` : "Bonjour 👋"}</h1>
          <p className="mt-1 text-[#64748B]">Voici un aperçu de la gestion de vos stocks aujourd'hui.</p>
        </div>
        <p className="flex items-center gap-2 text-sm capitalize text-[#64748B]">
          <CalendarDays className="size-4" />
          {dateLabel}
        </p>
      </div>

      {dashboard.isPending && !data ? (
        <PageLoading />
      ) : dashboard.isError && !data ? (
        <PageError error={dashboard.error} onRetry={() => void dashboard.refetch()} />
      ) : data ? (
        <>
          <StatsCards stats={data.stats} />

          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 [&>div]:h-full">
              <EvolutionChart evolution={data.evolution} />
            </div>
            <div className="[&>div]:h-full">
              <RepartitionChart repartition={data.repartition} />
            </div>
          </div>

          <div className="mt-6 grid items-start gap-6 xl:grid-cols-3">
            <AlertesRecentes alerts={data.alertesRecentes} />
            <DernieresOperations />

            <div className="flex flex-col gap-6 xl:col-start-3">
              <ProduitsProchesRupture rows={data.produitsProchesRupture} />
              <CarteVisuelle />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}