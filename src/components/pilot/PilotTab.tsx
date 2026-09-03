import { FULL_YEAR, REX_NAMES, ST, type Statut } from "../../data/constants";
import { REX } from "../../data/chantiers";
import type { PilotTab as PilotTabId } from "../../lib/types";
import type { Store } from "../../state/store";
import BudgetDonutCard from "../home/BudgetDonutCard";
import CaGaugeCard from "../home/CaGaugeCard";
import MonthlyEvolutionChart from "../home/MonthlyEvolutionChart";
import { CARD } from "../home/cardStyles";
import PilotSettings from "./PilotSettings";
import StatutBadge from "../StatutBadge";
import { BRAND, FS, INK, LINE, RADIUS, SHADOW, STATE, SURFACE } from "../../theme";
import { Kpi, PageHead } from "../ui";

const COL_HEAD: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  color: "#6b7681",
};

const TOP_GRID = "300px 120px 110px 130px 110px 100px 1fr";
const REX_GRID = "230px 90px 140px 1fr 150px 120px 120px 90px";

const TABS: PilotTabId[] = ["Vue d'ensemble", "Chantiers", "Responsables", "Réglages"];

/** Espace de pilotage du contrôle de gestion, découpé en onglets internes. */
export default function PilotTab({ store }: { store: Store }) {
  const { state, engine, set } = store;
  const tab = state.pilotTab;

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "20px 28px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <PageHead
        eyebrow={"Exercice " + state.year}
        title="Pilotage CDG"
        hint={engine.scope().length + " chantiers suivis · toutes entités"}
        right={
          <div
            style={{
              display: "flex",
              gap: 3,
              padding: 3,
              background: SURFACE.canvas,
              border: "1px solid " + LINE.base,
              borderRadius: RADIUS.control + 3,
            }}
          >
            {TABS.map((t) => {
              const on = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => set({ pilotTab: t })}
                  aria-pressed={on}
                  style={{
                    padding: "7px 14px",
                    border: 0,
                    borderRadius: RADIUS.control,
                    background: on ? SURFACE.card : "transparent",
                    color: on ? INK.strong : INK.muted,
                    boxShadow: on ? SHADOW.raised : "none",
                    fontFamily: "inherit",
                    fontSize: FS.body,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        }
      />

      {tab === "Vue d'ensemble" && <Overview store={store} />}
      {tab === "Chantiers" && <TopChantiers store={store} />}
      {tab === "Responsables" && <RexGrid store={store} />}
      {tab === "Réglages" && <PilotSettings store={store} />}
    </div>
  );
}

/** Indicateurs de portefeuille, CA global et avancement. */
function Overview({ store }: { store: Store }) {
  const { engine } = store;
  const all = engine.scope();
  const totCa = all.reduce((a, ch) => a + ch.ca, 0);
  // Les mêmes mesures que l'accueil, sur le portefeuille entier : un seul calcul,
  // un seul vocabulaire, des chiffres qui se recoupent d'un écran à l'autre.
  const p = engine.progress(true);

  return (
    <>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Kpi
          label="NOMBRE DE CHANTIERS"
          value={String(all.length)}
          hint={engine.fmt(totCa) + " de CA de référence"}
        />
        <Kpi
          label="BUDGETS DÉCLARÉS"
          value={p.declares + " / " + p.chantiers}
          meter={{
            pct: p.chantiers ? (p.declares / p.chantiers) * 100 : 0,
            color: ST["À valider"].accent,
          }}
          hint={p.aDeclarer + " chantiers pas encore commencés"}
        />
        <Kpi
          label="BUDGETS VALIDÉS"
          value={p.termines + " / " + p.chantiers}
          meter={{ pct: p.chantiers ? (p.termines / p.chantiers) * 100 : 0, color: ST["Validé"].accent }}
          hint={p.aControler + " en attente de contrôle"}
        />
        <Kpi
          label="À CONTRÔLER"
          value={String(p.aTraiter)}
          tone={p.critiques ? STATE.danger : INK.strong}
          hint={
            p.aTraiter === 0
              ? "rien en attente"
              : p.critiques + " critique" + (p.critiques > 1 ? "s" : "") + " · baselines et marges"
          }
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
        <div style={{ flex: "1 1 560px", minWidth: 380 }}>
          <MonthlyEvolutionChart store={store} />
        </div>
        <div
          style={{
            flex: "0 1 300px",
            minWidth: 260,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <CaGaugeCard store={store} compact />
          <BudgetDonutCard store={store} compact />
        </div>
      </div>
    </>
  );
}

/** Le portefeuille chantier par chantier : le CA, l'écart à l'objectif, ce qui manque. */
function TopChantiers({ store }: { store: Store }) {
  const { state, engine, openChantier } = store;

  const rows = engine
    .scope()
    .slice()
    .sort((a, b) => b.ca - a.ca)
    .map((ch) => {
      const st = engine.st(ch) as Statut;
      const miss = engine.missing(ch, FULL_YEAR);
      const doneM = FULL_YEAR.filter((m) => engine.prims(ch, m, "saisi")).length;
      const v = engine.aggregate([ch], FULL_YEAR, "saisi", "ca", "Total");
      const b = engine.aggregate([ch], FULL_YEAR, "base", "ca", "Total");
      const ec = v !== null && b ? ((v - b) / b) * 100 : null;
      return {
        ch,
        st,
        rex: REX[ch.id],
        ref: engine.fmt(ch.ca),
        declare: engine.fmt(v),
        pct: Math.round((doneM / 12) * 100) + "%",
        pctColor: doneM === 12 ? STATE.good : doneM >= 6 ? BRAND.base : STATE.danger,
        ecart:
          ec === null ? "—" : (ec >= 0 ? "+" : "−") + Math.abs(ec).toFixed(1).replace(".", ",") + " %",
        ecartColor: ec === null ? INK.faint : ec >= 0 ? STATE.good : ec > -3 ? STATE.warn : STATE.danger,
        risk:
          st === "Non budgétisé"
            ? "Non budgétisé"
            : miss.length
              ? miss.length + " mois manquants"
              : st === "À valider"
                ? "À valider"
                : "Complet",
        riskColor: st === "Non budgétisé" || miss.length ? STATE.danger : "#6b7681",
        flagged: !!state.flags[ch.id],
      };
    });

  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Chantiers du portefeuille</span>
        <span style={{ fontSize: 12, color: "#6b7681" }}>
          {rows.length} chantiers · du plus gros CA au plus petit
        </span>
      </div>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <div style={{ minWidth: 1040 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: TOP_GRID,
              alignItems: "center",
              gap: 10,
              paddingBottom: 8,
              borderBottom: "1px solid #eef1f4",
            }}
          >
            <span style={COL_HEAD}>Chantier</span>
            <span style={COL_HEAD}>REX</span>
            <span style={{ ...COL_HEAD, textAlign: "right" }}>CA réf.</span>
            <span style={{ ...COL_HEAD, textAlign: "right" }}>Déclaré</span>
            <span style={{ ...COL_HEAD, textAlign: "right" }}>Écart</span>
            <span style={{ ...COL_HEAD, textAlign: "right" }}>Saisie</span>
            <span style={COL_HEAD}>Alerte</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.ch.id}
              className="hov-fa"
              onClick={() => openChantier(r.ch.id)}
              style={{
                display: "grid",
                gridTemplateColumns: TOP_GRID,
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid #f4f6f8",
                borderLeft: "3px solid " + ST[r.st].accent,
                paddingLeft: 8,
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    flex: "0 0 auto",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#334155",
                    background: "#f1f5f9",
                    borderRadius: 5,
                    padding: "2px 6px",
                  }}
                >
                  {r.ch.id}
                </span>
                {r.flagged && (
                  <span title="Chantier signalé" style={{ flex: "0 0 auto", color: STATE.danger }}>
                    ⚑
                  </span>
                )}
                <span
                  style={{
                    minWidth: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#17202a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.ch.nom}
                </span>
                <StatutBadge st={r.st} engine={engine} size="sm" />
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "#3b4753",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.rex}
              </span>
              <span style={{ ...NUM, fontWeight: 700, color: "#17202a" }}>{r.ref}</span>
              <span style={{ ...NUM, color: "#475569" }}>{r.declare}</span>
              <span style={{ ...NUM, fontSize: 13, fontWeight: 700, color: r.ecartColor }}>
                {r.ecart}
              </span>
              <span style={{ ...NUM, fontSize: 13, fontWeight: 700, color: r.pctColor }}>
                {r.pct}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: r.riskColor, whiteSpace: "nowrap" }}
                >
                  {r.risk}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Avancement de chaque responsable exploitation — le tableau de référence, qui
 * remplace l'ancien doublon entre l'accueil et le pilotage. Tous les REX y
 * figurent, du moins avancé au plus avancé.
 */
function RexGrid({ store }: { store: Store }) {
  const { engine, set } = store;

  const rows = REX_NAMES.map((nom) => {
    const list = engine.scope().filter((ch) => REX[ch.id] === nom);
    let done = 0,
      tot = 0;
    list.forEach((ch) =>
      FULL_YEAR.forEach((m) => {
        tot++;
        if (engine.prims(ch, m, "saisi")) done++;
      }),
    );
    const pct = tot ? Math.round((done / tot) * 100) : 0;

    const bigs = list.filter((ch) => ch.big);
    const bigsMiss = bigs.filter(
      (ch) => engine.st(ch) === "Non budgétisé" || engine.missing(ch, FULL_YEAR).length,
    );
    const aFaire = list.filter((ch) => engine.todoFor(ch, FULL_YEAR, "Exploitation")).length;
    const crit = list.filter((ch) => {
      const t = engine.todoFor(ch, FULL_YEAR, "Exploitation");
      return t && t.crit;
    }).length;

    const ca = engine.aggregate(list, FULL_YEAR, "saisi", "ca", "Total");
    const base = engine.aggregate(list, FULL_YEAR, "base", "ca", "Total", true);
    const ecart = ca === null || base === null || !base ? null : ((ca - base) / base) * 100;

    return {
      nom,
      initials: engine.initials(nom),
      agences: Array.from(new Set(list.map((ch) => ch.agence))).join(", ") || "—",
      nb: list.length,
      bigs: bigs.length,
      bigsMiss: bigsMiss.length,
      pctNum: pct,
      pct: pct + "%",
      color: pct >= 90 ? STATE.good : pct >= 50 ? BRAND.base : STATE.danger,
      rest: aFaire
        ? aFaire + " à traiter" + (crit ? " · " + crit + " critique" + (crit > 1 ? "s" : "") : "")
        : "à jour",
      restColor: crit ? STATE.danger : aFaire ? STATE.warn : STATE.good,
      ca: engine.fmt(ca),
      base: engine.fmt(engine.aggregate(list, FULL_YEAR, "base", "ca", "Total")),
      ecart:
        ecart === null ? "—" : (ecart >= 0 ? "+" : "") + ecart.toFixed(1).replace(".", ",") + " %",
      ecartColor:
        ecart === null ? INK.faint : ecart >= 0 ? STATE.good : ecart > -3 ? STATE.warn : STATE.danger,
      pick: () => set({ tab: "Tableau prévisionnel", fRex: nom, fSearch: "", searchDraft: "" }),
    };
  }).sort((a, b) => a.pctNum - b.pctNum);

  const all = engine.scope();
  const totCa = engine.aggregate(all, FULL_YEAR, "saisi", "ca", "Total");
  const totBase = engine.aggregate(all, FULL_YEAR, "base", "ca", "Total");
  let totDone = 0,
    totCells = 0;
  all.forEach((ch) =>
    FULL_YEAR.forEach((m) => {
      totCells++;
      if (engine.prims(ch, m, "saisi")) totDone++;
    }),
  );
  const totPct = totCells ? Math.round((totDone / totCells) * 100) : 0;

  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Avancement par REX</span>
        <span style={{ fontSize: 12, color: "#6b7681" }}>
          {rows.length} responsables · les moins avancés en premier
        </span>
      </div>

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <div style={{ minWidth: 1080 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: REX_GRID,
              alignItems: "center",
              gap: 10,
              paddingBottom: 8,
              borderBottom: "1px solid #eef1f4",
            }}
          >
            <span style={COL_HEAD}>Responsable exploitation</span>
            <span style={{ ...COL_HEAD, textAlign: "right" }}>Chantiers</span>
            <span style={COL_HEAD}>Gros chantiers</span>
            <span style={COL_HEAD}>Avancement</span>
            <span style={COL_HEAD}>Reste à faire</span>
            <span style={{ ...COL_HEAD, textAlign: "right" }}>CA déclaré</span>
            <span style={{ ...COL_HEAD, textAlign: "right" }}>Objectif CG</span>
            <span style={{ ...COL_HEAD, textAlign: "right" }}>Écart</span>
          </div>

          {rows.map((r) => (
            <div
              key={r.nom}
              className="hov-fa"
              onClick={r.pick}
              title={"Filtrer le tableau sur " + r.nom}
              style={{
                display: "grid",
                gridTemplateColumns: REX_GRID,
                alignItems: "center",
                gap: 10,
                padding: "11px 0",
                borderBottom: "1px solid #f4f6f8",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <span
                  style={{
                    flex: "0 0 auto",
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "#eef2ff",
                    color: "#3730a3",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {r.initials}
                </span>
                <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#17202a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.nom}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: INK.faint,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.agences}
                  </span>
                </span>
              </span>

              <span style={{ ...NUM, fontWeight: 600, color: "#3b4753" }}>{r.nb}</span>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: r.bigsMiss ? STATE.danger : "#6b7681",
                  whiteSpace: "nowrap",
                }}
              >
                {r.bigs
                  ? r.bigs + " gros" + (r.bigsMiss ? " · " + r.bigsMiss + " en retard" : "")
                  : "—"}
              </span>

              <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span
                  style={{ flex: 1, height: 7, borderRadius: 6, background: "#eef1f4", overflow: "hidden" }}
                >
                  <span style={{ display: "block", height: 7, width: r.pct, background: r.color }} />
                </span>
                <span
                  style={{ flex: "0 0 auto", width: 40, fontSize: 12, fontWeight: 700, color: r.color }}
                >
                  {r.pct}
                </span>
              </span>

              <span style={{ fontSize: 12, fontWeight: 600, color: r.restColor, whiteSpace: "nowrap" }}>
                {r.rest}
              </span>

              <span style={{ ...NUM, fontWeight: 600, color: "#17202a" }}>{r.ca}</span>
              <span style={{ ...NUM, color: "#6b7681" }}>{r.base}</span>
              <span style={{ ...NUM, fontSize: 13, fontWeight: 700, color: r.ecartColor }}>
                {r.ecart}
              </span>
            </div>
          ))}

          {/* Total du portefeuille, pour recouper les lignes du dessus. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: REX_GRID,
              alignItems: "center",
              gap: 10,
              padding: "12px 0 2px",
              borderTop: "1px solid #e6eaee",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700 }}>Total portefeuille</span>
            <span style={{ ...NUM, fontWeight: 700 }}>{all.length}</span>
            <span />
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span
                style={{ flex: 1, height: 7, borderRadius: 6, background: "#eef1f4", overflow: "hidden" }}
              >
                <span
                  style={{ display: "block", height: 7, width: totPct + "%", background: BRAND.base }}
                />
              </span>
              <span
                style={{ flex: "0 0 auto", width: 40, fontSize: 12, fontWeight: 700, color: BRAND.base }}
              >
                {totPct}%
              </span>
            </span>
            <span />
            <span style={{ ...NUM, fontWeight: 700 }}>{engine.fmt(totCa)}</span>
            <span style={{ ...NUM, color: "#6b7681" }}>{engine.fmt(totBase)}</span>
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

const NUM: React.CSSProperties = {
  fontSize: 13,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};
