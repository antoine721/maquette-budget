import { CONFIG } from "../config";
import { CAT, ST, type Statut } from "../data/constants";
import type { Chantier } from "../data/chantiers";
import type { Engine } from "./engine";
import type { AppState } from "./types";

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
}

export interface MenuAction {
  label: string;
  act: string;
  needs: boolean;
  color: string;
}

/** Actions en masse proposées par le bouton ⋯ d'une ligne de saisie. */
export function menuActions(year: number): MenuAction[] {
  return [
    { label: "Reprendre les valeurs " + (year - 1), act: "Reprendre les valeurs " + (year - 1), needs: false },
    { label: "Reprendre les valeurs " + (year - 2), act: "Reprendre les valeurs " + (year - 2), needs: false },
    { label: "Reprendre l'objectif du contrôle de gestion", act: "Recopier la baseline sur tous les mois", needs: false },
    { label: "Recopier le 1er mois saisi sur les autres", act: "Recopier le 1er mois saisi sur tous les mois", needs: false },
    { label: "Appliquer un % d'évolution", act: "Appliquer un % d'évolution", needs: true },
    { label: "Valeur fixe par mois", act: "Saisir une valeur fixe par mois", needs: true },
    { label: "Répartir un total sur la période", act: "Répartir un total sur la période", needs: true },
    { label: "Arrondir à la centaine", act: "Arrondir à la centaine", needs: false },
    { label: "Vider la ligne", act: "Vider la ligne", needs: false },
  ].map((a) => ({ ...a, color: a.act === "Vider la ligne" ? "#b91c1c" : "#334155" }));
}

export function menuPlaceholder(step: string): string {
  if (step === "Appliquer un % d'évolution") return "ex. 15 (%)";
  if (step === "Répartir un total sur la période") return "total à répartir (€)";
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
    pad: "9px 12px 9px 0",
    spacing: "0",
    transform: "none",
    ...o,
  };
}

