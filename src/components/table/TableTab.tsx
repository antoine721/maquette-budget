import { CAT, PER_MONTHS, SHORT, ST, STATUT_OPTS, type Statut } from "../../data/constants";
import type { Chantier } from "../../data/chantiers";
import type { Store } from "../../state/store";
import AdminPeriods from "./AdminPeriods";
import ChantierDetail from "./ChantierDetail";
import Coefficients from "./Coefficients";
import FilterBar from "./FilterBar";

const ALL_FIELDS = CAT.map((c) => c.k as string).concat(["heures", "masse"]);

/** Séparateurs de trimestre. */
const sepColor = (m: number) => (m === 2 || m === 5 || m === 8 ? "#e6eaee" : "transparent");

export default function TableTab({ store }: { store: Store }) {
  const { state, engine, set } = store;
  const met = engine.metric;
  const cat = state.cat;
  const catLabel = cat === "Total" ? "CA total" : "CA " + cat;
  const mIdx = PER_MONTHS[state.fPeriode];

  // La largeur de colonne s'élargit quand la période est courte.
  const colW = mIdx.length <= 3 ? 160 : mIdx.length <= 6 ? 110 : 82;
  const gridCols = "460px repeat(" + mIdx.length + ", " + colW + "px) 120px";
  const gridColsDetail = "420px repeat(" + mIdx.length + ", " + colW + "px) 120px";
  const tableMin = 460 + mIdx.length * colW + 120 + "px";

  const list = engine.sorted(engine.filtered(), mIdx);
  const shown = list.slice(0, state.pageSize);

  const totals = mIdx.map((m) => {
    const v = engine.aggregate(list, [m], "saisi", met.key, cat);
    const b = engine.aggregate(list, [m], "base", met.key, cat, true);
    return {
      m,
      text: engine.fmt(v, met.kind),
      color: engine.markerColor(v, b, met.better),
    };
  });
  const grandTotal = engine.fmt(engine.aggregate(list, mIdx, "saisi", met.key, cat), met.kind);

  return (
    <div style={{ flex: 1, minWidth: 0, padding: "22px 28px 48px" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e6eaee",
          borderRadius: 16,
          padding: "18px 20px 22px",
        }}
      >
        <FilterBar store={store} />

        {state.role === "Admin" && <AdminPeriods store={store} />}
        {engine.isCG && (
          <Coefficients store={store} mIdx={mIdx} gridCols={gridCols} tableMin={tableMin} />
        )}

        <div
          style={{
            marginTop: 20,
            border: "1px solid #e6eaee",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "13px 18px",
              background: "#f8fafb",
              borderBottom: "1px solid #eef1f4",
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#3b4753" }}>
              {list.length +
                " chantier" +
                (list.length > 1 ? "s" : "") +
                " · " +
                state.year +
                " · " +
                state.fPeriode +
                " · " +
                (met.key === "ca" ? catLabel : met.label)}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 12,
                color: "#6b7681",
                flexWrap: "wrap",
              }}
            >
              {STATUT_OPTS.map((x) => (
                <div key={x} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      border: "1px solid " + ST[x].border,
                      background: ST[x].cell,
                      display: "inline-block",
                    }}
                  />
                  {x}
                </div>
              ))}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: tableMin }}>
              {/* En-tête */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: gridCols,
                  alignItems: "center",
                  background: "#fff",
                  borderBottom: "1px solid #e6eaee",
                }}
              >
                <div
                  style={{
                    padding: "11px 16px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.7px",
                    textTransform: "uppercase",
                    color: "#8a95a1",
                    position: "sticky",
                    left: 0,
                    background: "#fff",
                    zIndex: 2,
                  }}
                >
                  Code chantier / site
                </div>
                {mIdx.map((m) => {
                  const open = state.periods["Saint Ouen"][m];
                  return (
                    <div
                      key={m}
                      style={{
                        padding: "11px 8px",
                        textAlign: "right",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        color: open ? "#0a9bd8" : "#8a95a1",
                        borderRight: "1px solid " + sepColor(m),
                        background: open ? "#f5fbff" : "#fff",
                      }}
                    >
                      {SHORT[m]}
                    </div>
                  );
                })}
                <div
                  style={{
                    padding: "11px 16px",
                    textAlign: "right",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.7px",
                    textTransform: "uppercase",
                    color: "#8a95a1",
                  }}
                >
                  {met.agg === "ratio" ? "Moyenne" : "Total"}
                </div>
              </div>

              {shown.map((ch) => (
                <Row
                  key={ch.id}
                  store={store}
                  ch={ch}
                  mIdx={mIdx}
                  gridCols={gridCols}
                  gridColsDetail={gridColsDetail}
                />
              ))}

              {list.length > shown.length && (
                <div
                  style={{
                    position: "sticky",
                    left: 0,
                    display: "flex",
                    justifyContent: "center",
                    padding: 12,
                  }}
                >
                  <button
                    className="hov-f4"
                    onClick={() => set((p) => ({ pageSize: p.pageSize + 40 }))}
                    style={{
                      padding: "9px 18px",
                      border: "1px solid #dde3e8",
                      borderRadius: 8,
                      background: "#fff",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#3b4753",
                      cursor: "pointer",
                    }}
                  >
                    {"Afficher 40 chantiers de plus (" + shown.length + " / " + list.length + ")"}
                  </button>
                </div>
              )}

              {/* Total du périmètre filtré — calculé sur toute la liste, pas seulement la page. */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: gridCols,
                  alignItems: "center",
                  background: "#f8fafb",
                  borderTop: "1px solid #e6eaee",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    position: "sticky",
                    left: 0,
                    background: "#f8fafb",
                  }}
                >
                  Total périmètre filtré
                </div>
                {totals.map((t) => (
                  <div
                    key={t.m}
                    style={{
                      padding: "14px 8px",
                      textAlign: "right",
                      fontSize: 13,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      color: t.color,
                      borderRight: "1px solid " + sepColor(t.m),
                    }}
                  >
                    {t.text}
                  </div>
                ))}
                <div
                  style={{
                    padding: "14px 16px",
                    textAlign: "right",
                    fontSize: 14,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {grandTotal}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Une ligne chantier, repliée ou dépliée sur son détail. */
function Row({
  store,
  ch,
  mIdx,
  gridCols,
  gridColsDetail,
}: {
  store: Store;
  ch: Chantier;
  mIdx: number[];
  gridCols: string;
  gridColsDetail: string;
}) {
  const { state, engine, set } = store;
  const met = engine.metric;
  const cat = state.cat;
  const st = engine.st(ch) as Statut;
  const stc = ST[st];
  const open = state.openRow === ch.id;
  const rowBg = open ? "#fbfcfd" : "#fff";

  const cells = mIdx.map((m) => {
    const v = engine.metricFrom(engine.prims(ch, m, "saisi"), met.key, cat);
    const b = engine.metricFrom(engine.prims(ch, m, "base"), met.key, cat);
    const periodOpen = state.periods[ch.agence][m];
    const touched = ALL_FIELDS.some(
      (f) => engine.edited(ch, f, m, false) || engine.edited(ch, f, m, true),
    );
    return {
      m,
      text: engine.fmt(v, met.kind),
      color: engine.markerColor(v, b, met.better),
      bg: v === null ? (periodOpen ? "#fffbeb" : "#fff") : stc.cell,
      mark: touched ? "#0a9bd8" : "transparent",
      markTitle: touched ? "Valeur modifiée manuellement" : "",
    };
  });

  const rowSaisi = engine.aggregate([ch], mIdx, "saisi", met.key, cat);
  const filledM = mIdx.filter((m) => engine.prims(ch, m, "saisi"));
  const nEdits = mIdx.reduce(
    (a, m) =>
      a +
      ALL_FIELDS.filter((f) => engine.edited(ch, f, m, false) || engine.edited(ch, f, m, true))
        .length,
    0,
  );
  const mine = state.history.filter((h) => h.cible === ch.id);
  const last = mine.length ? mine[mine.length - 1] : null;
  const tags = state.tags[ch.id] || [];

  return (
    <div style={{ borderBottom: "1px solid #f1f4f7", background: rowBg }}>
      <div
        onClick={() => set({ openRow: open ? null : ch.id })}
        style={{
          display: "grid",
          gridTemplateColumns: gridCols,
          alignItems: "stretch",
          cursor: "pointer",
          borderLeft: "3px solid " + stc.accent,
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
            position: "sticky",
            left: 0,
            background: rowBg,
            zIndex: 1,
          }}
        >
          <span style={{ width: 14, color: "#8a95a1", fontSize: 11 }}>{open ? "▾" : "▸"}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span
                title={ch.nom}
                style={{
                  fontSize: 15.5,
                  fontWeight: 700,
                  letterSpacing: "-0.2px",
                  color: "#17202a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {ch.nom}
              </span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, minWidth: 0 }}
            >
              <span
                style={{
                  flex: "0 0 auto",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#94a3b8",
                  whiteSpace: "nowrap",
                }}
              >
                {ch.id}
              </span>
              <span style={{ flex: "0 0 auto", color: "#d5dbe1" }}>·</span>
              <span
                style={{
                  fontSize: 12,
                  color: "#8a95a1",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {ch.entite +
                  " · " +
                  ch.ville +
                  " · " +
                  ch.agence +
                  (engine.isCG ? " · " + ch.client : "")}
              </span>
              <span
                title={
                  last
                    ? "Dernière action : " + last.label + " (" + last.count + " cellules)"
                    : "Aucune action manuelle sur ce chantier"
                }
                style={{
                  flex: "0 0 auto",
                  padding: "1px 7px",
                  borderRadius: 20,
                  fontSize: 10.5,
                  fontWeight: 700,
                  background: nEdits ? "#e8f6fd" : "#f4f6f8",
                  color: nEdits ? "#0782b6" : "#8a95a1",
                  whiteSpace: "nowrap",
                }}
              >
                {filledM.length +
                  "/" +
                  mIdx.length +
                  " mois saisis" +
                  (nEdits ? " · " + nEdits + " modif." : "")}
              </span>
            </div>
            {mine.length > 0 && (
              <div
                title={mine.map((h) => h.label + " (" + h.count + " cellules)").join("  |  ")}
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: 2,
                }}
              >
                {mine.map((h) => h.short).join(" · ")}
              </div>
            )}
          </div>
          <span style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 5 }}>
            {tags.map((tg) => (
              <span
                key={tg}
                title="Tag de suivi — contrôle de gestion"
                style={{
                  padding: "3px 8px",
                  borderRadius: 20,
                  fontSize: 10.5,
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
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                background: stc.bg,
                color: stc.fg,
                border: "1px solid " + stc.border,
              }}
            >
              {st}
            </span>
          </span>
        </div>

        {cells.map((c) => (
          <div
            key={c.m}
            title={c.markTitle}
            style={{
              padding: "12px 8px",
              textAlign: "right",
              fontSize: 13,
              fontVariantNumeric: "tabular-nums",
              fontWeight: 500,
              color: c.color,
              background: c.bg,
              borderRight: "1px solid " + sepColor(c.m),
              boxShadow: "inset 0 -2px 0 " + c.mark,
            }}
          >
            {c.text}
          </div>
        ))}

        <div
          style={{
            padding: "12px 16px",
            textAlign: "right",
            fontSize: 14,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            background: st === "Validé" || st === "Clôturé" ? stc.cell : "transparent",
          }}
        >
          {engine.fmt(rowSaisi, met.kind)}
        </div>
      </div>

      {open && (
        <ChantierDetail store={store} ch={ch} mIdx={mIdx} gridColsDetail={gridColsDetail} />
      )}
    </div>
  );
}
