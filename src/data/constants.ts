/**
 * Référentiels statiques de l'application — repris à l'identique du prototype.
 */

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

/** Saisonnalité mensuelle appliquée au réalisé N-1. */
export const SEASON = [1.0, 0.97, 1.05, 1.0, 1.02, 1.06, 0.82, 0.74, 1.08, 1.06, 1.0, 0.9];

export const AGENCES = ["Saint Ouen", "Lyon Est", "Marseille", "Lille"];

export const ENTITIES = [
  { code: "EGC", name: "Entreprise Générale de Confiance" },
  { code: "CPS", name: "Challancin Prévention & Sécurité" },
  { code: "CAS", name: "Challancin Assistance & Services" },
];

export type CatKey = "forfait" | "reel" | "pad" | "te";

export const CAT: { k: CatKey; label: string; share: number; title: string }[] = [
  { k: "forfait", label: "Forfait", share: 0.62, title: "CA contractuel forfaitaire" },
  { k: "reel", label: "Réel", share: 0.22, title: "CA facturé au réel" },
  { k: "pad", label: "PAD", share: 0.1, title: "PAD — Prestations à la Demande" },
  { k: "te", label: "TE", share: 0.06, title: "TE — Travaux Exceptionnels" },
];

export const CAT_COLORS: Record<CatKey, string> = {
  forfait: "#0a9bd8",
  reel: "#1b4f9c",
  pad: "#8b5cf6",
  te: "#f59e0b",
};

export type Statut =
  | "Baseline CG"
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

export const ST: Record<Statut, StatutStyle> = {
  "Baseline CG": { bg: "#f1f5f9", fg: "#475569", border: "#e2e8f0", cell: "#f8fafc", accent: "#94a3b8" },
  "En saisie": { bg: "#fef3c7", fg: "#92400e", border: "#fde68a", cell: "#fffdf3", accent: "#f59e0b" },
  "À valider": { bg: "#e0f2fe", fg: "#075985", border: "#bae6fd", cell: "#f5fbff", accent: "#0a9bd8" },
  Validé: { bg: "#dcfce7", fg: "#166534", border: "#bbf7d0", cell: "#f4fdf7", accent: "#16a34a" },
  Clôturé: { bg: "#e2e8f0", fg: "#334155", border: "#cbd5e1", cell: "#f6f8fa", accent: "#64748b" },
  "Non budgétisé": { bg: "#fee2e2", fg: "#991b1b", border: "#fecaca", cell: "#fffafa", accent: "#dc2626" },
};

export type MetricKey = "ca" | "heures" | "masse" | "msRatio" | "phv" | "marge";
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
  { key: "masse", label: "Masse salariale", kind: "money", better: "low", agg: "sum", formula: "MS saisie par l'exploitation" },
  { key: "msRatio", label: "% MS / CA", kind: "pct", better: "low", agg: "ratio", formula: "% MS = MS / CA × 100" },
  { key: "phv", label: "€/h vendu", kind: "eur2", better: "high", agg: "ratio", formula: "Prix horaire vendu = CA / nombre d'heures" },
  { key: "marge", label: "% marge après MS", kind: "pct", better: "high", agg: "ratio", formula: "% marge = (CA − MS) / CA × 100" },
];

export const REX_NAMES = [
  "A. Bernard",
  "M. Legrand",
  "S. Faure",
  "K. Morel",
  "P. Dufour",
  "L. Mercier",
  "N. Roussel",
  "T. Girard",
  "C. Blanchard",
  "J. Perrot",
  "H. Vasseur",
  "E. Caron",
];

/** REX connecté lorsque le rôle affiché est « Exploitation ». */
export const CURRENT_REX = "A. Bernard";

export const VILLES = [
  "Courbevoie",
  "Puteaux",
  "Saint-Ouen",
  "Lyon",
  "Marseille",
  "Marignane",
  "Lille",
  "Lesquin",
  "Nanterre",
  "Villeurbanne",
  "Aubagne",
  "Roubaix",
  "Créteil",
  "Vénissieux",
  "Aix-en-Provence",
  "Tourcoing",
];

export const TAGS = ["Sensible", "Renégociation", "Perte de marge", "Nouveau marché"];

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

export const STATUT_OPTS: Statut[] = [
  "Non budgétisé",
  "Baseline CG",
  "En saisie",
  "À valider",
  "Validé",
  "Clôturé",
];

export const YEARS = [2024, 2025, 2026, 2027];

export type Role = "Exploitation" | "Contrôle de gestion" | "Admin";
export type Tab = "Accueil" | "Tableau prévisionnel" | "Pilotage CDG";
