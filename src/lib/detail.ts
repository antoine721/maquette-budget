import { CONFIG } from "../config";
import {
  CAT,
  ST,
  N2_BORDER,
  N2_TINT,
  N2_FG,
  type MetricKey,
  type Statut,
} from "../data/constants";
import { anneeReference, estReel, refDegradee } from "../data/realise";
import type { Chantier } from "../data/chantiers";
import type { Engine } from "./engine";
import type { AppState } from "./types";
import { BRAND, INK } from "../theme";

export interface DetailCell {
  editable: boolean;
  /** Cellule saisissable */
  raw?: string;
  ghost?: string;
  ghostTitle?: string;
  dash?: string;
  border?: string;
  fg?: string;
  field?: string;
  month?: number;
  onBaseline?: boolean;
  /** Coefficient particulier édité au niveau du chantier. */
  refId?: string;
  /** Cellule en lecture */
  text?: string;
  color?: string;
  bg?: string;
}

export interface QuickInfo {
  /** Postes visés par les actions en masse de la ligne. */
  fields: string[];
  /** Identifiant du menu ⋯ ouvert (`code|ligne`). */
  menuId: string;
  /** Mois réellement modifiables selon le rôle, le statut et les périodes ouvertes. */
  editableMonths: number[];
  doneLabel: string;
  doneBg: string;
  doneFg: string;
  doneTitle: string;
}

export interface DetailLine {
  id: string;
  label: string;
  title: string;
  cursor: string;
  cells: DetailCell[];
  total: string;
  totalColor: string;
  rowBg: string;
  sepColor: string;
  weight: number;
  labelColor: string;
  size: string;
  pad: string;
  spacing: string;
  transform: string;
  /** Ligne « CA total budgété » : replie ou déplie les 4 catégories. */
  toggleCa?: boolean;
  quick?: QuickInfo;
  /** Ligne grise cumulant les actions déjà appliquées. */
  applied?: { label: string; title: string };
  /** Ligne d'ouverture de section : le détail se lit en zones successives. */
  head?: { index: number; hint: string };
}

export interface MenuAction {
  label: string;
  act: string;
  needs: boolean;
  color: string;
}

/**
 * Actions en masse proposées par le bouton ⋯ d'une ligne de saisie.
 * Volontairement réduit à deux gestes : appliquer une évolution, ou étendre le
 * premier mois saisi au reste de l'année.
 */
export function menuActions(): MenuAction[] {
  return [
    { label: "Appliquer un % d'évolution", act: "Appliquer un % d'évolution", needs: true },
    {
      label: "Recopier le 1er mois saisi sur les autres",
      act: "Recopier le 1er mois saisi sur tous les mois",
      needs: false,
    },
  ].map((a) => ({ ...a, color: "#334155" }));
}

export function menuPlaceholder(step: string): string {
  if (step === "Appliquer un % d'évolution") return "ex. 15 (%)";
  return "montant par mois (€)";
}

function mkLine(id: string, label: string, o: Partial<DetailLine> = {}): DetailLine {
  return {
    id,
    label,
    title: label,
    cursor: "default",
    cells: [],
    total: "",
    totalColor: "#475569",
    rowBg: "transparent",
    sepColor: "#f1f4f7",
    weight: 500,
    labelColor: "#475569",
    size: "13px",
    pad: "9px 12px 9px 14px",
    spacing: "0",
    transform: "none",
    ...o,
  };
}

/**
 * Ouverture d'une des trois zones du détail. Chaque zone est un bloc à part
 * entière : on lit d'abord d'où part le budget, puis ce qu'on y saisit, puis ce
 * qui en découle. Enchaînées sans séparation, les vingt lignes se confondaient.
 */
function groupHead(id: string, label: string, index: number, hint: string): DetailLine {
  return mkLine(id, label, {
    weight: 700,
    labelColor: "#334155",
    size: "12px",
    pad: "0 0 0 14px",
    sepColor: "transparent",
    head: { index, hint },
  });
}

/**
 * Valeur de l'indicateur affiché sur le réalisé de référence d'un mois.
 *
 * Les indicateurs composés — masse salariale, ratios, prix horaire — ne sont
 * pas des lignes de l'export : ils se recomposent à partir du CA, des heures et
 * du taux. Si l'un des trois manque, l'indicateur ne veut rien dire et vaut
 * `null` plutôt que zéro.
 */
