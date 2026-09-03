/**
 * Référentiels statiques de l'application.
 *
 * Les listes de rattachement — agences, villes, entités, responsables — décrivent
 * le portefeuille réel de `chantiers.ts` : ce sont ses valeurs distinctes, pas un
 * catalogue générique. Les faire évoluer ensemble.
 */

import { STATUS_COLORS } from "../theme";

export const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

export const SHORT = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
] as const;

/**
 * Agences de rattachement. Elles ouvrent et ferment les mois à la saisie, d'où
 * leur présence dans `state.periods`.
 */
export const AGENCES = ["Saint-Ouen", "Paris Sud", "Marne-la-Vallée", "Orly"];

export const ENTITIES = [
  { code: "EGC", name: "Entreprise Générale de Confiance" },
  { code: "PRS", name: "Prévention & Sécurité" },
];

export type CatKey = "forfait" | "reel" | "pad" | "te";

/** Les quatre catégories de CA que l'exploitation budgète, lignes 1, 2, 5 et 6 de Gescof. */
export const CAT: { k: CatKey; label: string; title: string }[] = [
  { k: "forfait", label: "Forfait", title: "CA contractuel forfaitaire" },
  { k: "reel", label: "Réel", title: "CA facturé au réel" },
  { k: "pad", label: "PAD", title: "PAD — Prestations à la Demande" },
  { k: "te", label: "TE", title: "TE — Travaux Exceptionnels" },
];

export const CAT_COLORS: Record<CatKey, string> = {
  forfait: "#0a9bd8",
  reel: "#1b4f9c",
  pad: "#8b5cf6",
  te: "#f59e0b",
};

export type Statut =
  | "En attente baseline CG"
  | "En saisie"
  | "À valider"
  | "Validé"
  | "Clôturé"
  | "Non budgétisé";

export interface StatutStyle {
  bg: string;
  fg: string;
  border: string;
  cell: string;
  accent: string;
}

/**
 * Couleurs des statuts.
 *
 * `accent` est la couleur de l'étape, la même sur tous les écrans : elle sert de
 * pastille, de case de filtre, de segment d'anneau et de liseré de ligne. Le fond
 * du badge, lui, reste neutre — c'est le mot qui nomme l'étape, la couleur qui la
 * repère. Teinter en plus le fond des badges et des cellules noyait le tableau.
 */
export const ST: Record<Statut, StatutStyle> = {
  "En attente baseline CG": { bg: "#f4f6f8", fg: "#3b4753", border: "#e6eaee", cell: "#fff", accent: STATUS_COLORS.attente },
  "Non budgétisé": { bg: "#f4f6f8", fg: "#3b4753", border: "#e6eaee", cell: "#fff", accent: STATUS_COLORS.nonBudgete },
  "En saisie": { bg: "#f4f6f8", fg: "#3b4753", border: "#e6eaee", cell: "#fff", accent: STATUS_COLORS.saisie },
  "À valider": { bg: "#f4f6f8", fg: "#3b4753", border: "#e6eaee", cell: "#fff", accent: STATUS_COLORS.aValider },
  Validé: { bg: "#f4f6f8", fg: "#3b4753", border: "#e6eaee", cell: "#fbfdfe", accent: STATUS_COLORS.valide },
  Clôturé: { bg: "#f4f6f8", fg: "#3b4753", border: "#e6eaee", cell: "#f8fafb", accent: STATUS_COLORS.clos },
};

export type MetricKey = "ca" | "heures" | "taux" | "masse" | "msRatio" | "phv" | "marge";
export type MetricKind = "money" | "h" | "pct" | "eur2";

export interface Metric {
  key: MetricKey;
  label: string;
  kind: MetricKind;
  better: "high" | "low";
  agg: "sum" | "ratio";
  formula: string;
}

