import {
  CAT,
  CURRENT_REX,
  FULL_YEAR,
  METRICS,
  MONTHS,
  PER_MONTHS,
  SAISIE_FIELDS,
  SEASON,
  SHORT,
  type CatKey,
  type MetricKey,
  type MetricKind,
  type Statut,
} from "../data/constants";
import { CHANTIERS, LATE, REX, hash, rng, type Chantier } from "../data/chantiers";
import type { AppState, EditStore, Prims, RefIndicator, Todo } from "./types";

export type CalcMode = "base" | "saisi";

/**
 * Moteur de calcul du budget prévisionnel.
 *
 * Une instance est construite à chaque rendu ; le cache mémoïsé lui est fourni de
 * l'extérieur et n'est vidé que lorsque la signature de l'état change, de sorte
 * qu'un simple survol ne recalcule pas les 350 chantiers × 12 mois × 4 catégories.
 */
export class Engine {
  constructor(
    readonly s: AppState,
    private readonly cache: Record<string, unknown> = {},
  ) {}

  private memo<T>(key: string, fn: () => T): T {
    if (!(key in this.cache)) this.cache[key] = fn();
    return this.cache[key] as T;
  }

  /** Moteur équivalent positionné sur un autre exercice (reprise des valeurs N-1, N-2…). */
  forYear(year: number): Engine {
    return new Engine({ ...this.s, year }, {});
  }

  /** Comme `forYear`, mais conservé dans le cache : à préférer pendant un rendu. */
  atYear(year: number): Engine {
    if (year === this.s.year) return this;
    return this.memo("atYear:" + year, () => this.forYear(year));
  }

  // ---------------------------------------------------------------- référentiel

  get metric() {
    return METRICS.find((m) => m.key === this.s.metric)!;
  }

  get isCG() {
    return this.s.role === "Contrôle de gestion";
  }

  get isExploit() {
    return this.s.role === "Exploitation";
  }

  get months(): number[] {
    return PER_MONTHS[this.s.fPeriode];
  }

  /** Un exercice antérieur à la campagne en cours est clos, donc en lecture seule. */
  closed(): boolean {
    return this.s.year <= 2026;
  }

  st(ch: Chantier): Statut {
    if (this.closed()) return "Clôturé";
    return this.s.statutOverride[ch.id] || ch.statut;
  }

  /** Valeur d'un coefficient sur un chantier : commune, ou propre au chantier si particulier. */
  refValue(ref: RefIndicator, ch: Chantier, m: number): number {
    if (ref.scope === "commun") return Number(ref.values[m]) || 0;
    return Number(this.s.refValues[ref.id + "|" + ch.id + "|" + m]) || 0;
  }

  /** Produit des coefficients de baseline appliqués à ce chantier ce mois-là. */
  coef(ch: Chantier, m: number): number {
    return this.s.refs.reduce((a, r) => a * (1 + this.refValue(r, ch, m) / 100), 1);
  }

  ek(ch: Chantier, field: string, m: number): string {
    return ch.id + "|" + field + "|" + this.s.year + "|" + m;
  }

  // -------------------------------------------------------------------- formats

  fmt(v: number | null | undefined, kind: MetricKind = "money"): string {
    if (v === null || v === undefined || isNaN(v)) return "—";
    if (kind === "pct") return v.toFixed(1).replace(".", ",") + " %";
    if (kind === "eur2") return v.toFixed(2).replace(".", ",") + " €";
    if (kind === "h") return Math.round(v).toLocaleString("fr-FR") + " h";
    if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(1).replace(".", ",") + " M€";
    if (Math.abs(v) >= 1000) return Math.round(v / 1000).toLocaleString("fr-FR") + " k€";
    return Math.round(v).toLocaleString("fr-FR") + " €";
  }

  /** Vert au-dessus de l'objectif, ambre à moins de 3 %, rouge en dessous. */
  markerColor(
    v: number | null | undefined,
    b: number | null | undefined,
    better: "high" | "low",
  ): string {
    if (v === null || v === undefined || b === null || b === undefined || !b) return "#94a3b8";
    let d = (v - b) / Math.abs(b);
    if (better === "low") d = -d;
    if (d >= 0) return "#15803d";
    if (d > -0.03) return "#b45309";
    return "#dc2626";
  }

