import { CONFIG } from "../../config";
import { CAT_COLORS, type CatKey } from "../../data/constants";
import type { Store } from "../../state/store";

/** Circonférence du tracé (r = 17,2). */
const C = 108.1;

/**
 * Carré « CA déclaré » : anneau segmenté par catégorie, gradué sur l'objectif CDG.
 * Survoler une section l'épaissit, atténue les autres et ouvre une carte compacte.
 */
export default function CaGaugeCard({ store }: { store: Store }) {
  const { state, engine, set } = store;
  const isCG = engine.isCG;
  const parts = engine.caParts(isCG);
  const baseTotal = engine.caBaseTotal(isCG);
  const declared = parts.reduce((a, x) => a + x.value, 0);

  const gaugePx = CONFIG.gaugeSize;
  const gaugeInset = Math.round(gaugePx * 0.215);
  const gaugeValueSize = gaugePx < 130 ? 15 : 20;

  const deltaPct = baseTotal
    ? ((declared - baseTotal) >= 0 ? "+" : "−") +
      Math.abs(((declared - baseTotal) / baseTotal) * 100)
        .toFixed(1)
        .replace(".", ",") +
      " %"
    : "";
  const deltaColor = declared >= baseTotal ? "#15803d" : "#dc2626";

  const prev = engine.caPrevTotal(isCG);
  const n1Delta = !prev
    ? "—"
    : (declared >= prev ? "+" : "−") +
      Math.abs(((declared - prev) / prev) * 100)
        .toFixed(1)
        .replace(".", ",") +
      " % vs " +
      (state.year - 1);
  const n1Color = !prev ? "#94a3b8" : declared >= prev ? "#15803d" : "#dc2626";

  // Sections cumulées sur l'échelle de l'objectif : l'anneau complet = 100 % de l'objectif CDG.
  let acc = 0;
  const segs = parts.map((x) => {
    const len = Math.max(0, Math.min(C, (x.value / (baseTotal || 1)) * C));
    const off = -acc / (baseTotal || 1) * C;
    acc += x.value;
    const hov = state.hoverSeg === x.key;
    return {
      key: x.key,
      color: CAT_COLORS[x.key as CatKey],
      dash: len.toFixed(2) + " " + C,
      offset: off.toFixed(2),
      width: hov ? 6.4 : 4.6,
      opacity: state.hoverSeg && !hov ? 0.35 : 1,
    };
  });

  const hovered = parts.find((x) => x.key === state.hoverSeg);
  const segCard = hovered
    ? (() => {
        const d = hovered.value - hovered.base;
        const up = d >= 0;
        return {
          label: hovered.label,
          dot: CAT_COLORS[hovered.key as CatKey],
          value: engine.fmt(hovered.value),
          deltaColor: up ? "#4ade80" : "#fca5a5",
          rate: hovered.base
            ? (up ? "+" : "−") +
              Math.abs((d / hovered.base) * 100)
                .toFixed(1)
                .replace(".", ",") +
              " % vs objectif"
            : "objectif non défini",
        };
      })()
    : null;

  return (
    <div
      style={{
        maxWidth: 400,
        aspectRatio: "1 / 1",
        background: "#fff",
        border: "1px solid #e6eaee",
        borderRadius: 14,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>
          {isCG ? "CA déclaré consolidé — toutes exploitations" : "CA déclaré sur mon périmètre"}
        </span>
        <span style={{ fontSize: 11, color: "#6b7681" }}>
          {isCG
            ? "Exercice " +
              state.year +
              (state.fEntity === "Toutes" ? " · toutes entités" : " · " + state.fEntity)
            : "Exercice " + state.year + " · chantiers dont vous êtes responsable"}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <div
          onMouseEnter={() => set({ hoverPie: "all" })}
          onMouseLeave={() => set({ hoverPie: null, hoverSeg: null })}
          style={{
            position: "relative",
            width: gaugePx,
            height: gaugePx,
            flex: "0 0 auto",
            cursor: "pointer",
          }}
        >
          <svg viewBox="0 0 42 42" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
            <circle cx="21" cy="21" r="17.2" fill="none" stroke="#eef1f4" strokeWidth="4" />
            {segs.map((g) => (
              <circle
                key={g.key}
                cx="21"
                cy="21"
                r="17.2"
                fill="none"
                stroke={g.color}
                strokeWidth={g.width}
                strokeDasharray={g.dash}
                strokeDashoffset={g.offset}
                opacity={g.opacity}
                onMouseEnter={() => set({ hoverSeg: g.key })}
                onMouseLeave={() => set({ hoverSeg: null })}
                style={{ cursor: "pointer", transition: "stroke-width 140ms ease, opacity 140ms ease" }}
              />
            ))}
          </svg>

          {segCard && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: -8,
                transform: "translate(-50%, -100%)",
                zIndex: 6,
                whiteSpace: "nowrap",
                padding: "6px 9px",
                background: "#17202a",
                color: "#fff",
                borderRadius: 8,
                boxShadow: "0 8px 18px rgba(15,23,42,0.2)",
                pointerEvents: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: segCard.dot }} />
                <span style={{ fontSize: 11.5, fontWeight: 600 }}>{segCard.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{segCard.value}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: segCard.deltaColor }}>
                  {segCard.rate}
                </span>
              </div>
            </div>
          )}

          <div
            style={{
              position: "absolute",
              inset: gaugeInset,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: gaugeValueSize,
                fontWeight: 700,
                letterSpacing: "-0.5px",
                color: "#17202a",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              {engine.fmt(declared)}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: deltaColor,
                marginTop: 1,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {deltaPct}
            </span>
          </div>
        </div>

        {CONFIG.showObjectiveBlock && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.4px",
                textTransform: "uppercase",
                color: "#6b7681",
              }}
            >
              Objectif CDG
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#475569",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {engine.fmt(baseTotal)}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>complétion {engine.fillPct(isCG)}</span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              color: "#6b7681",
            }}
          >
            Réalisé N-1
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#475569",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {engine.fmt(prev)}
          </span>
          <span
            style={{ fontSize: 12, fontWeight: 700, color: n1Color, fontVariantNumeric: "tabular-nums" }}
          >
            {n1Delta}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "4px 14px",
            width: "100%",
            marginTop: 2,
          }}
        >
          {parts.map((x) => {
            const d = x.value - x.base;
            const up = d >= 0;
            return (
              <div
                key={x.key}
                onMouseEnter={() => set({ hoverPie: "all", hoverSeg: x.key })}
                onMouseLeave={() => set({ hoverSeg: null })}
                title={
                  x.label +
                  " — objectif " +
                  engine.fmt(x.base) +
                  " · déclaré " +
                  engine.fmt(x.value) +
                  (x.base ? " (" + Math.round((x.value / x.base) * 100) + " % de l'objectif)" : "")
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "5px 7px",
                  borderRadius: 7,
                  background: state.hoverSeg === x.key ? "#f4f6f8" : "transparent",
                  transition: "background 140ms ease",
                }}
              >
                <span
                  style={{
                    flex: "0 0 auto",
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: CAT_COLORS[x.key as CatKey],
                  }}
                />
                <span
                  style={{
                    minWidth: 0,
                    flex: 1,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#3b4753",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {x.label}
                </span>
                <span
                  style={{
                    flex: "0 0 auto",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#17202a",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {engine.fmt(x.value)}
                </span>
                <span
                  style={{
                    flex: "0 0 auto",
                    fontSize: 11,
                    fontWeight: 700,
                    color: up ? "#16a34a" : "#dc2626",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {x.base
                    ? (up ? "+" : "−") +
                      Math.abs((d / x.base) * 100)
                        .toFixed(1)
                        .replace(".", ",") +
                      " %"
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
