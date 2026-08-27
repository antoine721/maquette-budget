import { FULL_YEAR, REX_NAMES, ST, type Statut } from "../../data/constants";
import { REX } from "../../data/chantiers";
import type { Store } from "../../state/store";

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e6eaee",
  borderRadius: 14,
  padding: "16px 18px",
};

const COL_HEAD: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  color: "#8a95a1",
};

const TOP_GRID = "300px 120px 110px 130px 110px 100px 1fr";
const REX_GRID = "26px 1fr 92px 128px 130px";

/** Onglet de pilotage du contrôle de gestion : concentration du CA et avancement par REX. */
export default function PilotTab({ store }: { store: Store }) {
  const { state, engine, set, openChantier } = store;

  const all = engine.scope();
  const big = all.filter((ch) => ch.big);
  const bigCa = big.reduce((a, ch) => a + ch.ca, 0);
  const totCa = all.reduce((a, ch) => a + ch.ca, 0);
  const bigMiss = big.filter(
    (ch) => engine.st(ch) === "Non budgétisé" || engine.missing(ch, FULL_YEAR).length,
  );
  const missCa = bigMiss.reduce((a, ch) => a + ch.ca, 0);

  const kpis = [
    {
      label: "Portefeuille suivi",
      value: String(all.length),
      hint: engine.fmt(totCa) + " de CA de référence",
      color: "#17202a",
    },
    {
      label: "Top 20 chantiers",
      value: totCa ? Math.round((bigCa / totCa) * 100) + " %" : "—",
      hint: engine.fmt(bigCa) + " concentrés",
      color: "#0a9bd8",
    },
    {
      label: "Gros chantiers non déclarés",
      value: bigMiss.length + "/" + big.length,
      hint: engine.fmt(missCa) + " de CA à risque",
      color: bigMiss.length ? "#dc2626" : "#16a34a",
    },
    {
      label: "Avancement global",
      value: (() => {
        let d = 0,
          t = 0;
        all.forEach((ch) =>
          FULL_YEAR.forEach((m) => {
            t++;
            if (engine.prims(ch, m, "saisi")) d++;
          }),
        );
        return (t ? Math.round((d / t) * 100) : 0) + " %";
      })(),
      hint: "cellules saisies",
      color: "#475569",
    },
  ];

  const topRows = big
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
        pctColor: doneM === 12 ? "#16a34a" : doneM >= 6 ? "#0a9bd8" : "#dc2626",
        ecart:
          ec === null
            ? "—"
            : (ec >= 0 ? "+" : "−") + Math.abs(ec).toFixed(1).replace(".", ",") + " %",
        ecartColor: ec === null ? "#94a3b8" : ec >= 0 ? "#15803d" : ec > -3 ? "#b45309" : "#dc2626",
        risk:
          st === "Non budgétisé"
            ? "Non budgétisé"
            : miss.length
              ? miss.length + " mois manquants"
              : st === "À valider"
                ? "À valider"
                : "Complet",
        riskColor: st === "Non budgétisé" || miss.length ? "#b91c1c" : "#6b7681",
        tags: state.tags[ch.id] || [],
      };
    });

  const rexRows = REX_NAMES.map((nom) => {
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
    return {
      nom,
      initials: engine.initials(nom),
      nb: list.length,
      bigs: bigs.length
        ? bigs.length + " gros" + (bigsMiss.length ? " · " + bigsMiss.length + " en retard" : "")
        : "—",
      bigsColor: bigsMiss.length ? "#b91c1c" : "#6b7681",
      pct: pct + "%",
      color: pct >= 90 ? "#16a34a" : pct >= 50 ? "#0a9bd8" : "#dc2626",
      pick: () =>
        set({ tab: "Tableau prévisionnel", fRex: nom, fSearch: "", searchDraft: "" }),
    };
  }).sort((a, b) => parseInt(a.pct, 10) - parseInt(b.pct, 10));

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "22px 28px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 14,
        }}
      >
        {kpis.map((k) => (
          <div key={k.label} style={{ ...CARD, padding: "14px 16px" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.4px",
                textTransform: "uppercase",
                color: "#8a95a1",
              }}
            >
              {k.label}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "-0.6px",
                color: k.color,
              }}
            >
              {k.value}
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: "#8a95a1" }}>{k.hint}</div>
          </div>
        ))}
      </div>

      <div style={CARD}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Top 20 chantiers — 80 % du CA</span>
          <span style={{ fontSize: 11.5, color: "#8a95a1" }}>
            triés par CA de référence · les manquants sont prioritaires
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
            {topRows.map((r) => (
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
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "#334155",
                      background: "#f1f5f9",
                      borderRadius: 5,
                      padding: "2px 6px",
                    }}
                  >
                    {r.ch.id}
                  </span>
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
                  <span
                    style={{
                      flex: "0 0 auto",
                      padding: "2px 8px",
                      borderRadius: 20,
                      fontSize: 10.5,
                      fontWeight: 700,
                      background: ST[r.st].bg,
                      color: ST[r.st].fg,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.st}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    color: "#3b4753",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.rex}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#17202a",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.ref}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "#475569",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.declare}
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: r.ecartColor,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.ecart}
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: r.pctColor,
                    textAlign: "right",
                  }}
                >
                  {r.pct}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: r.riskColor, whiteSpace: "nowrap" }}
                  >
                    {r.risk}
                  </span>
                  {r.tags.map((tg) => (
                    <span
                      key={tg}
                      style={{
                        padding: "2px 7px",
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 700,
                        background: "#f3f0ff",
                        color: "#5b21b6",
                        border: "1px solid #ddd6fe",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tg}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={CARD}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Avancement par REX</span>
          <span style={{ fontSize: 11.5, color: "#8a95a1" }}>les moins avancés en premier</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: "6px 20px",
            marginTop: 12,
          }}
        >
          {rexRows.map((r) => (
            <div
              key={r.nom}
              className="hov-f8"
              onClick={r.pick}
              style={{
                display: "grid",
                gridTemplateColumns: REX_GRID,
                alignItems: "center",
                gap: 10,
                padding: 8,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#eef2ff",
                  color: "#3730a3",
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {r.initials}
              </span>
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
                {r.nom}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#6b7681",
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {r.nb} chantiers
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: r.bigsColor,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.bigs}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{ flex: 1, height: 6, borderRadius: 6, background: "#eef1f4", overflow: "hidden" }}
                >
                  <span style={{ display: "block", height: 6, width: r.pct, background: r.color }} />
                </span>
                <span
                  style={{
                    flex: "0 0 auto",
                    width: 38,
                    fontSize: 12,
                    fontWeight: 700,
                    color: r.color,
                    textAlign: "right",
                  }}
                >
                  {r.pct}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
