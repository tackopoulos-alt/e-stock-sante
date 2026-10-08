import { useEffect, useState, type ReactNode } from "react"
import { PackageCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const slides = [
  {
    image: "/image/login-2.jpg.png",
    title: "Anticipez les ruptures avant qu'elles n'arrivent.",
    text: "Des alertes claires dès qu'un seuil est atteint.",
  },
  {
    image: "/image/login-1.jpg.png",
    title: "Chaque médicament compte.",
    text: "Suivez vos stocks en temps réel, de l'entrée à la sortie.",
  },
  {
    image: "/image/login-3.jpg.png",
    title: "Chaque opération est tracée.",
    text: "Qui, quand, combien : un historique fiable à consulter.",
  },
]

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  wide?: boolean
}

export default function AuthLayout({ title, subtitle, children, wide = false }: AuthLayoutProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [current])

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau gauche : images qui défilent */}
      <div className="relative hidden overflow-hidden bg-[#0F2747] text-white lg:block">
        {slides.map((s, i) => (
          <div
            key={s.image}
            aria-hidden={i !== current}
            className={cn(
              "absolute inset-0 bg-cover bg-center transition-opacity duration-1000",
              i === current ? "opacity-100" : "opacity-0",
            )}
            style={{ backgroundImage: `url(${s.image})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F2747] via-[#0F2747]/75 to-[#0F2747]/40" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="relative flex size-11 items-center justify-center rounded-xl bg-white text-[#0F2747]">
              <PackageCheck className="size-6 text-[#2563EB]" />
              <span className="absolute -right-1 -top-1 size-3 rounded-full bg-[#F97316] ring-2 ring-[#0F2747]" />
            </div>
            <span className="text-xl font-bold">e-Stock Santé</span>
          </div>

          <div>
            <div className="relative h-44 max-w-md">
              {slides.map((s, i) => (
                <div
                  key={s.title}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-700",
                    i === current ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                >
                  <h2 className="text-4xl font-bold leading-tight tracking-tight">{s.title}</h2>
                  <p className="mt-4 text-lg text-blue-100">{s.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.image}
                  type="button"
                  aria-label={`Afficher la diapositive ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === current ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/70",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Colonne droite : le contenu propre à chaque page */}
      <div className="flex items-center justify-center bg-[#F8FAFC] px-6 py-10">
        <div className={cn("w-full", wide ? "max-w-xl" : "max-w-md")}>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#0F2747] text-white">
              <PackageCheck className="size-5 text-[#2563EB]" />
            </div>
            <span className="text-lg font-bold text-[#0F2747]">e-Stock Santé</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0F2747]">{title}</h1>
          <p className="mb-8 mt-2 text-[#64748B]">{subtitle}</p>

          {children}
        </div>
      </div>
    </div>
  )
}