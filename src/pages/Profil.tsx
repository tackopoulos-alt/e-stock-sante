import type { ReactNode } from "react"
import { ArrowDownToLine, ArrowUpFromLine, Building2, History, ShieldCheck } from "lucide-react"
import PasswordCard from "@/components/profil/PasswordCard"
import ProfileForm from "@/components/profil/ProfileForm"
import { formatDateTime, initials } from "@/lib/format"
import { describeError, useMovements } from "@/lib/queries"
import { medLabel } from "@/lib/stock"
import { useProfile } from "@/lib/useProfile"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, { label: string; badge: string; dot: string }> = {
  actif: { label: "Compte actif", badge: "bg-[#10B981]/10 text-[#047857]", dot: "bg-[#10B981]" },
  en_attente: { label: "En attente", badge: "bg-[#F59E0B]/15 text-[#B45309]", dot: "bg-[#F59E0B]" },
  inactif: { label: "Compte désactivé", badge: "bg-slate-100 text-[#475569]", dot: "bg-slate-400" },
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[#0F2747]">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-[#64748B]">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function Profil() {
  const profile = useProfile()
  // Mes opérations : le serveur filtre sur mon identifiant, et donne le total
  const activity = useMovements({ page: 1, limit: 5, userId: profile?.id }, !!profile)

  if (!profile) return null

  const recent = activity.data?.items ?? []
  const status = statusStyles[profile.statut] ?? statusStyles.actif
  const roleLabel = profile.role === "admin" ? "Administrateur" : "Gestionnaire de stock"

  const infos: [string, string][] = [
    ["Structure", profile.structure.nom],
    ["Type de structure", profile.structure.type],
    ["Fonction", profile.fonction],
    ["Rôle d'accès", roleLabel],
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F2747]">Mon profil</h1>
        <p className="mt-1 text-[#64748B]">Consultez et modifiez vos informations personnelles.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="h-fit rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#2563EB] text-2xl font-bold text-white">
            {initials(profile.nom)}
          </div>
          <p className="mt-4 text-lg font-bold text-[#0F2747]">{profile.nom}</p>
          <p className="text-sm text-[#64748B]">{profile.fonction}</p>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-[#2563EB]/10 px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">
              {profile.role === "admin" ? "Administrateur" : "Gestionnaire"}
            </span>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", status.badge)}>
              <span className={cn("size-1.5 rounded-full", status.dot)} />
              {status.label}
            </span>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#F8FAFC] p-3 text-left text-sm">
            <Building2 className="mt-0.5 size-4 shrink-0 text-[#64748B]" />
            <div>
              <p className="font-medium text-[#172033]">{profile.structure.nom}</p>
              <p className="text-xs text-[#64748B]">{profile.structure.type}</p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[#E2E8F0] pt-4 text-left">
            <div>
              <dt className="text-xs text-[#64748B]">Opérations</dt>
              <dd className="text-xl font-bold text-[#0F2747]">{activity.data ? activity.data.total : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#64748B]">Dernière</dt>
              <dd className="text-sm font-semibold text-[#0F2747]">{recent[0] ? new Date(recent[0].date).toLocaleDateString("fr-FR") : "—"}</dd>
            </div>
          </dl>
        </aside>

        <div className="space-y-6 lg:col-span-2">
          <Section title="Informations personnelles">
            <ProfileForm key={`${profile.nom}|${profile.telephone ?? ""}`} />
          </Section>

          <Section title="Structure et accès">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {infos.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-[#64748B]">{label}</dt>
                  <dd className="font-semibold text-[#0F2747]">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#2563EB]/5 px-4 py-3 text-sm text-[#1E40AF]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              Ces informations sont gérées par un administrateur, depuis la page Utilisateurs.
            </p>
          </Section>

          <Section title="Sécurité" description="Choisissez un mot de passe d'au moins 6 caractères.">
            <PasswordCard />
          </Section>

          <Section title="Mon activité récente" description="Vos 5 dernières opérations de stock.">
            {activity.isPending ? (
              <p className="py-6 text-center text-sm text-[#64748B]">Chargement...</p>
            ) : activity.isError ? (
              <p role="alert" className="py-6 text-center text-sm text-[#B91C1C]">{describeError(activity.error)}</p>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <History className="size-8 text-[#64748B]" />
                <p className="mt-2 text-sm font-medium text-[#0F2747]">Aucune opération pour le moment</p>
                <p className="text-sm text-[#64748B]">Vos entrées et sorties apparaîtront ici.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#E2E8F0]">
                {recent.map((mv) => {
                  const entree = mv.type === "entree"

                  return (
                    <li key={mv.id} className="flex items-center gap-3 py-3">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full",
                          entree ? "bg-[#10B981]/10 text-[#10B981]" : "bg-[#2563EB]/10 text-[#2563EB]",
                        )}
                      >
                        {entree ? <ArrowDownToLine className="size-[18px]" /> : <ArrowUpFromLine className="size-[18px]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F2747]">{medLabel(mv.medicine)}</p>
                        <p className="text-xs text-[#64748B]">
                          {entree ? "Entrée" : "Sortie"} · {formatDateTime(mv.date)}
                        </p>
                      </div>
                      <span className={cn("shrink-0 text-sm font-bold", entree ? "text-[#10B981]" : "text-[#2563EB]")}>
                        {entree ? "+" : "−"}
                        {mv.quantite}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}