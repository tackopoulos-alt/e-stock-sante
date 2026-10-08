import type { Lot, Medicine, Movement, MovementType, User } from "@/lib/types"

// Date/heure il y a "jours" jours (ex. 0 = aujourd'hui)
const daysAgo = (jours: number, heure: number, minute = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - jours)
  d.setHours(heure, minute, 0, 0)
  return d.toISOString()
}

// Date (AAAA-MM-JJ) dans "jours" jours
const inDays = (jours: number) => {
  const d = new Date()
  d.setDate(d.getDate() + jours)
  return d.toISOString().slice(0, 10)
}

export const medicines: Medicine[] = [
  { id: "m1", nom: "Paracétamol", reference: "MED-001", categorie: "Antalgique", dosage: "500 mg", forme: "Comprimé", laboratoire: "Sanofi", seuilMin: 30, quantite: 0, description: "Antalgique et antipyrétique de première intention." },
  { id: "m2", nom: "Amoxicilline", reference: "MED-002", categorie: "Antibiotique", dosage: "500 mg", forme: "Gélule", laboratoire: "Pharmakina", seuilMin: 40, quantite: 18, description: "Antibiotique à large spectre de la famille des pénicillines." },
  { id: "m3", nom: "Artéméther / Luméfantrine", reference: "MED-003", categorie: "Antipaludique", dosage: "80/480 mg", forme: "Comprimé", laboratoire: "Novartis", seuilMin: 100, quantite: 240, description: "Traitement du paludisme simple." },
  { id: "m4", nom: "Sels de réhydratation orale", reference: "MED-004", categorie: "Réhydratation", dosage: "20,5 g", forme: "Sachet", laboratoire: "Laborex", seuilMin: 150, quantite: 320, description: "Prise en charge des diarrhées et de la déshydratation." },
  { id: "m5", nom: "Ibuprofène", reference: "MED-005", categorie: "Anti-inflammatoire", dosage: "400 mg", forme: "Comprimé", laboratoire: "Sanofi", seuilMin: 50, quantite: 85, description: "Anti-inflammatoire non stéroïdien." },
  { id: "m6", nom: "Métronidazole", reference: "MED-006", categorie: "Antibiotique", dosage: "500 mg", forme: "Comprimé", laboratoire: "Pharmakina", seuilMin: 40, quantite: 0, description: "Antibiotique et antiparasitaire." },
  { id: "m7", nom: "Sulfate de zinc", reference: "MED-007", categorie: "Vitamines et minéraux", dosage: "20 mg", forme: "Comprimé", laboratoire: "Laborex", seuilMin: 60, quantite: 150, description: "Complément recommandé dans les diarrhées de l'enfant." },
  { id: "m8", nom: "Ceftriaxone", reference: "MED-008", categorie: "Antibiotique", dosage: "1 g", forme: "Injectable", laboratoire: "Roche", seuilMin: 40, quantite: 35, description: "Céphalosporine injectable pour infections sévères." },
  { id: "m9", nom: "Salbutamol", reference: "MED-009", categorie: "Respiratoire", dosage: "100 µg", forme: "Spray", laboratoire: "GSK", seuilMin: 25, quantite: 60, description: "Bronchodilatateur pour la crise d'asthme." },
  { id: "m10", nom: "Oxytocine", reference: "MED-010", categorie: "Obstétrique", dosage: "10 UI", forme: "Injectable", laboratoire: "Roche", seuilMin: 20, quantite: 12, description: "Prévention des hémorragies du post-partum." },
]

const hopital = "Hôpital Régional de Saint-Louis"

export const users: User[] = [
  { id: "u1", nom: "Awa Diop", email: "admin@estock.sn", typeStructure: "Hôpital", nomStructure: hopital, fonction: "Administrateur", role: "admin", statut: "actif" },
  { id: "u2", nom: "Moussa Ndiaye", email: "moussa.ndiaye@estock.sn", typeStructure: "Hôpital", nomStructure: hopital, fonction: "Gestionnaire de stock", role: "gestionnaire", statut: "actif" },
  { id: "u3", nom: "Fatou Sow", email: "fatou.sow@estock.sn", typeStructure: "Hôpital", nomStructure: hopital, fonction: "Pharmacien", role: "gestionnaire", statut: "actif" },
  { id: "u4", nom: "Ibrahima Ba", email: "ibrahima.ba@estock.sn", typeStructure: "Hôpital", nomStructure: hopital, fonction: "Agent de santé", role: "gestionnaire", statut: "actif" },
  { id: "u5", nom: "Mariama Faye", email: "mariama.faye@estock.sn", typeStructure: "Hôpital", nomStructure: hopital, fonction: "Responsable de pharmacie", role: "gestionnaire", statut: "actif" },
  { id: "u6", nom: "Cheikh Sarr", email: "cheikh.sarr@estock.sn", typeStructure: "Centre de Santé", nomStructure: "Centre de Santé de Sor", fonction: "Agent de santé", role: "gestionnaire", statut: "en_attente" },
]

