import { useEffect, useState, type ReactNode } from "react"
import { Ban, CircleAlert, CircleCheck, Clock, Info, LoaderCircle, LogOut, MailCheck, RefreshCw, Send, ServerCrash } from "lucide-react"
import AuthLayout from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { useAccount } from "@/context/AccountContext"
import { useAuth } from "@/context/AuthContext"
import type { Profile } from "@/lib/account"
import type { ApiError } from "@/lib/api"
import { authErrorMessage } from "@/lib/authErrors"
import { cn } from "@/lib/utils"

const primaryCls = "h-10 w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
const secondaryCls = "h-10 w-full border-[#E2E8F0] bg-white text-[#172033] hover:bg-[#F1F5F9]"

type NoticeKind = "info" | "success" | "error"

// Un encadré de message : bleu (information), vert (réussite) ou rouge (erreur)
export function Notice({ kind, children }: { kind: NoticeKind; children: ReactNode }) {
  const styles = {
    info: "border-[#2563EB]/30 bg-[#2563EB]/10 text-[#1E3A8A]",
    success: "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#166534]",
    error: "border-[#EF4444]/30 bg-[#EF4444]/10 text-[#B91C1C]",
  }[kind]
  const Icon = kind === "success" ? CircleCheck : kind === "error" ? CircleAlert : Info
  return (
    <div role={kind === "error" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm", styles)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

// Le rond coloré avec une icône, en haut de chaque écran
function Badge({ tone, children }: { tone: "blue" | "orange" | "red"; children: ReactNode }) {
  const styles = { blue: "bg-[#2563EB]/10 text-[#2563EB]", orange: "bg-[#F97316]/10 text-[#F97316]", red: "bg-[#EF4444]/10 text-[#EF4444]" }[tone]
  return <div className={cn("mx-auto flex size-14 items-center justify-center rounded-full", styles)}>{children}</div>
}

export function LogoutButton() {
  const { logout } = useAuth()
  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="mx-auto flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#172033]"
    >
      <LogOut className="size-4" />
      Se déconnecter
    </button>
  )
}

// 1. L'adresse e-mail n'est pas encore vérifiée
export function VerifyEmailScreen() {
  const { user } = useAuth()
  const { checkVerification, resendVerification } = useAccount()
  const [checking, setChecking] = useState(false)
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [message, setMessage] = useState<{ kind: NoticeKind; text: string } | null>(null)

  // Le décompte avant de pouvoir renvoyer l'e-mail : Firebase refuse les envois trop rapprochés
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleCheck = async () => {
    setChecking(true)
    setMessage(null)
    try {
      const verified = await checkVerification()
      if (!verified) {
        setMessage({ kind: "info", text: "Votre adresse n'est pas encore vérifiée. Ouvrez l'e-mail reçu, cliquez sur le lien, puis revenez ici." })
      }
    } catch (err) {
      setMessage({ kind: "error", text: authErrorMessage(err) ?? "Vérification impossible pour le moment. Réessayez." })
    } finally {
      setChecking(false)
    }
  }

  const handleResend = async () => {
    setSending(true)
    setMessage(null)
    try {
      await resendVerification()
      setCooldown(60)
      setMessage({ kind: "success", text: "E-mail envoyé. Pensez à regarder vos courriers indésirables." })
    } catch (err) {
      setMessage({ kind: "error", text: authErrorMessage(err) ?? "Envoi impossible pour le moment. Réessayez." })
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout title="Vérifiez votre e-mail" subtitle="Une dernière vérification avant de continuer.">
      <div className="space-y-4">
        <Badge tone="blue">
          <MailCheck className="size-7" />
        </Badge>
        <p className="text-center text-sm text-[#172033]">
          Nous avons envoyé un lien de vérification à <strong>{user?.email}</strong>. Cliquez dessus, puis revenez ici.
        </p>
        {message && <Notice kind={message.kind}>{message.text}</Notice>}
        <Button type="button" onClick={handleCheck} disabled={checking} className={primaryCls}>
          {checking ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {checking ? "Vérification..." : "J'ai vérifié mon adresse"}
        </Button>
        <Button type="button" variant="outline" onClick={handleResend} disabled={sending || cooldown > 0} className={secondaryCls}>
          {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
          {cooldown > 0 ? `Renvoyer l'e-mail (${cooldown} s)` : "Renvoyer l'e-mail"}
        </Button>
        <LogoutButton />
      </div>
    </AuthLayout>
  )
}

// 2. Inscrit, mais pas encore validé
export function PendingScreen({ profile }: { profile: Profile }) {
  const { refresh } = useAccount()
  const [checking, setChecking] = useState(false)

  const handleRefresh = async () => {
    setChecking(true)
    try {
      await refresh()
    } finally {
      setChecking(false)
    }
  }

  return (
    <AuthLayout title="Compte en attente" subtitle="Votre inscription a bien été enregistrée.">
      <div className="space-y-4">
        <Badge tone="orange">
          <Clock className="size-7" />
        </Badge>
        {profile.role === "admin" ? (
          <p className="text-center text-sm text-[#172033]">
            Votre structure <strong>{profile.structure.nom}</strong> a été créée, et vous en êtes l'administrateur. Votre compte sera activé après
            validation par l'équipe e-Stock Santé.
          </p>
        ) : (
          <p className="text-center text-sm text-[#172033]">
            Un administrateur de <strong>{profile.structure.nom}</strong> doit valider votre compte avant que vous puissiez utiliser l'application.
          </p>
        )}
        <p className="text-center text-sm text-[#64748B]">Une fois votre compte activé, cliquez ci-dessous pour entrer.</p>
        <Button type="button" onClick={handleRefresh} disabled={checking} className={primaryCls}>
          {checking ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Vérifier à nouveau
        </Button>
        <LogoutButton />
      </div>
    </AuthLayout>
  )
}

// 3. Compte désactivé
export function DisabledScreen({ profile }: { profile: Profile }) {
  return (
    <AuthLayout title="Compte désactivé" subtitle="Vous ne pouvez plus utiliser l'application.">
      <div className="space-y-4">
        <Badge tone="red">
          <Ban className="size-7" />
        </Badge>
        <p className="text-center text-sm text-[#172033]">
          Votre compte a été désactivé. Contactez un administrateur de <strong>{profile.structure.nom}</strong> pour le réactiver.
        </p>
        <LogoutButton />
      </div>
    </AuthLayout>
  )
}

function errorMessage(error: ApiError): string {
  if (error.code === "TIMEOUT") return "Le serveur met trop de temps à répondre. Il se réveille peut-être : réessayez dans un instant."
  if (error.code === "RESEAU") return "Impossible de joindre le serveur. Vérifiez votre connexion Internet."
  if (error.code === "NON_CONNECTE" || error.code === "NON_AUTHENTIFIE") return "Votre session a expiré. Déconnectez-vous, puis reconnectez-vous."
  if (error.code === "CONFIG_API") return error.message
  return "Le serveur a rencontré un problème. Réessayez dans un instant."
}

// 4. Le serveur n'a pas pu répondre
export function ErrorScreen({ error }: { error: ApiError }) {
  const { refresh } = useAccount()
  const [retrying, setRetrying] = useState(false)

  const handleRetry = async () => {
    setRetrying(true)
    try {
      await refresh()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <AuthLayout title="Connexion au serveur impossible" subtitle="Votre compte n'est pas en cause.">
      <div className="space-y-4">
        <Badge tone="red">
          <ServerCrash className="size-7" />
        </Badge>
        <Notice kind="error">{errorMessage(error)}</Notice>
        <Button type="button" onClick={handleRetry} disabled={retrying} className={primaryCls}>
          {retrying ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Réessayer
        </Button>
        <LogoutButton />
      </div>
    </AuthLayout>
  )
}