export const METRICS: Metric[] = [
  { key: "ca", label: "CA", kind: "money", better: "high", agg: "sum", formula: "CA = Forfait + Réel + PAD + TE" },
  { key: "heures", label: "Heures", kind: "h", better: "high", agg: "sum", formula: "Heures saisies par l'exploitation" },
  { key: "taux", label: "Taux horaire", kind: "eur2", better: "low", agg: "ratio", formula: "Taux horaire chargé saisi par l'exploitation" },
  { key: "masse", label: "Masse salariale", kind: "money", better: "low", agg: "sum", formula: "MS = nombre d'heures × taux horaire" },
  { key: "msRatio", label: "% MS / CA", kind: "pct", better: "low", agg: "ratio", formula: "% MS = MS / CA × 100" },
  { key: "phv", label: "€/h vendu", kind: "eur2", better: "high", agg: "ratio", formula: "Prix horaire vendu = CA / nombre d'heures" },
  { key: "marge", label: "% marge après MS", kind: "pct", better: "high", agg: "ratio", formula: "% marge = (CA − MS) / CA × 100" },
];

export const REX_NAMES = ["A. Bernard", "M. Legrand", "S. Faure"];

/** REX connecté lorsque le rôle affiché est « Exploitation ». */
export const CURRENT_REX = "A. Bernard";

export const VILLES = ["Paris", "Paris 15e", "Orly", "Chessy", "Bailly-Romainvilliers"];

export const PERIODES = [
  "Année complète",
  "S1 (jan-juin)",
  "S2 (juil-déc)",
  "T1",
  "T2",
  "T3",
  "T4",
];

export const PER_MONTHS: Record<string, number[]> = {
  "Année complète": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  "S1 (jan-juin)": [0, 1, 2, 3, 4, 5],
  "S2 (juil-déc)": [6, 7, 8, 9, 10, 11],
  T1: [0, 1, 2],
  T2: [3, 4, 5],
  T3: [6, 7, 8],
  T4: [9, 10, 11],
};

export const FULL_YEAR = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** Postes saisis par l'exploitation : le CA par catégorie, les heures et le taux horaire. */
export const SAISIE_FIELDS = CAT.map((c) => c.k as string).concat(["heures", "taux"]);

/**
 * Le violet signale une valeur adossée à N-2 plutôt qu'à N-1.
 *
 * La campagne se déroule en septembre N-1 : à cette date la paie de l'exercice
 * en cours n'est remontée que jusqu'en juillet, et la référence des mois
 * suivants redescend d'un cran. La coupure n'est pas une convention, elle se lit
 * dans l'export — voir `refDegradee`.
 */
export const N2_TINT = "#faf8ff";
export const N2_BORDER = "#ddd6fe";
export const N2_FG = "#6d28d9";

export const SORTS = [
  "Priorité à déclarer",
  "Code chantier",
  "Nom du site",
  "Ville",
  "Statut",
  "Montant décroissant",
  "Montant croissant",
  "Écart vs baseline",
  "Remplissage croissant",
];

/**
 * Cycle de vie d'un budget, dans l'ordre.
 *
 * `En attente baseline CG` → le contrôle de gestion n'a pas encore publié la baseline.
 * `Non budgétisé` → baseline publiée, aucun mois saisi.
 * `En saisie` → saisie commencée, incomplète ou pas encore envoyée.
 * `À valider` → envoyé ; côté exploitation, l'écran dit « En attente de validation ».
 * `Validé` → cristallisation validée par le contrôle de gestion. Un budget n'est
 *   jamais refusé : tant qu'il n'est pas validé, il reste en attente.
 * `Clôturé` → posé automatiquement quand l'exercice n'est plus d'actualité,
 *   c'est-à-dire au passage à l'année suivante.
 */
export const STATUT_OPTS: Statut[] = [
  "En attente baseline CG",
  "Non budgétisé",
  "En saisie",
  "À valider",
  "Validé",
  "Clôturé",
];

/** 2025 et 2026 sont couverts par l'export Gescof ; 2027 est la campagne à saisir. */
export const YEARS = [2025, 2026, 2027];

export type Role = "Exploitation" | "Contrôle de gestion";
export type Tab = "Accueil" | "Tableau prévisionnel" | "Pilotage CDG";