// [médicament, type, quantité, il y a (jours), heure, utilisateur, motif]
const rows: [string, MovementType, number, number, number, string, string][] = [
  ["m1", "entree", 300, 6, 9, "u2", "Réapprovisionnement"],
  ["m2", "entree", 120, 6, 9, "u2", "Réapprovisionnement"],
  ["m3", "entree", 400, 6, 10, "u2", "Réapprovisionnement"],
  ["m4", "entree", 560, 6, 11, "u3", "Réapprovisionnement"],
  ["m6", "entree", 120, 6, 14, "u3", "Réapprovisionnement"],
  ["m8", "entree", 80, 6, 15, "u5", "Réapprovisionnement"],
  ["m10", "entree", 20, 6, 16, "u5", "Réapprovisionnement"],
  ["m1", "sortie", 90, 5, 8, "u3", "Dispensation consultation"],
  ["m2", "sortie", 60, 5, 10, "u2", "Dispensation pédiatrie"],
  ["m6", "sortie", 80, 5, 14, "u2", "Dispensation urgences"],
  ["m5", "entree", 150, 4, 9, "u2", "Don"],
  ["m3", "sortie", 110, 4, 11, "u3", "Dispensation paludisme"],
  ["m8", "sortie", 25, 4, 15, "u4", "Dispensation hospitalisation"],
  ["m1", "sortie", 120, 3, 9, "u4", "Dispensation consultation"],
  ["m7", "entree", 200, 3, 10, "u3", "Réapprovisionnement"],
  ["m4", "sortie", 180, 3, 13, "u5", "Dispensation pédiatrie"],
  ["m9", "entree", 80, 2, 9, "u5", "Réapprovisionnement"],
  ["m10", "sortie", 8, 2, 8, "u2", "Maternité"],
  ["m5", "sortie", 65, 2, 12, "u3", "Dispensation consultation"],
  ["m6", "sortie", 40, 2, 16, "u2", "Dispensation urgences"],
  ["m2", "sortie", 42, 1, 9, "u4", "Dispensation pédiatrie"],
  ["m1", "sortie", 90, 1, 11, "u3", "Dispensation consultation"],
  ["m7", "sortie", 50, 1, 14, "u4", "Dispensation pédiatrie"],
  ["m9", "sortie", 20, 1, 15, "u5", "Dispensation asthme"],
  ["m3", "sortie", 50, 0, 8, "u2", "Dispensation paludisme"],
  ["m8", "sortie", 20, 0, 9, "u3", "Dispensation hospitalisation"],
  ["m4", "sortie", 60, 0, 11, "u2", "Dispensation pédiatrie"],
]

export const movements: Movement[] = rows
  .map(([medicineId, type, quantite, jours, heure, userId, motif], i) => ({
    id: `mv${i + 1}`,
    medicineId,
    type,
    quantite,
    date: daysAgo(jours, heure, (i * 7) % 60),
    userId,
    motif,
  }))
  .sort((a, b) => b.date.localeCompare(a.date))

export const lots: Lot[] = [
  { id: "l1", medicineId: "m2", numero: "AMX-2208", quantite: 18, entree: inDays(-120), expiration: inDays(45), provenance: "Centrale d'achat" },
  { id: "l2", medicineId: "m10", numero: "OXY-0917", quantite: 12, entree: inDays(-100), expiration: inDays(22), provenance: "Programme national" },
  { id: "l3", medicineId: "m3", numero: "ACT-7781", quantite: 240, entree: inDays(-6), expiration: inDays(420), provenance: "Programme national" },
  { id: "l4", medicineId: "m4", numero: "SRO-3320", quantite: 320, entree: inDays(-6), expiration: inDays(300), provenance: "Centrale d'achat" },
  { id: "l5", medicineId: "m7", numero: "ZIN-4410", quantite: 150, entree: inDays(-3), expiration: inDays(510), provenance: "Centrale d'achat" },
  { id: "l6", medicineId: "m8", numero: "CEF-3350", quantite: 35, entree: inDays(-40), expiration: inDays(15), provenance: "Centrale d'achat" },
  { id: "l7", medicineId: "m5", numero: "IBU-9012", quantite: 85, entree: inDays(-4), expiration: inDays(200), provenance: "ONG partenaire" },
  { id: "l8", medicineId: "m9", numero: "SAL-1188", quantite: 60, entree: inDays(-2), expiration: inDays(260), provenance: "Centrale d'achat" },
]