/**
 * Construit le détail du calcul d'un chantier :
 * réalisé N-1 → coefficients → baseline CG → saisie exploitation → indicateurs calculés.
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

  const head = (id: string, label: string) =>
    mkLine(id, label, {
      weight: 700,
      labelColor: "#8a95a1",
      size: "11px",
      spacing: "0.7px",
      transform: "uppercase",
      pad: "16px 0 6px",
      sepColor: "transparent",
    });

  const detail: DetailLine[] = [];

  const lineN1 = mkLine("n1", "Réalisé N-1 (source Gescof)", { labelColor: "#6b7681" });
  const refLines = s.refs.map((r) => ({ ref: r, line: mkLine("ref:" + r.id, "× " + r.label) }));
  const lineBase = mkLine("base", "= Baseline contrôle de gestion", {
    weight: 700,
    labelColor: "#334155",
    rowBg: "#f8fafc",
    sepColor: "#e2e8f0",
  });
  detail.push(lineN1);
  refLines.forEach((r) => detail.push(r.line));
  detail.push(lineBase);

  const catLines = CAT.map((c) => ({
    c,
    line: mkLine("cat:" + c.k, "CA " + c.label, {
      title: "CA " + c.label + " — " + c.title,
      rowBg: stc.cell,
      sepColor: stc.border,
    }),
  }));
  const caOpen = s.openCa[ch.id] !== false;
  const lineCaTot = mkLine("catotal", (caOpen ? "▾ " : "▸ ") + "CA total budgété", {
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
  const lineMasse = mkLine("masse", "Masse salariale", {
    weight: 600,
    labelColor: "#17202a",
    rowBg: stc.cell,
    sepColor: stc.border,
  });
  detail.push(lineHeures, lineMasse);

  detail.push(head("head:calc", "Indicateurs calculés"));
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
        doneLabel: saisis + "/" + mIdx.length + " saisis" + (modifs ? " · " + modifs + " modif." : ""),
        doneBg: modifs ? "#e8f6fd" : "#f4f6f8",
        doneFg: modifs ? "#0782b6" : "#8a95a1",
        doneTitle: last
          ? "Dernière action : " + last.label + " (" + last.count + " cellules)"
          : modifs
            ? modifs + " cellule(s) saisie(s) manuellement sur cette ligne"
            : "Aucune action manuelle sur cette ligne",
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
    quick(lineMasse, ["masse"], "masse");
  }

  // ------------------------------------------------------------------ cellules mensuelles
  mIdx.forEach((m) => {
    const periodOpen = s.periods[ch.agence][m];
    const cgEdit = isCG && st !== "Clôturé";
    const exEdit =
      isExploit && periodOpen && st !== "Clôturé" && st !== "Validé" && st !== "Baseline CG";
    const pB = engine.prims(ch, m, "base");
    const pS = engine.prims(ch, m, "saisi");
    const bMet = engine.metricFrom(pB, met.key, cat);

    const n1v =
      met.key === "msRatio" || met.key === "phv" || met.key === "marge"
        ? engine.metricFrom(
            {
              cats: {},
              ca: engine.n1(ch, m, "ca", s.year),
              heures: engine.n1(ch, m, "heures", s.year),
              masse: engine.n1(ch, m, "masse", s.year),
            },
            met.key,
            cat,
          )
        : met.key === "ca" && cat !== "Total"
          ? engine.n1(ch, m, engine.catKey(cat), s.year)
          : engine.n1(ch, m, met.key === "ca" ? "ca" : met.key, s.year);
    lineN1.cells.push({
      editable: false,
      text: engine.fmt(n1v, met.kind),
      color: "#6b7681",
      bg: "transparent",
    });

    refLines.forEach((rl) => {
      const c = 1 + (Number(rl.ref.values[m]) || 0) / 100;
      rl.line.cells.push({
        editable: false,
        text: "× " + c.toFixed(3).replace(".", ","),
        color: c === 1 ? "#cbd5e1" : "#475569",
        bg: "transparent",
      });
    });

    // La baseline n'est saisissable que sur un poste unitaire : CA d'une catégorie, heures ou MS.
    const baseEditable = cgEdit && (met.key === "ca" || met.key === "heures" || met.key === "masse");
    const baseField =
      met.key === "ca" ? (cat === "Total" ? null : engine.catKey(cat)) : (met.key as string);
    lineBase.cells.push(
      baseEditable && baseField
        ? {
            editable: true,
            raw: String(Math.round(engine.baseField(ch, m, baseField))),
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

    /** Case de saisie exploitation, avec la valeur N-1 proposée en gris tant qu'elle n'est pas reconfirmée. */
    const saisiCell = (field: string, kind: typeof met.kind, readColor: string): DetailCell => {
      const v = engine.saisiField(ch, m, field);
      const ed = engine.edited(ch, field, m, isCG);
      if (!exEdit)
        return {
          editable: false,
          text: engine.fmt(v, kind),
          color: v === null ? "#94a3b8" : readColor,
          bg: ed ? "#eff6ff" : "transparent",
        };
      return {
        editable: true,
        raw: v === null ? "" : String(Math.round(v)),
        ghost: CONFIG.ghostN1 === false ? "—" : String(Math.round(engine.n1(ch, m, field, s.year - 1))),
        ghostTitle:
          v === null
            ? "Valeur " + (s.year - 1) + " proposée — saisissez le montant " + s.year
            : ed
              ? "Montant confirmé"
              : "Repris de " + (s.year - 1) + " — à confirmer en le ressaisissant",
        dash: CONFIG.confirmN1 !== false && v !== null && !ed ? "dashed" : "solid",
        fg: CONFIG.confirmN1 === false || v === null || ed ? "#17202a" : "#94a3b8",
        border: ed ? "#0a9bd8" : stc.border,
        field,
        month: m,
        onBaseline: false,
      };
    };

    catLines.forEach((cl) => cl.line.cells.push(saisiCell(cl.c.k, "money", "#334155")));

    lineCaTot.cells.push({
      editable: false,
      text: engine.fmt(pS ? pS.ca : null, "money"),
      color: pS && pB ? engine.markerColor(pS.ca, pB.ca, "high") : "#94a3b8",
      bg: "transparent",
    });

    lineHeures.cells.push(saisiCell("heures", "h", "#17202a"));
    lineMasse.cells.push(saisiCell("masse", "money", "#17202a"));

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
  lineN1.total =
    met.agg === "ratio"
      ? engine.fmt(
          lineN1.cells.reduce((a, c) => a + (parseFloat(String(c.text).replace(",", ".")) || 0), 0) /
            (lineN1.cells.length || 1),
          met.kind,
        )
      : engine.fmt(
          mIdx.reduce(
            (a, m) =>
              a +
              (met.key === "ca" && cat !== "Total"
                ? engine.n1(ch, m, engine.catKey(cat), s.year)
                : engine.n1(ch, m, met.key, s.year)),
            0,
          ),
          met.kind,
        );

  lineBase.total = engine.fmt(engine.aggregate([ch], mIdx, "base", met.key, cat), met.kind);
  lineBase.totalColor = "#334155";

  refLines.forEach((rl) => {
    rl.line.total =
      "moy. " +
      (mIdx.reduce((a, m) => a + (Number(rl.ref.values[m]) || 0), 0) / mIdx.length)
        .toFixed(2)
        .replace(".", ",") +
      " %";
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
  lineMasse.total = engine.fmt(engine.aggregate([ch], mIdx, "saisi", "masse"), "money");
  lineMsRatio.total = engine.fmt(engine.aggregate([ch], mIdx, "saisi", "msRatio"), "pct");
  linePhv.total = engine.fmt(engine.aggregate([ch], mIdx, "saisi", "phv"), "eur2");
  lineMarge.total = engine.fmt(engine.aggregate([ch], mIdx, "saisi", "marge"), "pct");
  lineMarge.totalColor = engine.markerColor(
    engine.aggregate([ch], mIdx, "saisi", "marge"),
    engine.aggregate([ch], mIdx, "base", "marge", null, true),
    "high",
  );

  if (isCG && met.key === "ca" && cat === "Total")
    lineBase.label =
      "= Baseline contrôle de gestion — choisissez une catégorie (Forfait / Réel / PAD / TE) pour la saisir";

  return detail;
}