  // ------------------------------------------------------------- valeurs de base

  /** Réalisé N-1 reconstitué (source Gescof dans la vraie vie). */
  n1(ch: Chantier, m: number, field: string, year: number): number {
    return this.memo("n1:" + ch.id + ":" + m + ":" + field + ":" + year, () =>
      this.n1Raw(ch, m, field, year),
    );
  }

  private n1Raw(ch: Chantier, m: number, field: string, year: number): number {
    const r = rng(hash(ch.id + field + year + m));
    const yf = 1 + (year - 2026) * 0.03;
    const monthCA = (ch.ca / 12) * SEASON[m] * yf * (0.96 + r() * 0.08);
    const c = CAT.find((x) => x.k === field);
    if (c) return monthCA * c.share * (0.9 + r() * 0.2);
    if (field === "heures") return monthCA / ch.taux;
    // Taux horaire chargé : la masse salariale en découle (heures × taux).
    if (field === "taux") return ch.msRate * ch.taux * (0.99 + r() * 0.02);
    if (field === "masse") return monthCA * ch.msRate;
    return monthCA;
  }

  /** Baseline contrôle de gestion : réalisé N-1 × coefficients, ou valeur saisie par le CG. */
  baseField(ch: Chantier, m: number, field: string): number {
    const e = this.s.baseEdits[this.ek(ch, field, m)];
    if (e !== undefined && e !== null) return e;
    const raw = this.n1(ch, m, field, this.s.year);
    // Les coefficients portent sur les valeurs en euros, pas sur un volume d'heures.
    return field === "heures" ? raw : raw * this.coef(ch, m);
  }

  /** Prévisionnel déclaré par l'exploitation — `null` tant que le mois n'est pas saisi. */
  saisiField(ch: Chantier, m: number, field: string): number | null {
    const k = this.ek(ch, field, m);
    if (this.s.edits[k] !== undefined) return this.s.edits[k];
    const st = this.st(ch);
    if (this.closed()) {
      const r0 = rng(hash(ch.id + field + "c" + this.s.year + m));
      return this.baseField(ch, m, field) * (0.95 + r0() * 0.1);
    }
    if (st === "Baseline CG" || st === "Non budgétisé") return null;
    if (st === "En saisie") {
      const late = LATE.indexOf(ch.id);
      if (late === 0) {
        if (m >= 8) return null;
      } else if (late === 1) {
        if (m >= 6) return null;
      } else if (m >= 9) return null;
    }
    const r = rng(hash(ch.id + field + "s" + this.s.year + m));
    return this.baseField(ch, m, field) * (0.93 + r() * 0.14);
  }

  prims(ch: Chantier, m: number, mode: CalcMode): Prims | null {
    return this.memo("prims:" + ch.id + ":" + m + ":" + mode, () => this.primsRaw(ch, m, mode));
  }

  private primsRaw(ch: Chantier, m: number, mode: CalcMode): Prims | null {
    const f = (field: string) =>
      mode === "base" ? this.baseField(ch, m, field) : this.saisiField(ch, m, field);
    const cats: Record<string, number> = {};
    let ca = 0;
    for (const c of CAT) {
      const v = f(c.k);
      if (v === null) return null;
      cats[c.k] = v;
      ca += v;
    }
    const heures = f("heures");
    const taux = f("taux");
    if (heures === null || taux === null) return null;
    // La masse salariale n'est plus saisie : elle découle des heures et du taux.
    return { cats, ca, heures, taux, masse: heures * taux };
  }

  metricFrom(p: Prims | null, metric: MetricKey, cat?: string | null): number | null {
    if (!p) return null;
    if (metric === "ca") return cat && cat !== "Total" ? p.cats[this.catKey(cat)] : p.ca;
    if (metric === "heures") return p.heures;
    if (metric === "taux") return p.taux;
    if (metric === "masse") return p.masse;
    if (metric === "msRatio") return p.ca ? (p.masse / p.ca) * 100 : null;
    if (metric === "phv") return p.heures ? p.ca / p.heures : null;
    return p.ca ? ((p.ca - p.masse) / p.ca) * 100 : null;
  }

