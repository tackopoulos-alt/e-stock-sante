import { auth } from "./firebase"

// Le client de l'API : un seul endroit qui sait parler au serveur.
// Il ajoute tout seul le jeton de connexion Firebase, et transforme toutes les erreurs en un ApiError
// que les pages savent lire (statut, code, messages).

// Un serveur gratuit qui s'est endormi met environ une minute à se réveiller : on attend assez longtemps
const DEFAULT_TIMEOUT_MS = 90_000

export class ApiError extends Error {
  // Le statut HTTP (401, 403, 404, 409...), ou 0 si le serveur n'a pas pu être joint
  status: number
  // Un code que le frontend sait lire : COMPTE_EN_ATTENTE, INSCRIPTION_INCOMPLETE, DEJA_INSCRIT, RESEAU, TIMEOUT...
  code: string
  // Les messages à afficher (plusieurs, quand un formulaire contient plusieurs erreurs)
  messages: string[]

  constructor(status: number, code: string, messages: string[]) {
    super(messages[0] ?? "Une erreur est survenue.")
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.messages = messages
  }
}

type Query = Record<string, string | number | boolean | null | undefined>

export interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  // Les filtres de l'adresse (?page=1&type=entree). Les valeurs vides ou absentes sont ignorées.
  query?: Query
  timeoutMs?: number
}

// Le code à utiliser quand le serveur n'en donne pas
function defaultCode(status: number): string {
  if (status === 400) return "DONNEES_INVALIDES"
  if (status === 401) return "NON_AUTHENTIFIE"
  if (status === 403) return "ACCES_REFUSE"
  if (status === 404) return "INTROUVABLE"
  if (status === 409) return "CONFLIT"
  return status >= 500 ? "SERVEUR" : "ERREUR"
}

// Le serveur répond de trois façons : { message: "..." }, { message: ["...", "..."] } (validation), ou pas du JSON du tout
function toApiError(status: number, data: unknown): ApiError {
  if (data && typeof data === "object") {
    const body = data as { code?: unknown; message?: unknown }
    const code = typeof body.code === "string" ? body.code : defaultCode(status)
    if (Array.isArray(body.message)) return new ApiError(status, code, body.message.map(String))
    if (typeof body.message === "string") return new ApiError(status, code, [body.message])
    return new ApiError(status, code, ["Une erreur est survenue."])
  }
  return new ApiError(status, defaultCode(status), ["Le serveur ne répond pas correctement. Réessayez dans un instant."])
}

function buildUrl(path: string, query?: Query): string {
  const base = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "")
  if (!base) {
    throw new ApiError(0, "CONFIG_API", ["Adresse de l'API manquante : ajoutez VITE_API_URL dans .env.local, puis relancez npm run dev."])
  }
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  }
  const search = params.toString()
  return `${base}${path.startsWith("/") ? path : `/${path}`}${search ? `?${search}` : ""}`
}

// Le jeton de la personne connectée. Firebase le renouvelle tout seul quand il approche de son expiration (une heure).
async function currentToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new ApiError(401, "NON_CONNECTE", ["Vous n'êtes pas connecté."])
  try {
    return await user.getIdToken()
  } catch {
    throw new ApiError(401, "NON_CONNECTE", ["Votre session a expiré : reconnectez-vous."])
  }
}

// Appelle l'API. Renvoie les données, ou lance une ApiError.
//   const medicines = await apiFetch<Medicine[]>("/medicines")
//   await apiFetch("/medicines", { method: "POST", body: { nom: "Quinine", ... } })
export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = buildUrl(path, options.query)
  const token = await currentToken()

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(0, "TIMEOUT", ["Le serveur met trop de temps à répondre. Réessayez dans un instant."])
    }
    throw new ApiError(0, "RESEAU", ["Impossible de joindre le serveur. Vérifiez votre connexion Internet."])
  } finally {
    clearTimeout(timer)
  }

  // 204 : réussi, sans contenu (une suppression)
  if (response.status === 204) return undefined as T

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    // pas du JSON : géré plus bas
  }

  if (!response.ok) throw toApiError(response.status, data)
  return data as T
}

// Pour essayer l'API depuis la console du navigateur, SEULEMENT pendant le développement :
//   await __api("/auth/me")
if (import.meta.env.DEV) {
  ;(window as unknown as { __api: typeof apiFetch }).__api = apiFetch
}
