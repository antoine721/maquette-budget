/**
 * Lecture du réalisé Gescof.
 *
 * L'export (`gescof.ts`) donne un compte de résultat mensuel par chantier :
 * chiffre d'affaires en six lignes, charges directes détaillées, marges et prix
 * horaires. L'application, elle, ne budgète que quatre catégories de CA, des
 * heures et un taux horaire. Ce module fait la jonction — et lui seul : le reste
 * du code ne connaît que `realise()`, `budget()` et `anneeReference()`.
 */

import { COUVERTURE, EXERCICES, GESCOF, type LigneGescof } from "./gescof";
import type { CatKey } from "./constants";

/** Postes que l'application sait lire sur un exercice réalisé. */
export type PosteReel = CatKey | "ca" | "heures" | "taux" | "masse";

const CATS: CatKey[] = ["forfait", "reel", "pad", "te"];

/** Vrai si l'export couvre cet exercice. */
export function estReel(annee: number): boolean {
  return (EXERCICES as readonly number[]).includes(annee);
}

/** Vrai si le chantier figure dans l'export — tous y figurent, mais le code reste défensif. */
function estConnu(code: string, annee: number): boolean {
  return estReel(annee) && !!GESCOF[annee]?.[code];
}

function val(code: string, annee: number, k: LigneGescof, m: number): number | null {
  const l = GESCOF[annee]?.[code]?.[k];
  return l ? (l[m] ?? null) : null;
}

/** Somme annuelle d'une ligne, les mois non couverts comptant pour zéro. */
export function total(code: string, annee: number, k: LigneGescof): number {
  const l = GESCOF[annee]?.[code]?.[k];
  return l ? l.reduce((a: number, x) => a + (x ?? 0), 0) : 0;
}

const mixCache: Record<string, Record<CatKey, number>> = {};

/**
 * Répartition annuelle des quatre catégories budgétées, par chantier.
 *
 * Elle sert à ventiler un montant qui n'est donné qu'en total : le budget CA,
 * et les mois où les quatre lignes sont à zéro alors que le CA ne l'est pas.
 * Un chantier sans aucune des quatre catégories est traité comme du forfait —
 * c'est ce qu'il est en pratique.
 */
function mix(code: string, annee: number): Record<CatKey, number> {
  const cle = code + ":" + annee;
  if (mixCache[cle]) return mixCache[cle];
  const bruts = CATS.map((k) => total(code, annee, k));
  const somme = bruts.reduce((a, x) => a + x, 0);
  const out = {} as Record<CatKey, number>;
  CATS.forEach((k, i) => (out[k] = somme ? bruts[i] / somme : k === "forfait" ? 1 : 0));
  return (mixCache[cle] = out);
}

/**
 * CA d'une catégorie sur un mois, recalé sur le CA réellement facturé.
 *
 * Les six lignes de CA de l'export ne se résument pas aux quatre catégories
 * budgétées : s'y ajoutent les pénalités et les écritures de clôture (FAE et
 * AAE), qui basculent d'un mois sur l'autre des montants considérables — sur
 * SNCF EPT4, janvier porte 912 k€ d'écritures et février les reprend. Prises
 * telles quelles, les catégories donneraient un janvier à zéro et un février au
 * double. On garde donc le mix du mois et on le met à l'échelle du CA total :
 * chaque mois vaut exactement ce qui a été facturé, réparti comme il l'a été.
 */
function categorie(code: string, annee: number, k: CatKey, m: number): number | null {
  const ca = val(code, annee, "ca", m);
  if (ca === null) return null;
  const somme = CATS.reduce((a, c) => a + (val(code, annee, c, m) ?? 0), 0);
  if (Math.abs(somme) < 1) return ca * mix(code, annee)[k];
  return ((val(code, annee, k, m) ?? 0) * ca) / somme;
}

/** Taux horaire chargé moyen de l'exercice — le recours quand un mois manque. */
function tauxMoyen(code: string, annee: number): number | null {
  const h = total(code, annee, "heures");
  return h ? total(code, annee, "salaires") / h : null;
}

/** Prix horaire vendu moyen de l'exercice (CA / heures). */
function phvMoyen(code: string, annee: number): number | null {
  const h = total(code, annee, "heures");
  return h ? total(code, annee, "ca") / h : null;
}