  catKey(label: string): CatKey {
    return CAT.find((c) => c.label === label)!.k;
  }

  /**
   * Agrège un indicateur sur une liste de chantiers et de mois.
   * `comparable` restreint l'agrégat aux couples réellement saisis, pour que les
   * écarts vs baseline se calculent à périmètre comparable.
   */
  aggregate(
    chList: Chantier[],
    mList: number[],
    mode: CalcMode,
    metric: MetricKey,
    cat?: string | null,
    comparable?: boolean,
  ): number | null {
    let ca = 0,
      heures = 0,
      masse = 0,
      catSum = 0,
      n = 0;
    chList.forEach((ch) =>
      mList.forEach((m) => {
        if (comparable && !this.prims(ch, m, "saisi")) return;
        const p = this.prims(ch, m, mode);
        if (!p) return;
        n++;
        ca += p.ca;
        heures += p.heures;
        masse += p.masse;
        if (cat && cat !== "Total") catSum += p.cats[this.catKey(cat)];
      }),
    );
    if (!n) return null;
    if (metric === "ca") return cat && cat !== "Total" ? catSum : ca;
    if (metric === "heures") return heures;
    // Taux horaire agrégé = masse totale / heures totales, donc pondéré.
    if (metric === "taux") return heures ? masse / heures : null;
    if (metric === "masse") return masse;
    if (metric === "msRatio") return ca ? (masse / ca) * 100 : null;
    if (metric === "phv") return heures ? ca / heures : null;
    return ca ? ((ca - masse) / ca) * 100 : null;
  }

  edited(ch: Chantier, field: string, m: number, onBaseline: boolean): boolean {
    const store: EditStore = onBaseline ? "baseEdits" : "edits";
    return this.s[store][this.ek(ch, field, m)] !== undefined;
  }

  // ------------------------------------------------------------------- périmètres

  /** Chantiers de l'entité sélectionnée. */
  scope(): Chantier[] {
    const e = this.s.fEntity;
    return this.memo("scope:" + e, () =>
      CHANTIERS.filter((ch) => e === "Toutes" || ch.entite === e),
    );
  }

  /** Périmètre du diagramme CA : consolidé pour le CDG, limité au REX pour l'exploitation. */
  caList(isCG: boolean): Chantier[] {
    return this.memo("caList:" + isCG, () =>
      isCG ? this.scope() : this.scope().filter((ch) => REX[ch.id] === CURRENT_REX),
    );
  }

  /** Périmètre de la page d'accueil, selon le rôle affiché. */
  perim(): Chantier[] {
    return this.caList(this.s.role !== "Exploitation");
  }

  caParts(isCG: boolean) {
    return this.memo("caParts:" + isCG, () => this.caPartsRaw(isCG));
  }

  private caPartsRaw(isCG: boolean) {
    const list = this.caList(isCG);
    return CAT.map((c) => {
      let value = 0,
        base = 0;
      list.forEach((ch) =>
        FULL_YEAR.forEach((m) => {
          base += this.baseField(ch, m, c.k);
          const v = this.saisiField(ch, m, c.k);
          if (v !== null) value += v;
        }),
      );
      return { key: c.k, label: "CA " + c.label, value, base };
    });
  }

  caBaseTotal(isCG: boolean): number {
    return this.memo("caBase:" + isCG, () =>
      this.caParts(isCG).reduce((a, x) => a + x.base, 0),
    );
  }

  /** CA total de l'exercice précédent, sur le même périmètre. */
  caPrevTotal(isCG: boolean): number {
    return this.memo("caPrev:" + isCG, () => {
      const prevYear = this.s.year - 1;
      let prev = 0;
      this.caList(isCG).forEach((ch) =>
        MONTHS.forEach((_, m) => CAT.forEach((c) => (prev += this.n1(ch, m, c.k, prevYear)))),
      );
      return prev;
    });
  }

  // --------------------------------------------------------------- état budgets

