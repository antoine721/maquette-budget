import type { MetricKey, Role, Statut, Tab } from "../data/constants";

/** Clé de saisie : `code|poste|exercice|mois`. */
export type EditMap = Record<string, number | null>;

export type EditStore = "edits" | "baseEdits";

export interface RefIndicator {
  id: string;
  label: string;
  role: string;
  dot: string;
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
  fStatut: string;
  fSearch: string;
  searchDraft: string;
  fPeriode: string;
  fEntity: string;
  fTag: string;
  fRex: string;
  onlyTodo: boolean;

  openRow: string | null;
  openCa: Record<string, boolean>;
  openMenu: string | null;
  menuStep: string | null;
  menuValue: string;

  edits: EditMap;
  baseEdits: EditMap;
  statutOverride: Record<string, Statut>;
  history: HistoryEntry[];
  tags: Record<string, string[]>;
  periods: Record<string, boolean[]>;

  pageSize: number;
  hoverSeg: string | null;
  /** Rappel de campagne affiché à l'ouverture tant qu'il n'a pas été écarté. */
  campaignModal: boolean;
  toast: string;
}

/** Valeurs primaires d'un couple chantier/mois. */
export interface Prims {
  cats: Record<string, number>;
  ca: number;
  heures: number;
  masse: number;
}

export interface Todo {
  tag: string;
  crit: boolean;
  hint: string;
}
