import { FULL_YEAR, ST, type Statut } from "../../data/constants";
import { REX } from "../../data/chantiers";
import type { Store } from "../../state/store";
import BudgetDonutCard from "./BudgetDonutCard";
import CaGaugeCard from "./CaGaugeCard";

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e6eaee",
  borderRadius: 14,
  padding: "16px 18px",
};

const LIST_BUTTON: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 4,
  padding: "9px 11px",
  border: "1px solid #f1f4f7",
  borderRadius: 9,
  background: "#fff",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  width: "100%",
};

const CODE_BADGE: React.CSSProperties = {
  flex: "0 0 auto",
  whiteSpace: "nowrap",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 11.5,
  fontWeight: 600,
  color: "#334155",
  background: "#f1f5f9",
  borderRadius: 5,
  padding: "2px 6px",
};

const NAME: React.CSSProperties = {
  minWidth: 0,
  flex: 1,
  fontSize: 13,
  fontWeight: 600,
  color: "#17202a",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const PILL: React.CSSProperties = {
  flex: "0 0 auto",
  padding: "2px 8px",
  borderRadius: 20,
  fontSize: 10.5,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const COL_HEAD: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: "#8a95a1",
};

const REX_GRID = "210px 80px 1fr 160px 120px 100px";

export default function HomeTab({ store }: { store: Store }) {
  const { state, engine, set, openChantier } = store;
  const pct = engine.campaignPct();
  const groups = engine.budgetGroups();

  const todo = engine
    .perim()
    .map((ch) => ({ ch, t: engine.todoFor(ch, FULL_YEAR, "Exploitation") }))
    .filter((x) => x.t)
    .sort((a, b) => (a.t!.crit ? 0 : 1) - (b.t!.crit ? 0 : 1) || b.ch.ca - a.ch.ca)
    .slice(0, 6);

  const todoCount = (() => {
    const parts: string[] = [];
    if (groups.remplir.length) parts.push(groups.remplir.length + " à remplir");
    if (groups.attente.length)
      parts.push(groups.attente.length + " non budgétisé" + (groups.attente.length > 1 ? "s" : ""));
    return parts.length ? parts.join(" + ") : "rien à traiter";
  })();

  const doneAll = engine
    .perim()
    .filter((ch) => ["Validé", "Clôturé"].includes(engine.st(ch)));
  const done = doneAll.slice(0, 12);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "22px 28px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Bandeau campagne */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          padding: "12px 16px",
          background: "#fff",
          border: "1px solid #e6eaee",
          borderRadius: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px" }}>
            Budget prévisionnel janvier – décembre {state.year}
          </div>
          <div style={{ fontSize: 12, color: "#8a95a1", marginTop: 1 }}>
            {engine.campaignShort()}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{ width: 130, height: 6, borderRadius: 6, background: "#eef1f4", overflow: "hidden" }}
          >
            <div style={{ height: 6, width: pct, background: "#0a9bd8" }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0a9bd8" }}>{pct}</div>
        </div>
        <button
          onClick={() => set({ tab: "Tableau prévisionnel" })}
          style={{
            padding: "8px 13px",
            border: 0,
            borderRadius: 8,
            background: "#0a9bd8",
            color: "#fff",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Ouvrir le tableau
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 14,
          alignItems: "start",
        }}
      >
        <CaGaugeCard store={store} />
        <BudgetDonutCard store={store} />

        {/* À traiter en priorité */}
        <div style={CARD}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>À traiter en priorité</span>
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: "#8a95a1" }}>{todoCount}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {todo.map(({ ch, t }) => (
              <button
                key={ch.id}
                className="hov-f8"
                onClick={() => openChantier(ch.id)}
                title={ch.id + " · " + ch.nom + " — " + t!.hint}
                style={{ ...LIST_BUTTON, borderLeft: "3px solid " + (t!.crit ? "#dc2626" : "#f59e0b") }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={CODE_BADGE}>{ch.id}</span>
                  <span style={NAME}>{ch.nom}</span>
                  <span
                    style={{
                      ...PILL,
                      background: t!.crit ? "#fee2e2" : "#fef3c7",
                      color: t!.crit ? "#991b1b" : "#92400e",
                    }}
                  >
                    {t!.tag}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: t!.crit ? "#b91c1c" : "#92400e",
                    lineHeight: 1.35,
                  }}
                >
                  {t!.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Budgets terminés */}
        <div style={{ ...CARD, gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Budgets terminés</span>
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: "#8a95a1" }}>
              {doneAll.length} chantiers
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 8,
              marginTop: 12,
            }}
          >
            {done.map((ch) => {
              const st = engine.st(ch) as Statut;
              const total = engine.aggregate([ch], FULL_YEAR, "saisi", "ca", "Total");
              return (
                <button
                  key={ch.id}
                  className="hov-f8"
                  onClick={() => openChantier(ch.id)}
                  title={ch.id + " · " + ch.nom + " — " + ch.entite + " · budget " + st.toLowerCase()}
                  style={{ ...LIST_BUTTON, borderLeft: "3px solid " + ST[st].accent }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={CODE_BADGE}>{ch.id}</span>
                    <span style={NAME}>{ch.nom}</span>
                    <span style={{ ...PILL, background: ST[st].bg, color: ST[st].fg }}>{st}</span>
                  </span>
                  <span style={{ fontSize: 11.5, color: "#8a95a1", lineHeight: 1.35 }}>
                    {ch.entite + " · " + engine.fmt(total) + " budgétés"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {engine.isCG && <RexConsolidated store={store} />}
    </div>
  );
}

/** Vue consolidée réservée au contrôle de gestion : une ligne par responsable exploitation. */
function RexConsolidated({ store }: { store: Store }) {
  const { state, engine, set } = store;
  const names = Array.from(new Set(Object.values(REX)));

  const rows = names.map((nom) => {
    const list = engine
      .scope()
      .filter(
        (ch) =>
          REX[ch.id] === nom &&
          (state.fTag === "Tous les tags" || (state.tags[ch.id] || []).includes(state.fTag)),
      );
    let done = 0,
      tot = 0;
    list.forEach((ch) =>
      FULL_YEAR.forEach((m) => {
        tot++;
        if (engine.prims(ch, m, "saisi")) done++;
      }),
    );
    const pct = tot ? Math.round((done / tot) * 100) : 0;
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
      agence: Array.from(new Set(list.map((ch) => ch.agence))).join(", ") || "—",
      nb: list.length,
      pct: pct + "%",
      color: pct >= 90 ? "#16a34a" : pct >= 50 ? "#0a9bd8" : "#dc2626",
      rest: aFaire
        ? aFaire + " à traiter" + (crit ? " · " + crit + " critique" + (crit > 1 ? "s" : "") : "")
        : "à jour",
      restColor: crit ? "#b91c1c" : aFaire ? "#92400e" : "#16a34a",
      ca: engine.fmt(ca),
      ecart:
        ecart === null ? "—" : (ecart >= 0 ? "+" : "") + ecart.toFixed(1).replace(".", ",") + " %",
      ecartColor:
        ecart === null ? "#94a3b8" : ecart >= 0 ? "#15803d" : ecart > -3 ? "#b45309" : "#dc2626",
      pick: () =>
        set({
          tab: "Tableau prévisionnel",
          fRex: state.fRex === nom ? "Tous" : nom,
          fSearch: "",
          searchDraft: "",
        }),
    };
  });

  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>
          Vue consolidée — avancement des REX
        </span>
        <span style={{ fontSize: 11.5, color: "#8a95a1" }}>
          {"Suivi global de la campagne " +
            state.year +
            (state.fEntity === "Toutes" ? " · toutes entités" : " · " + state.fEntity) +
            (state.fTag === "Tous les tags" ? "" : " · tag " + state.fTag)}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: REX_GRID,
          alignItems: "center",
          gap: 10,
          marginTop: 14,
          paddingBottom: 8,
          borderBottom: "1px solid #eef1f4",
        }}
      >
        <span style={COL_HEAD}>Responsable exploitation</span>
        <span style={COL_HEAD}>Chantiers</span>
        <span style={COL_HEAD}>Avancement</span>
        <span style={COL_HEAD}>Reste à faire</span>
        <span style={{ ...COL_HEAD, textAlign: "right" }}>CA déclaré</span>
        <span style={{ ...COL_HEAD, textAlign: "right" }}>Écart obj.</span>
      </div>

      {rows.map((r) => (
        <div
          key={r.nom}
          className="hov-fa"
          onClick={r.pick}
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
                fontSize: 10.5,
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
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.agence}</span>
            </span>
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#3b4753" }}>{r.nb}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span
              style={{
                flex: 1,
                height: 7,
                borderRadius: 6,
                background: "#eef1f4",
                overflow: "hidden",
              }}
            >
              <span style={{ display: "block", height: 7, width: r.pct, background: r.color }} />
            </span>
            <span style={{ flex: "0 0 auto", width: 40, fontSize: 12, fontWeight: 700, color: r.color }}>
              {r.pct}
            </span>
          </span>
          <span style={{ fontSize: 12, color: r.restColor, fontWeight: 600 }}>{r.rest}</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#17202a",
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {r.ca}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: r.ecartColor,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {r.ecart}
          </span>
        </div>
      ))}
    </div>
  );
}