/**
 * Un mois n'est exploitable que si la paie y est remontée.
 *
 * En 2026 la facturation d'août est connue mais pas les heures ni les salaires
 * qui vont avec. Un mois à qui il manque une des six valeurs du budget n'entre
 * dans aucun calcul de l'application : le laisser passer sur son seul CA
 * gonflerait les totaux d'un côté sans les charges de l'autre. Le compte de
 * résultat détaillé, lui, continue de l'afficher — il lit les lignes brutes.
 */
function moisExploitable(annee: number, m: number): boolean {
  return m < (COUVERTURE[annee]?.paie ?? 0);
}

/** Valeur réalisée d'un poste, ou `null` si l'export ne couvre pas ce mois. */
export function realise(code: string, annee: number, poste: PosteReel, m: number): number | null {
  if (!estConnu(code, annee) || !moisExploitable(annee, m)) return null;
  if (poste === "ca") return val(code, annee, "ca", m);
  if (poste === "heures") return val(code, annee, "heures", m);
  if (poste === "masse") return val(code, annee, "salaires", m);
  if (poste === "taux") {
    const h = val(code, annee, "heures", m);
    const s = val(code, annee, "salaires", m);
    if (h === null || s === null) return null;
    return h ? s / h : tauxMoyen(code, annee);
  }
  return categorie(code, annee, poste, m);
}

/**
 * Objectif posé par le contrôle de gestion sur un exercice révolu.
 *
 * L'export porte deux lignes de budget : « Budget CA » et « Budget heures ».
 * La première est un total, ventilé ici sur les quatre catégories au mix du
 * chantier. La seconde n'est pas servie partout — à défaut, les heures
 * budgétées se déduisent du budget CA au prix horaire vendu de l'exercice.
 * Aucune ligne ne budgète la masse salariale : le taux horaire de la baseline
 * est celui constaté sur l'exercice.
 */
export function budget(code: string, annee: number, poste: PosteReel, m: number): number | null {
  if (!estConnu(code, annee) || !moisExploitable(annee, m)) return null;
  const bca = val(code, annee, "budgetCa", m);
  if (poste === "ca") return bca;
  if (poste === "taux") return tauxMoyen(code, annee);
  if (poste === "heures" || poste === "masse") {
    const heures = heuresBudgetees(code, annee, m, bca);
    if (heures === null) return null;
    if (poste === "heures") return heures;
    const t = tauxMoyen(code, annee);
    return t === null ? null : heures * t;
  }
  return bca === null ? null : bca * mix(code, annee)[poste];
}

/** Heures budgétées : la ligne de l'export si elle est servie, sinon le budget CA au prix vendu. */
function heuresBudgetees(
  code: string,
  annee: number,
  m: number,
  budgetCa: number | null,
): number | null {
  const bh = val(code, annee, "budgetHeures", m);
  if (bh) return bh;
  const phv = phvMoyen(code, annee);
  return budgetCa === null || !phv ? null : budgetCa / phv;
}

/**
 * Exercice réalisé qui sert de référence à un mois donné du budget `annee`.
 *
 * On prend le plus récent exercice dont la paie est remontée sur ce mois-là.
 * Pour le budget 2027 construit en septembre 2026, cela donne 2026 de janvier à
 * juillet, puis 2025 d'août à décembre — les mois que la paie 2026 n'a pas
 * encore atteints. C'est la bascule que le tableau signale en violet.
 */
export function anneeReference(annee: number, m: number): number | null {
  for (let a = annee - 1; a >= EXERCICES[0]; a--) {
    if (estReel(a) && m < COUVERTURE[a].paie) return a;
  }
  return null;
}

/**
 * Vrai quand la référence d'un mois redescend au-delà de N-1.
 *
 * C'est ce que le tableau signale en violet : la valeur proposée ne vient pas de
 * l'exercice précédent mais de celui d'avant, faute de paie remontée.
 */
export function refDegradee(annee: number, m: number): boolean {
  const ref = anneeReference(annee, m);
  return ref !== null && ref < annee - 1;
}

/** Nombre de mois entièrement remontés sur un exercice — 0 s'il n'est pas couvert. */
export function moisRemontes(annee: number): number {
  return COUVERTURE[annee]?.paie ?? 0;
}