  budgetGroups() {
    return this.memo("budgetGroups", () => {
      const remplir: Chantier[] = [],
        cours: Chantier[] = [],
        fini: Chantier[] = [],
        attente: Chantier[] = [];
      this.perim().forEach((ch) => {
        const st = this.st(ch);
        if (st === "Validé" || st === "Clôturé") return void fini.push(ch);
        if (st === "Baseline CG" || st === "Non budgétisé") return void attente.push(ch);
        if (this.missing(ch, FULL_YEAR).length) return void remplir.push(ch);
        cours.push(ch);
      });
      return { remplir, cours, fini, attente };
    });
  }

  /** Mois de l'exercice dont l'échéance est dépassée (campagne = tout l'exercice). */
  nextDue(): number {
    return 0;
  }

  /**
   * Vrai pendant la fenêtre de déclaration ouverte par le contrôle de gestion.
   * Hors campagne, l'exercice est clos : la page d'accueil bascule sur la lecture
   * de l'historique plutôt que sur l'avancement de la saisie.
   */
  campaignOpen(): boolean {
    return !this.closed();
  }

  /** Budgets déclarés par l'exploitation et en attente de contrôle. */
  aValider(): Chantier[] {
    return this.memo("aValider", () =>
      this.perim()
        .filter((ch) => this.st(ch) === "À valider")
        .sort((a, b) => b.ca - a.ca),
    );
  }

  /** Chantiers sur lesquels l'exploitation n'a pas fini : baseline non publiée, non budgétisé, mois manquants. */
  nonTraites(): Chantier[] {
    return this.memo("nonTraites", () => {
      const g = this.budgetGroups();
      return g.attente.concat(g.remplir).sort((a, b) => b.ca - a.ca);
    });
  }

  /** Part des budgets terminés sur le périmètre, en pourcentage entier. */
  donePct(): number {
    const g = this.budgetGroups();
    const tot = g.remplir.length + g.cours.length + g.fini.length + g.attente.length;
    return tot ? Math.round((g.fini.length / tot) * 100) : 0;
  }

  /** Part du CA objectif effectivement déclarée, en pourcentage entier. */
  caPct(isGlobal: boolean): number {
    const base = this.caBaseTotal(isGlobal);
    if (!base) return 0;
    const declared = this.caParts(isGlobal).reduce((a, x) => a + x.value, 0);
    return Math.round((declared / base) * 100);
  }

  /**
   * Série mensuelle du périmètre : CA déclaré de l'exercice, objectif CDG et réalisé N-1.
   * Alimente le graphe d'évolution affiché hors campagne.
   */
  monthly(isGlobal: boolean) {
    return this.memo("monthly:" + isGlobal, () => {
      const list = this.caList(isGlobal);
      // Le budget de l'exercice précédent se lit sur un moteur calé sur N-1.
      const prevEngine = this.atYear(this.s.year - 1);
      return MONTHS.map((_, m) => {
        let objectif = 0;
        list.forEach((ch) => CAT.forEach((c) => (objectif += this.baseField(ch, m, c.k))));
        return {
          m,
          declare: this.aggregate(list, [m], "saisi", "ca", "Total"),
          objectif,
          prev: prevEngine.aggregate(list, [m], "saisi", "ca", "Total"),
        };
      });
    });
  }

  /** Mois ouverts à la saisie et non déclarés. */
  missing(ch: Chantier, mIdx: number[]): number[] {
    if (this.closed()) return [];
    const st = this.st(ch);
    if (st === "Validé" || st === "Clôturé") return [];
    return mIdx.filter((m) => this.s.periods[ch.agence][m] && !this.prims(ch, m, "saisi"));
  }

