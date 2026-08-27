import type { MetricKey, Role, Statut, Tab } from "../data/constants";

/** Clé de saisie : `code|poste|exercice|mois`. */
export type EditMap = Record<string, number | null>;

export type EditStore = "edits" | "baseEdits";

/**
 * Portée d'un coefficient de baseline.
 *
 * - `commun` : une seule valeur mensuelle, appliquée à tout le portefeuille.
 * - `particulier` : rattaché à tous les chantiers mais neutre (0 %, soit × 1) tant
 *   qu'il n'est pas renseigné chantier par chantier. Sert aux exigences de
 *   performance propres à un client.
 */
export type RefScope = "commun" | "particulier";

export interface RefIndicator {
  id: string;
  label: string;
  role: string;
  dot: string;
  scope: RefScope;
  values: number[];
}

export interface HistoryEntry {
  label: string;
  /** Libellé court cumulé sous la ligne retouchée (« +15 % appliqué »). */
  short: string;
  count: number;
  cible: string;
  store: EditStore;
  fields: string[];
  prev: EditMap;
}

/**
 * Fenêtre de gestion définie par le contrôle de gestion (rebudgétisation, fermeture,
 * modification). Informative par défaut : elle ne bloque que si `blocking` est posé,
 * auquel cas la raison est affichée sur la page d'accueil.
 */
export interface PeriodRule {
  id: string;
  label: string;
  window: string;
  active: boolean;
  blocking: boolean;
  reason: string;
}

export type PilotTab = "Vue d'ensemble" | "Chantiers" | "Responsables" | "Réglages";

export interface AppState {
  year: number;
  role: Role;
  tab: Tab;
  metric: MetricKey;
  cat: string;

  refs: RefIndicator[];

  fSort: string;
  fSecteur: string;
  fVille: string;
  fAgence: string;
  fClient: string;
  /** Statuts cochés dans le tableau ; vide = aucun affiché. */
  fStatuts: Statut[];
  fSearch: string;
  searchDraft: string;
  fPeriode: string;
  fEntity: string;
  fRex: string;
  onlyTodo: boolean;
  /** N'afficher que les chantiers signalés par un drapeau. */
  onlyFlagged: boolean;

  openRow: string | null;
  openCa: Record<string, boolean>;
  openMenu: string | null;
  menuStep: string | null;
  menuValue: string;

  edits: EditMap;
  baseEdits: EditMap;
  statutOverride: Record<string, Statut>;
  history: HistoryEntry[];
  /** Chantiers signalés : difficiles à repérer dans les analytiques mais à problème. */
  flags: Record<string, boolean>;
  /**
   * Valeurs des coefficients particuliers, par `coefficient|chantier|mois`.
   * Absent = 0 %, donc neutre.
   */
  refValues: Record<string, number>;
  /** Nombre de cristallisations déjà validées par le contrôle de gestion, par chantier. */
  cristal: Record<string, number>;
  periods: Record<string, boolean[]>;
  periodRules: PeriodRule[];
  /** Onglet interne du pilotage contrôle de gestion. */
  pilotTab: PilotTab;

  pageSize: number;
  hoverSeg: string | null;
  toast: string;
}

/** Valeurs primaires d'un couple chantier/mois. La masse salariale est dérivée. */
export interface Prims {
  cats: Record<string, number>;
  ca: number;
  heures: number;
  /** Taux horaire chargé. */
  taux: number;
  /** Masse salariale = heures × taux. */
  masse: number;
}

export interface Todo {
  tag: string;
  crit: boolean;
  hint: string;
}
