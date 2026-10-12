import { FirebaseError } from "firebase/app"

// Messages en français pour les erreurs de connexion Firebase.
// Retourne null quand il ne faut rien afficher (l'utilisateur a simplement fermé la fenêtre Google).
export function authErrorMessage(err: unknown): string | null {
  if (!(err instanceof FirebaseError)) return "Une erreur est survenue. Réessayez."

  switch (err.code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail ou mot de passe incorrect."
    case "auth/invalid-email":
      return "Saisissez une adresse e-mail valide."
    case "auth/user-disabled":
      return "Ce compte est désactivé. Contactez un administrateur."
    case "auth/too-many-requests":
      return "Trop de tentatives. Réessayez dans quelques minutes, ou réinitialisez votre mot de passe."
    case "auth/network-request-failed":
      return "Connexion impossible : vérifiez votre connexion internet."
    case "auth/popup-blocked":
      return "Le navigateur a bloqué la fenêtre Google. Autorisez les fenêtres pop-up pour ce site, puis réessayez."
    case "auth/account-exists-with-different-credential":
      return "Un compte existe déjà avec cette adresse, avec une autre méthode de connexion."
    case "auth/unauthorized-domain":
      return "Ce site n'est pas encore autorisé pour la connexion Google."
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null
    default:
            return "Une erreur est survenue. Réessayez dans un instant."
  }
}
