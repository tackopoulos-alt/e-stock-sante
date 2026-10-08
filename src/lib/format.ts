// "Il y a 5 min", "Il y a 3 h", "Il y a 2 j", "Il y a 2 mois"
export function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`

  const days = Math.floor(hours / 24)
  if (days < 30) return `Il y a ${days} j`

  return `Il y a ${Math.floor(days / 30)} mois`
}

// "28/11/2025 — 10:24"
export function formatDateTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString("fr-FR")
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  return `${date} — ${time}`
}

// Date du jour au format AAAA-MM-JJ, utilisée par les champs date des formulaires
export function todayInputValue() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

// "Awa Diop" -> "AD"
export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}