  /** Ce qu'il reste à faire sur un chantier, du point de vue du rôle donné. */
  todoFor(ch: Chantier, mIdx: number[], role: string): Todo | null {
    if (this.closed()) return null;
    const st = this.st(ch);
    const due = this.nextDue();
    if (st === "Non budgétisé")
      return {
        tag: "Non budgétisé",
        crit: true,
        hint: "aucun budget " + this.s.year + " sur ce chantier — à initialiser",
      };
    if (role === "Contrôle de gestion") {
      if (st === "Baseline CG")
        return {
          tag: "Baseline à publier",
          crit: true,
          hint: "baseline posée, pas encore ouverte à l'exploitation",
        };
      if (st === "À valider")
        return { tag: "À vérifier", crit: false, hint: "saisie exploitation en attente de contrôle" };
      const v = this.aggregate([ch], mIdx, "saisi", "marge");
      const b = this.aggregate([ch], mIdx, "base", "marge", null, true);
      const ec = v !== null && b !== null ? v - b : null;
      if (ec !== null && ec < -1.5)
        return {
          tag: "Marge sous objectif",
          crit: true,
          hint: ec.toFixed(1).replace(".", ",") + " pt de marge vs baseline",
        };
      return null;
    }
    if (st === "Baseline CG") return null;
    const miss = this.missing(ch, mIdx);
    if (!miss.length)
      return st === "En saisie"
        ? { tag: "À envoyer", crit: false, hint: "tous les mois ouverts sont saisis" }
        : null;
    if (miss.includes(due))
      return {
        tag: "Critique",
        crit: true,
        hint: MONTHS[due] + " " + this.s.year + " non budgété — échéance dépassée",
      };
    return {
      tag: "À déclarer",
      crit: false,
      hint:
        miss.length +
        " mois ouvert" +
        (miss.length > 1 ? "s" : "") +
        " non saisi" +
        (miss.length > 1 ? "s" : "") +
        " (" +
        miss.map((m) => SHORT[m]).join(", ") +
        ")",
    };
  }

  // -------------------------------------------------------------------- tableau

