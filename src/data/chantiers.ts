/**
 * Le portefeuille de chantiers de la maquette.
 *
 * Les dix chantiers et tous leurs montants viennent de l'export Gescof
 * « Résultats par chantiers » (`gescof.ts`) : code, libellé, chiffre d'affaires,
 * heures, salaires, marges. Rien n'y est simulé.
 *
 * En revanche, l'export ne porte aucun attribut de rattachement : ni ville, ni
 * agence, ni secteur, ni entité, ni responsable exploitation, ni état
 * d'avancement du budget. Ces champs-là sont posés ici pour que la maquette ait
 * des filtres et un circuit de validation à montrer. Ils sont plausibles, pas
 * authentiques — à ne pas présenter comme des données du client.
 */

import { CODES, LIBELLES } from "./gescof";
import { total } from "./realise";
import type { Statut } from "./constants";

export interface Chantier {
  id: string;
  entite: string;
  /** Libellé d'affichage, mis en forme depuis celui de Gescof. */
  nom: string;
  /** Libellé brut de l'export, numéro de contrat compris. */
  libelle: string;
  ville: string;
  client: string;
  agence: string;
  secteur: "Propreté" | "Sécurité";
  /** CA réalisé 2025, qui sert de repère de taille au chantier. */
  ca: number;
  /** Prix horaire vendu 2025 — CA / heures. */
  taux: number;
  /** Part des salaires dans le CA 2025. */
  msRate: number;
  statut: Statut;
  /** Chantier majeur du portefeuille : plus de 4 M€ de CA annuel. */
  big: boolean;
}

/** PRNG déterministe (mulberry32) — sert encore aux valeurs de démonstration. */
export function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a — dérive une graine stable depuis une clé chantier/poste/mois. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Au-delà de ce CA annuel, un chantier pèse assez pour être suivi nommément. */
const SEUIL_GROS = 4000000;

interface Fiche {
  nom: string;
  client: string;
  ville: string;
  agence: string;
  secteur: "Propreté" | "Sécurité";
  entite: string;
  rex: string;
  statut: Statut;
  /** Saisie volontairement en retard, pour faire apparaître les alertes. */
  retard?: boolean;
}

/**
 * Rattachement et état de chaque chantier.
 *
 * Les statuts couvrent tout le circuit — deux budgets attendent encore leur
 * baseline, un n'est pas commencé, trois sont en cours de saisie, deux partis en
 * validation, deux validés — pour que chaque écran ait quelque chose à montrer.
 */
const FICHES: Record<string, Fiche> = {
  "C00509-001": {
    nom: "SNCF — EPT4",
    client: "SNCF",
    ville: "Paris",
    agence: "Saint-Ouen",
    secteur: "Propreté",
    entite: "EGC",
    rex: "A. Bernard",
    statut: "En saisie",
    retard: true,
  },
  "C00253-025": {
    nom: "AP-HP — Georges Pompidou",
    client: "AP-HP",
    ville: "Paris 15e",
    agence: "Paris Sud",
    secteur: "Propreté",
    entite: "EGC",
    rex: "M. Legrand",
    statut: "À valider",
  },
  "C00078-031": {
    nom: "Disneyland Paris — Ranch hôtelier",
    client: "Disneyland Paris",
    ville: "Bailly-Romainvilliers",
    agence: "Marne-la-Vallée",
    secteur: "Propreté",
    entite: "EGC",
    rex: "S. Faure",
    statut: "Validé",
  },
  "C00509-012": {
    nom: "SNCF — Ligne J",
    client: "SNCF",
    ville: "Paris",
    agence: "Saint-Ouen",
    secteur: "Propreté",
    entite: "EGC",
    rex: "A. Bernard",
    statut: "En attente baseline CG",
  },
  "C01436-001": {
    nom: "Aéroport de Paris — Orly",
    client: "Groupe ADP",
    ville: "Orly",
    agence: "Orly",
    secteur: "Sécurité",
    entite: "PRS",
    rex: "M. Legrand",
    statut: "En saisie",
  },
  "C00253-031": {
    nom: "AP-HP — Necker",
    client: "AP-HP",
    ville: "Paris 15e",
    agence: "Paris Sud",
    secteur: "Propreté",
    entite: "EGC",
    rex: "M. Legrand",
    statut: "En attente baseline CG",
  },
  "C00078-001": {
    nom: "Disneyland Paris — parcs",
    client: "Disneyland Paris",
    ville: "Chessy",
    agence: "Marne-la-Vallée",
    secteur: "Propreté",
    entite: "EGC",
    rex: "S. Faure",
    statut: "Non budgétisé",
  },
  "C00242-001": {
    nom: "SNCF — Transilien D & R",
    client: "SNCF",
    ville: "Paris",
    agence: "Saint-Ouen",
    secteur: "Propreté",
    entite: "EGC",
    rex: "A. Bernard",
    statut: "Validé",
  },
  "C00509-010": {
    nom: "SNCF — TSEE TMV",
    client: "SNCF",
    ville: "Paris",
    agence: "Saint-Ouen",
    secteur: "Propreté",
    entite: "EGC",
    rex: "A. Bernard",
    statut: "En saisie",
    retard: true,
  },
  "C01865-008": {
    nom: "SNCF — EOLE incendie",
    client: "SNCF",
    ville: "Paris",
    agence: "Saint-Ouen",
    secteur: "Sécurité",
    entite: "PRS",
    rex: "A. Bernard",
    statut: "À valider",
  },
};

/** Exercice de référence pour la taille et les ratios d'un chantier. */
const REF = 2025;

export const CHANTIERS: Chantier[] = [];
/** Responsable exploitation par code chantier. */
export const REX: Record<string, string> = {};
/** Chantiers « en saisie » volontairement en retard, pour faire apparaître les alertes. */
export const LATE: string[] = [];

CODES.forEach((id) => {
  const f = FICHES[id];
  const ca = total(id, REF, "ca");
  const heures = total(id, REF, "heures");
  const salaires = total(id, REF, "salaires");
  CHANTIERS.push({
    id,
    entite: f.entite,
    nom: f.nom,
    libelle: LIBELLES[id],
    ville: f.ville,
    client: f.client,
    agence: f.agence,
    secteur: f.secteur,
    ca,
    taux: heures ? ca / heures : 0,
    msRate: ca ? salaires / ca : 0,
    statut: f.statut,
    big: ca >= SEUIL_GROS,
  });
  REX[id] = f.rex;
  if (f.retard) LATE.push(id);
});