function valeurReference(
  engine: Engine,
  ch: Chantier,
  m: number,
  year: number,
  key: MetricKey,
  cat: string,
): number | null {
  const n = (f: string) => engine.n1(ch, m, f, year);
  if (key === "ca") return cat === "Total" ? n("ca") : n(engine.catKey(cat));
  if (key === "heures" || key === "taux") return n(key);
  const ca = n("ca"),
    heures = n("heures"),
    taux = n("taux");
  if (ca === null || heures === null || taux === null) return null;
  return engine.metricFrom({ cats: {}, ca, heures, taux, masse: heures * taux }, key, cat);
}

/**
 * Construit le détail du calcul d'un chantier, en trois groupes :
 * la **baseline** posée par le contrôle de gestion, ce que l'exploitation doit
 * **remplir**, et les **indicateurs calculés** qui en découlent.
 */
export function buildDetail(
  engine: Engine,
  s: AppState,
  ch: Chantier,
  mIdx: number[],
): DetailLine[] {
  const met = engine.metric;
  const cat = s.cat;
  const st = engine.st(ch) as Statut;
  const stc = ST[st];
  const isCG = engine.isCG;
  const isExploit = engine.isExploit;

  const detail: DetailLine[] = [];
  // Un exercice couvert par l'export ne se budgète plus : il se lit.
  const reel = estReel(s.year);

  // ------------------------------------------------------- 1. baseline contrôle de gestion
  detail.push(
    groupHead(
      "head:base",
      reel ? "Objectif — contrôle de gestion" : "Baseline — contrôle de gestion",
      1,
      reel
        ? "L'objectif que Gescof a porté sur l'exercice, en regard du réalisé de l'année d'avant."
        : "Le point de départ du budget : le réalisé de l'an dernier, corrigé des coefficients.",
    ),
  );
  const lineN1 = mkLine("n1", "Réalisé de référence (export Gescof)", {
    labelColor: "#6b7681",
    title:
      "Le dernier exercice dont la paie couvre le mois : " +
      (anneeReference(s.year, 0) ?? "—") +
      " en début d'année, " +
      (anneeReference(s.year, 11) ?? "—") +
      " sur les mois qu'il n'atteint pas.",
  });
  const refLines = s.refs.map((r) => ({
    ref: r,
    line: mkLine("ref:" + r.id, "× " + r.label + " (%)", {
      // Les coefficients se saisissent en pourcentage d'évolution : 0 % vaut × 1,000.
      title:
        (r.scope === "commun"
          ? r.label + " — coefficient commun à tout le portefeuille"
          : r.label + " — coefficient particulier, valeur propre à ce chantier") +
        " · saisi en % d'évolution : 0 % = × 1,000",
      labelColor: r.scope === "particulier" ? "#5b21b6" : "#475569",
    }),
  }));
  const lineBase = mkLine(
    "base",
    reel ? "= Objectif Gescof (Budget CA / Budget heures)" : "= Baseline contrôle de gestion",
    {
      weight: 700,
      labelColor: "#334155",
      rowBg: "#f8fafc",
      sepColor: "#e2e8f0",
      title: reel
        ? "Lignes « Budget CA » et « Budget heures » de l'export — les coefficients ne s'y appliquent pas."
        : "Réalisé de référence multiplié par les coefficients.",
    },
  );
  detail.push(lineN1);
  // Les coefficients construisent la baseline d'une campagne ; sur un exercice
  // révolu l'objectif est déjà posé, les afficher laisserait croire qu'il en dépend.
  if (!reel) refLines.forEach((r) => detail.push(r.line));
  detail.push(lineBase);

  // ------------------------------------------------------------- 2. saisie exploitation
  detail.push(
    groupHead(
      "head:saisie",
      reel ? "Réalisé — exploitation" : "À remplir — exploitation",
      2,
      reel
        ? "Ce que le chantier a produit mois par mois, tel que Gescof le remonte."
        : "Les postes saisis mois par mois : le CA par catégorie, les heures et le taux horaire.",
    ),
  );
  const catLines = CAT.map((c) => ({
    c,
    line: mkLine("cat:" + c.k, "CA " + c.label, {
      title: "CA " + c.label + " — " + c.title,
      rowBg: stc.cell,
      sepColor: stc.border,
    }),
  }));
  const caOpen = s.openCa[ch.id] !== false;
  const lineCaTot = mkLine("catotal", (caOpen ? "▾ " : "▸ ") + (reel ? "CA total réalisé" : "CA total budgété"), {
    weight: 700,
    labelColor: stc.fg,
    rowBg: stc.cell,
    sepColor: stc.border,
    cursor: "pointer",
    title: "Forfait + Réel + PAD + TE — cliquer pour " + (caOpen ? "replier" : "déplier"),
    toggleCa: true,
  });
  detail.push(lineCaTot);
  if (caOpen) catLines.forEach((c) => detail.push(c.line));

  const lineHeures = mkLine("heures", "Nombre d'heures", {
    weight: 600,
    labelColor: "#17202a",
    rowBg: stc.cell,
    sepColor: stc.border,
  });
  const lineTaux = mkLine("taux", "Taux horaire chargé", {
    weight: 600,
    labelColor: "#17202a",
    rowBg: stc.cell,
    sepColor: stc.border,
  });
  // La masse salariale n'est plus saisie : elle tombe du couple heures × taux.
  const lineMasse = mkLine("masse", "= Masse salariale (heures × taux)", {
    weight: 700,
    labelColor: "#334155",
    rowBg: "#f8fafc",
    sepColor: "#e2e8f0",
  });
  detail.push(lineHeures, lineTaux, lineMasse);

  // ---------------------------------------------------------- 3. indicateurs calculés
  detail.push(
    groupHead(
      "head:calc",
      "Indicateurs calculés",
      3,
      "Ils découlent des deux zones ci-dessus — rien ne s'y saisit.",
    ),
  );
  const lineMsRatio = mkLine("msRatio", "% masse salariale / CA", { labelColor: "#334155" });
  const linePhv = mkLine("phv", "Prix horaire vendu (CA / heures)", { labelColor: "#334155" });
  const lineMarge = mkLine("marge", "% marge restant après MS", {
    weight: 700,
    labelColor: "#334155",
    rowBg: "#f8fafc",
    sepColor: "#e2e8f0",
  });
  detail.push(lineMsRatio, linePhv, lineMarge);

  // ------------------------------------------------ badges « déjà effectué » et menu ⋯
  const msEdit = engine.editableMonths(ch, mIdx);
  if ((isCG || isExploit) && msEdit.length) {
    const quick = (line: DetailLine, fields: string[], lineId: string) => {
      const saisis = mIdx.filter((m) =>
        fields.every((f) => engine.saisiField(ch, m, f) !== null),
      ).length;
      const modifs = mIdx.reduce(
        (a, m) => a + fields.filter((f) => engine.edited(ch, f, m, isCG)).length,
        0,
      );
      const mine = s.history.filter(
        (h) => h.cible === ch.id && h.fields.some((f) => fields.includes(f)),
      );
      const last = mine.length ? mine[mine.length - 1] : null;
      line.quick = {
        fields,
        menuId: ch.id + "|" + lineId,
        editableMonths: msEdit,
        doneLabel: Math.round((saisis / mIdx.length) * 100) + " %",
        doneBg: modifs ? "#e8f6fd" : "#f4f6f8",
        doneFg: modifs ? BRAND.strong : "#6b7681",
        doneTitle: last
          ? "Dernière action : " + last.label + " (" + last.count + " cellules)"
          : saisis + "/" + mIdx.length + " mois renseignés sur cette ligne",
      };
      if (mine.length)
        line.applied = {
          label: mine.map((h) => h.short).join(" · "),
          title: mine.map((h) => h.short + " (" + h.count + " cellules)").join("  |  "),
        };
    };
    catLines.forEach((cl) => quick(cl.line, [cl.c.k], cl.c.k));
    quick(lineCaTot, CAT.map((c) => c.k as string), "catotal");
    quick(lineHeures, ["heures"], "heures");
    quick(lineTaux, ["taux"], "taux");
  }

  // ------------------------------------------------------------------ cellules mensuelles
  mIdx.forEach((m) => {
    const periodOpen = s.periods[ch.agence][m];
    const cgEdit = isCG && st !== "Clôturé";
    const exEdit =
      isExploit &&
      periodOpen &&
      st !== "Clôturé" &&
      st !== "En attente baseline CG" &&
      !engine.activeBlock();
    const pB = engine.prims(ch, m, "base");
    const pS = engine.prims(ch, m, "saisi");
    const bMet = engine.metricFrom(pB, met.key, cat);
    const n2 = refDegradee(s.year, m);

    const n1v = valeurReference(engine, ch, m, s.year, met.key, cat);
    // Sur septembre-décembre, les réalisés de l'année en cours manquent : la
    // référence remonte à N-2. C'est la seule cellule où l'information a du sens.
    lineN1.cells.push({
      editable: false,
      text: engine.fmt(n1v, met.kind) + (n2 ? " ᴺ⁻²" : ""),
      color: n2 ? N2_FG : "#6b7681",
      bg: n2 ? N2_TINT : "transparent",
    });

    refLines.forEach((rl) => {
      const v = engine.refValue(rl.ref, ch, m);
      const c = 1 + v / 100;
      // Un coefficient particulier se règle chantier par chantier, depuis ce détail.
      if (rl.ref.scope === "particulier" && cgEdit) {
        rl.line.cells.push({
          editable: true,
          raw: String(v),
          ghost: "0",
          ghostTitle:
            "% d'évolution propre à ce chantier — 0 % = × 1,000 (neutre) · actuellement × " +
            c.toFixed(3).replace(".", ","),
          border: "#ddd6fe",
          dash: "solid",
          fg: "#5b21b6",
          refId: rl.ref.id,
          month: m,
        });
        return;
      }
      rl.line.cells.push({
        editable: false,
        text: "× " + c.toFixed(3).replace(".", ","),
        color: c === 1 ? "#cbd5e1" : rl.ref.scope === "particulier" ? "#5b21b6" : "#475569",
        bg: "transparent",
      });
    });

    // La baseline n'est saisissable que sur un poste unitaire : CA d'une catégorie, heures ou taux.
    const baseEditable = cgEdit && (met.key === "ca" || met.key === "heures" || met.key === "taux");
    const baseField =
      met.key === "ca" ? (cat === "Total" ? null : engine.catKey(cat)) : (met.key as string);
    const baseRaw = baseField === null ? null : engine.baseField(ch, m, baseField);
    lineBase.cells.push(
      baseEditable && baseField && baseRaw !== null
        ? {
            editable: true,
            raw: String(Math.round(baseRaw)),
            border: "#cbd5e1",
            dash: "solid",
            fg: "#17202a",
            field: baseField,
            month: m,
            onBaseline: true,
          }
        : {
            editable: false,
            text: engine.fmt(bMet, met.kind),
            color: "#334155",
            bg: "transparent",
          },
    );

    /**
     * Case de saisie exploitation. La valeur proposée vient de N-1, sauf de septembre
     * à décembre où elle remonte à N-2 : ces cases-là sont signalées en violet tant
     * qu'elles ne sont pas reconfirmées.
     */
    const saisiCell = (field: string, kind: typeof met.kind, readColor: string): DetailCell => {
      const v = engine.saisiField(ch, m, field);
      const ed = engine.edited(ch, field, m, isCG);
      const refYear = anneeReference(s.year, m);
      const ref = engine.n1(ch, m, field, s.year);
      const preN2 = n2 && !ed;
      if (!exEdit)
        return {
          editable: false,
          text: engine.fmt(v, kind),
          color: ed ? readColor : v === null ? INK.faint : preN2 ? N2_FG : readColor,
          bg: ed ? "#eff6ff" : preN2 ? N2_TINT : "transparent",
        };
      return {
        editable: true,
        raw: v === null ? "" : field === "taux" ? v.toFixed(2) : String(Math.round(v)),
        ghost:
          CONFIG.ghostN1 === false || ref === null
            ? "—"
            : field === "taux"
              ? ref.toFixed(2)
              : String(Math.round(ref)),
        ghostTitle:
          ref === null
            ? "Aucun réalisé de référence sur ce mois"
            : v === null
              ? "Valeur " + refYear + " proposée — saisissez le montant " + s.year
              : ed
                ? "Montant confirmé"
                : "Repris de " + refYear + " — à confirmer en le ressaisissant",
        dash: CONFIG.confirmN1 !== false && v !== null && !ed ? "dashed" : "solid",
        fg:
          CONFIG.confirmN1 === false || v === null || ed
            ? "#17202a"
            : preN2
              ? N2_FG
              : INK.faint,
        border: ed ? BRAND.base : preN2 ? N2_BORDER : stc.border,
        bg: preN2 ? N2_TINT : "#fff",
        field,
        month: m,
        onBaseline: false,
      };
    };

    catLines.forEach((cl) => cl.line.cells.push(saisiCell(cl.c.k, "money", "#334155")));

    lineCaTot.cells.push({
      editable: false,
      text: engine.fmt(pS ? pS.ca : null, "money"),
      color: pS && pB ? engine.markerColor(pS.ca, pB.ca, "high") : INK.faint,
      bg: "transparent",
    });

    lineHeures.cells.push(saisiCell("heures", "h", "#17202a"));
    lineTaux.cells.push(saisiCell("taux", "eur2", "#17202a"));
    lineMasse.cells.push({
      editable: false,
      text: engine.fmt(pS ? pS.masse : null, "money"),
      color: pS && pB ? engine.markerColor(pS.masse, pB.masse, "low") : INK.faint,
      bg: "transparent",
    });

    (
      [
        ["msRatio", lineMsRatio, "pct", "low"],
        ["phv", linePhv, "eur2", "high"],
        ["marge", lineMarge, "pct", "high"],
      ] as const
    ).forEach(([k, line, kind, better]) => {
      const v = engine.metricFrom(pS, k, cat);
      const b = engine.metricFrom(pB, k, cat);
      line.cells.push({
        editable: false,
        text: engine.fmt(v, kind),
        color: engine.markerColor(v, b, better),
        bg: "transparent",
      });
    });
  });

  // ------------------------------------------------------------------------- totaux
  // Un ratio se moyenne sur les mois couverts, un montant s'additionne.
  const refs = mIdx
    .map((m) => valeurReference(engine, ch, m, s.year, met.key, cat))
    .filter((v): v is number => v !== null);
  lineN1.total = refs.length
    ? engine.fmt(
        met.agg === "ratio"
          ? refs.reduce((a, v) => a + v, 0) / refs.length
          : refs.reduce((a, v) => a + v, 0),
        met.kind,
      )
    : "—";

  lineBase.total = engine.fmt(engine.aggregate([ch], mIdx, "base", met.key, cat), met.kind);
  lineBase.totalColor = "#334155";

  refLines.forEach((rl) => {
    const moy =
      mIdx.reduce((a, m) => a + engine.refValue(rl.ref, ch, m), 0) / (mIdx.length || 1);
    rl.line.total = "moy. " + moy.toFixed(2).replace(".", ",") + " %";
    rl.line.totalColor = "#94a3b8";
  });

  catLines.forEach((cl) => {
    const v = mIdx.reduce((a, m) => {
      const x = engine.saisiField(ch, m, cl.c.k);
      return x === null ? a : a + x;
    }, 0);
    cl.line.total = engine.fmt(v || null, "money");
    cl.line.totalColor = "#334155";
  });

  lineCaTot.total = engine.fmt(engine.aggregate([ch], mIdx, "saisi", "ca", "Total"), "money");
  lineCaTot.totalColor = stc.fg;
  lineHeures.total = engine.fmt(engine.aggregate([ch], mIdx, "saisi", "heures"), "h");
  lineTaux.total = engine.fmt(engine.aggregate([ch], mIdx, "saisi", "taux"), "eur2");
  lineMasse.total = engine.fmt(engine.aggregate([ch], mIdx, "saisi", "masse"), "money");
  lineMasse.totalColor = "#334155";
  lineMsRatio.total = engine.fmt(engine.aggregate([ch], mIdx, "saisi", "msRatio"), "pct");
  linePhv.total = engine.fmt(engine.aggregate([ch], mIdx, "saisi", "phv"), "eur2");
  lineMarge.total = engine.fmt(engine.aggregate([ch], mIdx, "saisi", "marge"), "pct");
  lineMarge.totalColor = engine.markerColor(
    engine.aggregate([ch], mIdx, "saisi", "marge"),
    engine.aggregate([ch], mIdx, "base", "marge", null, true),
    "high",
  );

  if (!reel && isCG && met.key === "ca" && cat === "Total")
    lineBase.label =
      "= Baseline contrôle de gestion — choisissez une catégorie (Forfait / Réel / PAD / TE) pour la saisir";
  if (!reel && isCG && met.key === "masse")
    lineBase.label = "= Baseline contrôle de gestion — la masse salariale se règle via le taux horaire";

  return detail;
}