  filtered(): Chantier[] {
    return this.memo("filtered", () => {
      const s = this.s;
      const q = s.fSearch.trim().toLowerCase();
      return CHANTIERS.filter((c) => {
        // L'exploitation ne voit que les chantiers dont elle est responsable.
        if (this.isExploit && REX[c.id] !== CURRENT_REX) return false;
        if (s.onlyFlagged && !s.flags[c.id]) return false;
        if (s.fSecteur !== "Tous les secteurs" && c.secteur !== s.fSecteur) return false;
        if (s.fVille !== "Toutes les villes" && c.ville !== s.fVille) return false;
        if (s.fAgence !== "Toutes les agences" && c.agence !== s.fAgence) return false;
        if (s.fClient !== "Tous les clients" && c.client !== s.fClient) return false;
        if (s.fEntity !== "Toutes" && c.entite !== s.fEntity) return false;
        if (s.fTag !== "Tous les tags" && !(s.tags[c.id] || []).includes(s.fTag)) return false;
        if (s.fRex !== "Tous" && REX[c.id] !== s.fRex) return false;
        if (!s.fStatuts.includes(this.st(c))) return false;
        if (
          q &&
          !(
            c.nom.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q) ||
            c.ville.toLowerCase().includes(q)
          )
        )
          return false;
        if (s.onlyTodo && !this.todoFor(c, PER_MONTHS[s.fPeriode], s.role)) return false;
        return true;
      });
    });
  }

  sorted(list: Chantier[], mIdx: number[]): Chantier[] {
    const s = this.s,
      sort = s.fSort;
    const key = s.metric,
      cat = s.cat;
    const arr = list.slice();
    const num = (ch: Chantier) => this.aggregate([ch], mIdx, "saisi", key, cat) || 0;
    const rank = (ch: Chantier) => {
      const t = this.todoFor(ch, mIdx, s.role);
      return t ? (t.crit ? 0 : 1) : 2;
    };
    if (sort === "Priorité à déclarer")
      // Les urgences d'abord, puis du plus gros CA au plus petit.
      arr.sort((a, b) => rank(a) - rank(b) || b.ca - a.ca || a.id.localeCompare(b.id));
    else if (sort === "Code chantier") arr.sort((a, b) => a.id.localeCompare(b.id));
    else if (sort === "Nom du site") arr.sort((a, b) => a.nom.localeCompare(b.nom));
    else if (sort === "Ville")
      arr.sort((a, b) => a.ville.localeCompare(b.ville) || a.id.localeCompare(b.id));
    else if (sort === "Montant décroissant") arr.sort((a, b) => num(b) - num(a));
    else if (sort === "Montant croissant") arr.sort((a, b) => num(a) - num(b));
    else if (sort === "Écart vs baseline")
      arr.sort((a, b) => {
        const e = (ch: Chantier) => {
          const v = this.aggregate([ch], mIdx, "saisi", key, cat);
          const bb = this.aggregate([ch], mIdx, "base", key, cat, true);
          return v === null || bb === null || !bb ? 0 : (v - bb) / Math.abs(bb);
        };
        return e(a) - e(b);
      });
    else if (sort === "Remplissage croissant")
      arr.sort((a, b) => {
        const f = (ch: Chantier) => mIdx.filter((m) => this.prims(ch, m, "saisi")).length;
        return f(a) - f(b);
      });
    else if (sort === "Statut") {
      const order: Statut[] = [
        "Non budgétisé",
        "Baseline CG",
        "En saisie",
        "À valider",
        "Validé",
        "Clôturé",
      ];
      arr.sort((a, b) => order.indexOf(this.st(a)) - order.indexOf(this.st(b)));
    }
    return arr;
  }

  /**
   * Mois réellement modifiables sur ce chantier, selon le rôle, le statut et les
   * périodes ouvertes. Un budget déjà validé reste modifiable : la correction
   * déclenche simplement une nouvelle cristallisation à faire valider.
   */
  editableMonths(ch: Chantier, mIdx: number[]): number[] {
    const st = this.st(ch);
    if (this.isCG) return st === "Clôturé" ? [] : mIdx;
    if (!this.isExploit) return [];
    // Une période explicitement bloquante gèle la saisie de l'exploitation.
    if (this.activeBlock()) return [];
    return mIdx.filter(
      (m) => this.s.periods[ch.agence][m] && st !== "Clôturé" && st !== "Baseline CG",
    );
  }

  /** Période de gestion active qui bloque explicitement les modifications, s'il y en a une. */
  activeBlock() {
    return this.s.periodRules.find((r) => r.active && r.blocking) || null;
  }

  /** Numéro de la cristallisation en cours sur un chantier. */
  cristal(ch: Chantier): number {
    return this.s.cristal[ch.id] || 0;
  }

  /**
   * Part des champs réellement renseignés sur la période : 100 % quand les six
   * postes sont saisis sur tous les mois.
   */
  completionPct(ch: Chantier, mIdx: number[]): number {
    let done = 0;
    mIdx.forEach((m) =>
      SAISIE_FIELDS.forEach((f) => {
        if (this.saisiField(ch, m, f) !== null) done++;
      }),
    );
    const tot = mIdx.length * SAISIE_FIELDS.length;
    return tot ? Math.round((done / tot) * 100) : 0;
  }

  /** Libellé lisible d'un ensemble de postes (« tout le CA », « tous les postes »…). */
  fieldNames(fields: string[]): string {
    const map: Record<string, string> = { heures: "Nombre d'heures", taux: "Taux horaire" };
    CAT.forEach((c) => (map[c.k] = "CA " + c.label));
    const names = fields.map((f) => map[f] || f);
    if (names.length === 6) return "tous les postes";
    if (names.length === 4 && fields.every((f) => CAT.some((c) => c.k === f))) return "tout le CA";
    return names.join(", ");
  }

  /** Campagne : part des cellules déjà déclarées sur le périmètre du rôle. */
  campaignPct(): string {
    let done = 0,
      tot = 0;
    this.perim().forEach((ch) =>
      MONTHS.forEach((_, m) => {
        tot++;
        if (this.prims(ch, m, "saisi")) done++;
      }),
    );
    return (tot ? Math.round((done / tot) * 100) : 0) + "%";
  }

  fillPct(isCG: boolean): string {
    let done = 0,
      tot = 0;
    this.caList(isCG).forEach((ch) =>
      MONTHS.forEach((_, m) => {
        tot++;
        if (this.prims(ch, m, "saisi")) done++;
      }),
    );
    return (tot ? Math.round((done / tot) * 100) : 0) + "%";
  }

  campaignChip(): string {
    return this.closed()
      ? "Exercice " + this.s.year + " — budget clos, consultation seule"
      : "Campagne de septembre " +
          (this.s.year - 1) +
          " — validation du budget janvier à décembre " +
          this.s.year;
  }

  campaignShort(): string {
    return this.closed()
      ? "Budget clos · lecture seule"
      : "Saisie ouverte · échéance fin septembre " + (this.s.year - 1);
  }

  initials(nom: string): string {
    return nom
      .split(/[ .]+/)
      .filter(Boolean)
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
}
