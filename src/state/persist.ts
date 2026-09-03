/**
 * Ce que l'application retient d'une visite à l'autre, et ce qu'elle met dans l'URL.
 *
 * Une saisie de budget se fait en plusieurs fois : perdre l'écran sur un F5, ou ne
 * pas pouvoir envoyer à un collègue le lien du chantier qu'on regarde, sont deux
 * façons de perdre du travail. La saisie va dans le stockage local du navigateur,
 * la position — onglet, exercice, chantier ouvert — dans l'adresse.
 */

import type { AppState } from "../lib/types";
import type { Tab } from "../data/constants";

const KEY = "tableau-previsionnel:v2";

/** Ce qui est du travail de l'utilisateur, donc à conserver. */
const SAVED = [
  "edits",
  "baseEdits",
  "statutOverride",
  "flags",
  "refValues",
  "cristal",
  "refs",
  "history",
  "periodRules",
  "periods",
] as const;

type Saved = Pick<AppState, (typeof SAVED)[number]>;

export function loadSaved(): Partial<AppState> {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Saved>;
    const out: Partial<AppState> = {};
    SAVED.forEach((k) => {
      if (parsed[k] !== undefined) (out as Record<string, unknown>)[k] = parsed[k];
    });
    return out;
  } catch {
    // Navigation privée, quota plein, données d'une version précédente : on repart neuf.
    return {};
  }
}

export function saveState(s: AppState): void {
  try {
    const out: Record<string, unknown> = {};
    SAVED.forEach((k) => (out[k] = s[k]));
    window.localStorage.setItem(KEY, JSON.stringify(out));
  } catch {
    // Le stockage peut être refusé : la maquette continue sans mémoire.
  }
}

export function clearSaved(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* rien à faire */
  }
}

// ------------------------------------------------------------------------ URL

const SLUGS: Record<string, Tab> = {
  accueil: "Accueil",
  tableau: "Tableau prévisionnel",
  pilotage: "Pilotage CDG",
};

const TAB_SLUG: Record<Tab, string> = {
  Accueil: "accueil",
  "Tableau prévisionnel": "tableau",
  "Pilotage CDG": "pilotage",
};

export interface Position {
  tab?: Tab;
  year?: number;
  openRow?: string | null;
}

/** Lit la position dans le hash — `#/tableau?exercice=2027&chantier=C00109-001`. */
export function readPosition(): Position {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash) return {};
  const [path, query] = hash.split("?");
  const params = new URLSearchParams(query || "");
  const year = Number(params.get("exercice"));
  return {
    tab: SLUGS[path],
    year: Number.isFinite(year) && year > 0 ? year : undefined,
    openRow: params.get("chantier"),
  };
}

/**
 * Écrit la position dans le hash. Changer d'écran empile une étape — c'est ce que
 * le bouton Précédent doit défaire ; ouvrir un chantier ou changer d'exercice
 * remplace l'étape courante, sinon l'historique se remplit de bruit.
 */
export function writePosition(s: AppState): void {
  const params = new URLSearchParams({ exercice: String(s.year) });
  if (s.openRow) params.set("chantier", s.openRow);
  const next = "#/" + TAB_SLUG[s.tab] + "?" + params.toString();
  if (window.location.hash === next) return;
  const tabChanged = !window.location.hash.startsWith("#/" + TAB_SLUG[s.tab]);
  if (tabChanged) window.history.pushState(null, "", next);
  else window.history.replaceState(null, "", next);
}
